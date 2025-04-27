import { ProjectConfig } from '../../src/types/config.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupDocker(config: ProjectConfig, projectPath: string): Promise<void> {
  if (!config.docker) {
    return;
  }

  const dockerfilePath = path.join(projectPath, 'Dockerfile');
  const dockerComposeFilePath = path.join(projectPath, 'docker-compose.yml');

  const dbType = config.database.type;
  const dbConfig = {
    postgresql: {
      image: 'postgres:15-alpine',
      port: '5432',
      envPrefix: 'POSTGRES'
    },
    mysql: {
      image: 'mysql:8',
      port: '3306',
      envPrefix: 'MYSQL'
    },
    mongodb: {
      image: 'mongo:6',
      port: '27017',
      envPrefix: 'MONGO_INITDB'
    },
    h2: {
      image: 'openjdk:17-jdk-slim',
      port: '8082',
      envPrefix: 'H2'
    }
  };

  const dbProps = dbConfig[dbType];

  const dockerfileContent = `FROM openjdk:17-jdk-slim
WORKDIR /app
COPY backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]`;

  const dockerComposeContent = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    depends_on:
      - db
  db:
    image: ${dbProps.image}
    ports:
      - "${dbProps.port}:${dbProps.port}"
    environment:
      - ${dbProps.envPrefix}_DB=app
      - ${dbProps.envPrefix}_USER=${config.database.username}
      - ${dbProps.envPrefix}_PASSWORD=${config.database.password}`;

  await fs.writeFile(dockerfilePath, dockerfileContent);
  await fs.writeFile(dockerComposeFilePath, dockerComposeContent);
}

async function setupDockerCompose(projectPath: string, config: ProjectConfig) {
  const dockerCompose = `
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=${getDatabaseUrl(config)}
      - SPRING_DATASOURCE_USERNAME=${getDefaultUsername(config)}
      - SPRING_DATASOURCE_PASSWORD=${getDefaultPassword(config)}
    depends_on:
      - db
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - frontend
    networks:
      - app-network

  ${getDatabaseService(config)}

networks:
  app-network:
    driver: bridge
`;

  await fs.writeFile(
    path.join(projectPath, 'docker-compose.yml'),
    dockerCompose
  );
}

function getDatabaseService(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'postgresql':
      return `
  db:
    image: postgres:latest
    environment:
      - POSTGRES_DB=${config.projectName.toLowerCase()}
      - POSTGRES_USER=${getDefaultUsername(config)}
      - POSTGRES_PASSWORD=${getDefaultPassword(config)}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
      
volumes:
  postgres_data:`;
    case 'mysql':
      return `
  db:
    image: mysql:latest
    environment:
      - MYSQL_DATABASE=${config.projectName.toLowerCase()}
      - MYSQL_USER=${getDefaultUsername(config)}
      - MYSQL_PASSWORD=${getDefaultPassword(config)}
      - MYSQL_ROOT_PASSWORD=${getDefaultPassword(config)}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network
      
volumes:
  mysql_data:`;
    case 'mongodb':
      return `
  db:
    image: mongo:latest
    environment:
      - MONGO_INITDB_DATABASE=${config.projectName.toLowerCase()}
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network
      
volumes:
  mongo_data:`;
    default:
      return '';
  }
}

async function setupBackendDockerfile(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const dockerfile = `
FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
`;

  await fs.writeFile(
    path.join(backendPath, 'Dockerfile'),
    dockerfile
  );
}

async function setupFrontendDockerfile(projectPath: string, config: ProjectConfig) {
  const frontendPath = path.join(projectPath, 'frontend');
  const dockerfile = `
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

  await fs.writeFile(
    path.join(frontendPath, 'Dockerfile'),
    dockerfile
  );
}

async function setupNginxConfig(projectPath: string, config: ProjectConfig) {
  const nginxPath = path.join(projectPath, 'nginx', 'conf.d');
  await fs.ensureDir(nginxPath);
  
  const nginxConfig = `
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

  await fs.writeFile(
    path.join(nginxPath, 'default.conf'),
    nginxConfig
  );
}

function getDatabaseUrl(config: ProjectConfig): string {
  switch (config.database.type.toLowerCase()) {
    case 'postgresql':
      return 'jdbc:postgresql://db:5432/' + config.projectName.toLowerCase();
    case 'mysql':
      return 'jdbc:mysql://db:3306/' + config.projectName.toLowerCase();
    case 'mongodb':
      return 'mongodb://db:27017/' + config.projectName.toLowerCase();
    default:
      return '';
  }
}

function getDefaultUsername(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'postgresql':
    case 'mysql':
      return 'root';
    case 'mongodb':
      return '';
    default:
      return '';
  }
}

function getDefaultPassword(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'postgresql':
    case 'mysql':
      return 'root';
    case 'mongodb':
      return '';
    default:
      return '';
  }
} 