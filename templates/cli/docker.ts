import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupDocker(projectPath: string, config: ProjectConfig) {
  await setupDockerCompose(projectPath, config);
  await setupBackendDockerfile(projectPath, config);
  await setupFrontendDockerfile(projectPath, config);
  await setupNginxConfig(projectPath, config);
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
    case 'PostgreSQL':
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
    case 'MySQL':
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
    case 'MongoDB':
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
  switch (config.database.type) {
    case 'PostgreSQL':
      return 'jdbc:postgresql://db:5432/' + config.projectName.toLowerCase();
    case 'MySQL':
      return 'jdbc:mysql://db:3306/' + config.projectName.toLowerCase();
    case 'MongoDB':
      return 'mongodb://db:27017/' + config.projectName.toLowerCase();
    default:
      return '';
  }
}

function getDefaultUsername(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'PostgreSQL':
    case 'MySQL':
      return 'root';
    case 'MongoDB':
      return '';
    default:
      return '';
  }
}

function getDefaultPassword(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'PostgreSQL':
    case 'MySQL':
      return 'root';
    case 'MongoDB':
      return '';
    default:
      return '';
  }
} 