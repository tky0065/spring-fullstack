import inquirer from 'inquirer';
import { execa } from 'execa';
import gitClone from 'git-clone';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { generateBackend, generateFrontend, generateDocker } from './generators';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cloneAsync = promisify(gitClone);

interface Options {
  projectName: string;
  database?: string;
  authentication?: boolean;
  authType?: string;
  frontend?: string;
  adminPanel?: boolean;
  swagger?: boolean;
  docker?: boolean;
  ciCd?: boolean;
  environments?: boolean;
  monorepo?: boolean;
  security?: boolean;
  email?: boolean;
  thirdPartyApis?: boolean;
  tests?: boolean;
  i18n?: boolean;
  migrations?: boolean;
  multiModule?: boolean;
}

export interface ProjectOptions extends Options {
  projectName: string;
  database: string;
  authentication: boolean;
  authType: string;
  frontend: string;
  adminPanel: boolean;
  swagger: boolean;
  docker: boolean;
  ciCd: boolean;
  environments: boolean;
  monorepo: boolean;
  security: boolean;
  email: boolean;
  thirdPartyApis: boolean;
  tests: boolean;
  i18n: boolean;
  migrations: boolean;
  multiModule: boolean;
}

export async function createProject(projectName: string, options: Partial<Omit<Options, 'projectName'>> = {}) {
  const projectPath = path.join(process.cwd(), projectName);
  const spinner = ora('Création du projet...').start();

  try {
    // Vérifier si le dossier existe déjà
    if (existsSync(projectPath)) {
      spinner.fail(`Le dossier ${projectPath} existe déjà`);
      return;
    }

    // Créer le dossier du projet
    mkdirSync(projectPath);

    // Questions interactives
    const answers = await inquirer.prompt<ProjectOptions>([
      {
        type: 'list',
        name: 'database',
        message: 'Quel type de base de données voulez-vous utiliser ?',
        choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'H2', 'Autre'],
      },
      {
        type: 'confirm',
        name: 'authentication',
        message: 'Voulez-vous configurer l\'authentification ?',
        default: true,
      },
      {
        type: 'list',
        name: 'authType',
        message: 'Type d\'authentification ?',
        choices: ['JWT', 'OAuth2', 'Session classique'],
        when: (answers: ProjectOptions) => answers.authentication,
      },
      {
        type: 'list',
        name: 'frontend',
        message: 'Souhaitez-vous un Frontend ?',
        choices: ['React', 'Vue.js', 'Angular', 'Aucun', 'Java Template Engine'],
      },
      {
        type: 'confirm',
        name: 'adminPanel',
        message: 'Voulez-vous un panel d\'administration prêt à l\'emploi ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'swagger',
        message: 'Voulez-vous ajouter Swagger (documentation API) ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'docker',
        message: 'Voulez-vous ajouter support Docker ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'ciCd',
        message: 'Voulez-vous ajouter la configuration CI/CD ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'environments',
        message: 'Voulez-vous configurer les environnements (dev/prod) ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'monorepo',
        message: 'Voulez-vous utiliser une structure monorepo ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'security',
        message: 'Voulez-vous ajouter des outils de sécurité avancés ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'email',
        message: 'Voulez-vous ajouter le support des emails ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'thirdPartyApis',
        message: 'Voulez-vous ajouter le support pour des API tierces ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'tests',
        message: 'Voulez-vous ajouter des tests avancés ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'i18n',
        message: 'Voulez-vous ajouter le support i18n ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'migrations',
        message: 'Voulez-vous configurer les migrations de données ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'multiModule',
        message: 'Voulez-vous utiliser une structure multi-modules ?',
        default: false,
      },
    ]);

    // Cloner le template de base
    await cloneAsync(
      'https://github.com/your-org/spring-fullstack-template.git',
      projectPath
    );

    // Générer les composants du projet
    spinner.text = 'Génération du backend...';
    await generateBackend(projectPath, answers);

    spinner.text = 'Génération du frontend...';
    await generateFrontend(projectPath, answers);

    if (answers.docker) {
      spinner.text = 'Génération des fichiers Docker...';
      await generateDocker(projectPath, answers);
    }

    // Installer les dépendances
    spinner.text = 'Installation des dépendances...';
    await execa('npm', ['install'], { cwd: projectPath });

    spinner.succeed(`Projet ${projectName} créé avec succès !`);
    console.log('\nPour démarrer le projet :');
    console.log(`cd ${projectName}`);
    console.log('npm run dev');

  } catch (error) {
    spinner.fail('Erreur lors de la création du projet');
    console.error(error);
  }
}

async function generateBackend(projectPath: string, options: ProjectOptions): Promise<void> {
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

async function generateFrontend(projectPath: string, options: ProjectOptions): Promise<void> {
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

async function generateDocker(projectPath: string, options: ProjectOptions): Promise<void> {
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