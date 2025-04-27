import fs from 'fs-extra';
import path from 'path';
import { ProjectOptions } from './create.js';

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
        ${options.templateEngine === 'thymeleaf' ? `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        ` : ''}
        ${options.templateEngine === 'freemarker' ? `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-freemarker</artifactId>
        </dependency>
        ` : ''}
        ${options.templateEngine === 'jsp' ? `
        <dependency>
            <groupId>org.apache.tomcat.embed</groupId>
            <artifactId>tomcat-embed-jasper</artifactId>
            <scope>provided</scope>
        </dependency>
        ` : ''}
        ${options.swagger ? `
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-boot-starter</artifactId>
            <version>3.0.0</version>
        </dependency>
        ` : ''}
        ${options.graphql ? `
        <dependency>
            <groupId>com.graphql-java</groupId>
            <artifactId>graphql-spring-boot-starter</artifactId>
            <version>5.0.2</version>
        </dependency>
        <dependency>
            <groupId>com.graphql-java</groupId>
            <artifactId>graphql-java-tools</artifactId>
            <version>5.2.4</version>
        </dependency>
        ` : ''}
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

  // Créer les templates si un moteur de template est sélectionné
  if (options.templateEngine) {
    const templatesPath = path.join(backendPath, 'src/main/resources/templates');
    await fs.mkdirp(templatesPath);

    const templateContent = {
      thymeleaf: `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Home</title>
</head>
<body>
    <h1>Welcome to ${options.projectName}</h1>
</body>
</html>`,
      freemarker: `
<#-- @ftlvariable name="message" type="java.lang.String" -->
<!DOCTYPE html>
<html>
<head>
    <title>Home</title>
</head>
<body>
    <h1>Welcome to ${options.projectName}</h1>
</body>
</html>`,
      jsp: `
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <title>Home</title>
</head>
<body>
    <h1>Welcome to ${options.projectName}</h1>
</body>
</html>`
    };

    const extension = {
      thymeleaf: 'html',
      freemarker: 'ftl',
      jsp: 'jsp'
    };

    await fs.writeFile(
      path.join(templatesPath, `home.${extension[options.templateEngine]}`),
      templateContent[options.templateEngine]
    );
  }
}

export async function generateFrontend(projectPath: string, options: ProjectOptions): Promise<void> {
  const frontendPath = path.join(projectPath, 'frontend');
  await fs.ensureDir(frontendPath);

  if (options.frontend === 'react') {
    await generateReactFrontend(frontendPath);
  } else if (options.frontend === 'vue') {
    await generateVueFrontend(frontendPath);
  } else if (options.frontend === 'angular') {
    await generateAngularFrontend(frontendPath);
  }
}

async function generateReactFrontend(frontendPath: string): Promise<void> {
  // Create package.json
  const packageJson = {
    name: path.basename(frontendPath),
    version: '1.0.0',
    private: true,
    dependencies: {
      '@types/node': '^12.0.0',
      '@types/react': '^17.0.0',
      '@types/react-dom': '^17.0.0',
      'react': '^17.0.2',
      'react-dom': '^17.0.2',
      'react-router-dom': '^6.0.0',
      'typescript': '^4.5.0'
    },
    scripts: {
      'start': 'react-scripts start',
      'build': 'react-scripts build',
      'test': 'react-scripts test',
      'eject': 'react-scripts eject'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      module: 'esnext',
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx'
    },
    include: ['src']
  };

  await fs.writeJson(path.join(frontendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });
}

async function generateVueFrontend(frontendPath: string): Promise<void> {
  // Create package.json
  const packageJson = {
    name: path.basename(frontendPath),
    version: '1.0.0',
    private: true,
    dependencies: {
      'vue': '^3.2.0',
      'vue-router': '^4.0.0',
      'vuex': '^4.0.0',
      'typescript': '^4.5.0'
    },
    devDependencies: {
      '@vue/cli-plugin-typescript': '^5.0.0',
      '@vue/cli-service': '^5.0.0',
      '@vue/compiler-sfc': '^3.2.0'
    },
    scripts: {
      'serve': 'vue-cli-service serve',
      'build': 'vue-cli-service build'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'esnext',
      module: 'esnext',
      strict: true,
      jsx: 'preserve',
      moduleResolution: 'node'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });
}

async function generateAngularFrontend(frontendPath: string): Promise<void> {
  // Create package.json
  const packageJson = {
    name: path.basename(frontendPath),
    version: '1.0.0',
    private: true,
    dependencies: {
      '@angular/core': '^13.0.0',
      '@angular/platform-browser': '^13.0.0',
      '@angular/platform-browser-dynamic': '^13.0.0',
      '@angular/router': '^13.0.0',
      'rxjs': '^7.4.0',
      'zone.js': '^0.11.4',
      'typescript': '^4.5.0'
    },
    devDependencies: {
      '@angular-devkit/build-angular': '^13.0.0',
      '@angular/cli': '^13.0.0',
      '@angular/compiler-cli': '^13.0.0'
    },
    scripts: {
      'ng': 'ng',
      'start': 'ng serve',
      'build': 'ng build'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create tsconfig.json
  const tsconfig = {
    compileOnSave: false,
    compilerOptions: {
      baseUrl: './src',
      outDir: './dist/out-tsc',
      sourceMap: true,
      declaration: false,
      downlevelIteration: true,
      experimentalDecorators: true,
      moduleResolution: 'node',
      importHelpers: true,
      target: 'es2015',
      module: 'es2020',
      lib: ['es2018', 'dom']
    }
  };

  await fs.writeJson(path.join(frontendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });
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