import fs from 'fs-extra';
import path from 'path';
import { ProjectOptions } from './create';

export async function generateBackend(projectPath: string, options: ProjectOptions): Promise<void> {
  const backendPath = path.join(projectPath, 'backend');
  await fs.mkdirp(backendPath);

  // Créer la structure de base du backend
  const backendStructure = {
    'src/main/java/com/example/backend': [
      'Application.java',
      'config',
      'controller',
      'service',
      'repository',
      'model',
      'security',
      'exception'
    ],
    'src/main/resources': [
      'application.yml',
      'application-dev.yml',
      'application-prod.yml'
    ],
    'src/test/java/com/example/backend': [
      'ApplicationTests.java'
    ]
  };

  // Créer la structure de dossiers et fichiers
  for (const [basePath, items] of Object.entries(backendStructure)) {
    const fullPath = path.join(backendPath, basePath);
    await fs.mkdirp(fullPath);
    
    for (const item of items) {
      if (!item.includes('.')) {
        await fs.mkdirp(path.join(fullPath, item));
      } else {
        await fs.writeFile(path.join(fullPath, item), '');
      }
    }
  }

  // Configurer le pom.xml pour le backend
  const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.0</version>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>backend</artifactId>
    <version>1.0.0</version>
    <name>Backend Application</name>
    <description>Backend application for ${options.projectName}</description>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

  await fs.writeFile(path.join(backendPath, 'pom.xml'), pomContent);
}

export async function generateFrontend(projectPath: string, options: ProjectOptions): Promise<void> {
  const frontendPath = path.join(projectPath, 'frontend');
  await fs.mkdirp(frontendPath);

  // Créer la structure de base du frontend
  const frontendStructure = {
    'src': [
      'components',
      'pages',
      'services',
      'utils',
      'styles',
      'assets'
    ],
    'public': [
      'index.html',
      'favicon.ico'
    ]
  };

  // Créer la structure de dossiers et fichiers
  for (const [basePath, items] of Object.entries(frontendStructure)) {
    const fullPath = path.join(frontendPath, basePath);
    await fs.mkdirp(fullPath);
    
    for (const item of items) {
      if (!item.includes('.')) {
        await fs.mkdirp(path.join(fullPath, item));
      } else {
        await fs.writeFile(path.join(fullPath, item), '');
      }
    }
  }

  // Configurer package.json selon le framework choisi
  let packageJsonContent = '';
  if (options.frontend === 'React') {
    packageJsonContent = `{
  "name": "${options.projectName}-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.3.0",
    "axios": "^0.27.2"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^4.7.0",
    "vite": "^3.0.0"
  }
}`;
  } else if (options.frontend === 'Vue.js') {
    packageJsonContent = `{
  "name": "${options.projectName}-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "vue": "^3.2.0",
    "vue-router": "^4.0.0",
    "axios": "^0.27.2"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^3.0.0",
    "typescript": "^4.7.0",
    "vite": "^3.0.0"
  }
}`;
  } else if (options.frontend === 'Angular') {
    packageJsonContent = `{
  "name": "${options.projectName}-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@angular/core": "^14.0.0",
    "@angular/common": "^14.0.0",
    "@angular/router": "^14.0.0",
    "@angular/forms": "^14.0.0",
    "@angular/platform-browser": "^14.0.0",
    "@angular/platform-browser-dynamic": "^14.0.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^14.0.0",
    "@angular/cli": "^14.0.0",
    "typescript": "^4.7.0"
  }
}`;
  }

  await fs.writeFile(path.join(frontendPath, 'package.json'), packageJsonContent);
}

export async function generateDocker(projectPath: string, options: ProjectOptions): Promise<void> {
  const dockerPath = path.join(projectPath, 'docker');
  await fs.mkdirp(dockerPath);

  // Créer Dockerfile pour le backend
  const backendDockerfile = `FROM maven:3.8.4-openjdk-11 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]`;

  await fs.writeFile(path.join(dockerPath, 'Dockerfile.backend'), backendDockerfile);

  // Créer Dockerfile pour le frontend
  const frontendDockerfile = `FROM node:16-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

  await fs.writeFile(path.join(dockerPath, 'Dockerfile.frontend'), frontendDockerfile);

  // Créer docker-compose.yml
  const dockerComposeContent = `version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${options.projectName}
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres
    depends_on:
      - db

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=${options.projectName}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`;

  await fs.writeFile(path.join(dockerPath, 'docker-compose.yml'), dockerComposeContent);
} 