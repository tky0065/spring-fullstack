import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../types/config.js';
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
  if (config.frontend.type === 'none') return;

  const frontendPath = path.join(projectPath, 'frontend');
  await fs.ensureDir(frontendPath);

  if (config.frontend.type === 'react') {
    await generateReactFrontend(frontendPath, config);
  } else if (config.frontend.type === 'vue') {
    await generateVueFrontend(frontendPath, config);
  } else if (config.frontend.type === 'angular') {
    await generateAngularFrontend(frontendPath, config);
  }
}

async function generateReactFrontend(frontendPath: string, config: ProjectConfig): Promise<void> {
  // Create package.json
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
  // Create package.json
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
  // Create package.json
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
    image: ${config.database.type === 'postgresql' ? 'postgres:15-alpine' : config.database.type === 'mysql' ? 'mysql:8' : 'mongo:6'}
    ports:
      - "${config.database.type === 'postgresql' ? '5432' : config.database.type === 'mysql' ? '3306' : '27017'}:${config.database.type === 'postgresql' ? '5432' : config.database.type === 'mysql' ? '3306' : '27017'}"
    environment:
      - ${config.database.type === 'postgresql' ? 'POSTGRES_DB' : config.database.type === 'mysql' ? 'MYSQL_DATABASE' : 'MONGO_INITDB_DATABASE'}=app
      - ${config.database.type === 'postgresql' ? 'POSTGRES_USER' : config.database.type === 'mysql' ? 'MYSQL_USER' : 'MONGO_INITDB_ROOT_USERNAME'}=user
      - ${config.database.type === 'postgresql' ? 'POSTGRES_PASSWORD' : config.database.type === 'mysql' ? 'MYSQL_PASSWORD' : 'MONGO_INITDB_ROOT_PASSWORD'}=password`;

  await fs.writeFile(dockerfilePath, dockerfileContent);
  await fs.writeFile(dockerComposeFilePath, dockerComposeContent);
}

export async function generateProject(config: ProjectConfig): Promise<void> {
  try {
    // Create project directory
    await fs.ensureDir(config.projectPath);

    // Generate basic structure
    await setupBasicStructure(config);

    // Setup database configuration
    await setupDatabase(config);

    // Setup authentication if enabled
    if (config.authentication.enabled) {
      await setupAuthentication(config.projectPath, config);
    }

    // Setup Docker configuration if enabled
    if (config.docker) {
      await setupDocker(config);
    }

    // Generate README.md
    await generateReadme(config);

  } catch (error) {
    console.error('Error generating project:', error);
    throw error;
  }
}

async function setupBasicStructure(config: ProjectConfig): Promise<void> {
  const srcPath = path.join(config.projectPath, 'src/main/java');
  const resourcesPath = path.join(config.projectPath, 'src/main/resources');
  
  await fs.ensureDir(srcPath);
  await fs.ensureDir(resourcesPath);
  
  // Copy pom.xml template
  const pomTemplate = await fs.readFile(path.join(__dirname, '../../templates/backend/pom.xml'), 'utf8');
  const pomContent = pomTemplate
    .replace(/{{projectName}}/g, config.projectName)
    .replace(/{{#if mysql}}/g, config.database.type === 'mysql' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database.type === 'mysql' ? '' : '-->')
    .replace(/{{#if postgresql}}/g, config.database.type === 'postgresql' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database.type === 'postgresql' ? '' : '-->')
    .replace(/{{#if mongodb}}/g, config.database.type === 'mongodb' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database.type === 'mongodb' ? '' : '-->')
    .replace(/{{#if h2}}/g, config.database.type === 'h2' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database.type === 'h2' ? '' : '-->')
    .replace(/{{#if authentication}}/g, config.authentication.enabled ? '' : '<!--')
    .replace(/{{\/if}}/g, config.authentication.enabled ? '' : '-->');

  await fs.writeFile(path.join(config.projectPath, 'pom.xml'), pomContent);

  // Copy application.properties template
  const propertiesTemplate = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/resources/application.properties'), 'utf8');
  const propertiesContent = propertiesTemplate
    .replace(/{{projectName}}/g, config.projectName)
    .replace(/{{#if mysql}}/g, config.database.type === 'mysql' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if postgresql}}/g, config.database.type === 'postgresql' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if mongodb}}/g, config.database.type === 'mongodb' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if h2}}/g, config.database.type === 'h2' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if authentication}}/g, config.authentication.enabled ? '' : '# ')
    .replace(/{{\/if}}/g, '');

  await fs.writeFile(path.join(resourcesPath, 'application.properties'), propertiesContent);

  // Create main application class
  const mainClass = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/java/com/example/Application.java'), 'utf8');
  const mainClassContent = mainClass.replace(/{{projectName}}/g, config.projectName);
  
  await fs.writeFile(
    path.join(srcPath, 'com', 'example', config.projectName.toLowerCase(), 'Application.java'),
    mainClassContent
  );
}

async function generateReadme(config: ProjectConfig): Promise<void> {
  const features = getFeaturesList(config);
  
  const readme = `# ${config.projectName}

A Spring Boot application generated with spring-fullstack CLI.

## Features

${features.map(f => `- ${f}`).join('\n')}

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven
- ${config.database.type} database
${config.frontend.type !== 'none' ? '- Node.js and npm' : ''}
${config.docker ? '- Docker and Docker Compose' : ''}

### Running the Application

1. Clone the repository
2. Configure the database connection in \`src/main/resources/application.properties\`
${config.docker ? 
'3. Run \`docker-compose up -d\` to start the application and dependencies' : 
'3. Run \`./mvnw spring-boot:run\` to start the application'}

${config.frontend.type !== 'none' ? `
### Frontend Development

1. Navigate to the frontend directory: \`cd frontend\`
2. Install dependencies: \`npm install\`
3. Start the development server: \`npm run dev\`
` : ''}

## API Documentation

The API documentation is available at \`http://localhost:8080/swagger-ui.html\` when the application is running.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
`;

  await fs.writeFile(
    path.join(config.projectPath, 'README.md'),
    readme
  );
}

function getFeaturesList(config: ProjectConfig): string[] {
  const features = [
    `${config.database.type} database integration`,
    `REST API with Swagger documentation`
  ];

  if (config.authentication.enabled) {
    features.push(`Authentication (${config.authentication.type})`);
  }

  if (config.frontend.type !== 'none') {
    features.push(`${config.frontend.type} frontend`);
  }

  if (config.testing) {
    features.push('Comprehensive testing setup');
  }

  if (config.docker) {
    features.push('Docker containerization');
  }

  return features;
} 