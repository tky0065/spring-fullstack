import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../types/config.js'; // Correction : Vérifiez que ce chemin est correct
import { fileURLToPath } from 'url';
import { setupDatabase } from '../templates/cli/database.js';
import { setupAuthentication } from '../templates/cli/auth.js';
import { setupDocker } from '../templates/cli/docker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateBackend(config: ProjectConfig, projectPath: string): Promise<void> {
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
    <description>Backend application for ${config.projectName}</description>
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

export async function generateFrontend(config: ProjectConfig, projectPath: string): Promise<void> {
  if (config.frontend.framework === 'None') return;

  const frontendPath = path.join(projectPath, 'frontend');
  await fs.ensureDir(frontendPath);

  if (config.frontend.framework === 'React') {
    await generateReactFrontend(frontendPath, config);
  } else if (config.frontend.framework === 'Vue.js') {
    await generateVueFrontend(frontendPath, config);
  } else if (config.frontend.framework === 'Angular') {
    await generateAngularFrontend(frontendPath, config);
  }
}

async function generateReactFrontend(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: path.basename(frontendPath),
    version: '1.0.0',
    private: true,
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.11.2',
      '@types/react': '^18.2.7',
      '@types/react-dom': '^18.2.4',
      'typescript': '^5.0.4',
      'vite': '^4.3.9',
      '@vitejs/plugin-react': '^4.0.0'
    },
    scripts: {
      'dev': 'vite',
      'build': 'tsc && vite build',
      'preview': 'vite preview'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });
}

async function generateVueFrontend(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: path.basename(frontendPath),
    version: '1.0.0',
    private: true,
    dependencies: {
      'vue': '^3.3.4',
      'vue-router': '^4.2.2',
      'typescript': '^5.0.4',
      'vite': '^4.3.9',
      '@vitejs/plugin-vue': '^4.2.3',
      '@vue/compiler-sfc': '^3.3.4'
    },
    scripts: {
      'dev': 'vite',
      'build': 'vue-tsc && vite build',
      'preview': 'vite preview'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });
}

async function generateAngularFrontend(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: path.basename(frontendPath),
    version: '1.0.0',
    private: true,
    dependencies: {
      '@angular/core': '^16.0.0',
      '@angular/platform-browser': '^16.0.0',
      '@angular/platform-browser-dynamic': '^16.0.0',
      '@angular/router': '^16.0.0',
      'rxjs': '^7.8.1',
      'zone.js': '^0.13.0',
      'typescript': '^5.0.4'
    },
    scripts: {
      'ng': 'ng',
      'start': 'ng serve',
      'build': 'ng build',
      'watch': 'ng build --watch --configuration development',
      'test': 'ng test'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });
}

export async function generateDocker(config: ProjectConfig, projectPath: string): Promise<void> {
  const dockerfilePath = path.join(projectPath, 'Dockerfile');
  const dockerComposeFilePath = path.join(projectPath, 'docker-compose.yml');

  const dbType = config.database.type.toLowerCase(); // Normalisation des valeurs

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
    image: ${dbType === 'postgresql' ? 'postgres:15-alpine' : dbType === 'mysql' ? 'mysql:8' : 'mongo:6'}
    ports:
      - "${dbType === 'postgresql' ? '5432' : dbType === 'mysql' ? '3306' : '27017'}:${dbType === 'postgresql' ? '5432' : dbType === 'mysql' ? '3306' : '27017'}"
    environment:
      - ${dbType === 'postgresql' ? 'POSTGRES_DB' : dbType === 'mysql' ? 'MYSQL_DATABASE' : 'MONGO_INITDB_DATABASE'}=app
      - ${dbType === 'postgresql' ? 'POSTGRES_USER' : dbType === 'mysql' ? 'MYSQL_USER' : 'MONGO_INITDB_ROOT_USERNAME'}=user
      - ${dbType === 'postgresql' ? 'POSTGRES_PASSWORD' : dbType === 'mysql' ? 'MYSQL_PASSWORD' : 'MONGO_INITDB_ROOT_PASSWORD'}=password`;

  await fs.writeFile(dockerfilePath, dockerfileContent);
  await fs.writeFile(dockerComposeFilePath, dockerComposeContent);
}

