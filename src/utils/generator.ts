import { ProjectConfig } from '../types.js'; // Assurez-vous que l'importation pointe vers le bon fichier
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  setupDatabase,
  setupAuthentication,
  setupDocker,
  setupEmail
} from '../templates/cli/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateProject(config: ProjectConfig): Promise<void> {
  try {
    // Create project directory
    await fs.ensureDir(config.projectPath);

    // Generate basic structure
    await setupBasicStructure(config);

    // Setup database configuration
    if (config.database?.type) {
      await setupDatabase(config);
    }

    // Setup authentication if enabled
    if (config.authentication) {
      await setupAuthentication(config);
    }

    // Setup Docker configuration if enabled
    if (config.deployment?.docker) {
      await setupDocker(config);
    }

    // Setup email configuration if enabled
    if (config.emailEnabled) {
      await setupEmail(config);
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
    .replace(/{{#if mysql}}/g, config.database?.type === 'MySQL' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database?.type === 'MySQL' ? '' : '-->')
    .replace(/{{#if postgresql}}/g, config.database?.type === 'PostgreSQL' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database?.type === 'PostgreSQL' ? '' : '-->')
    .replace(/{{#if mongodb}}/g, config.database?.type === 'MongoDB' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database?.type === 'MongoDB' ? '' : '-->')
    .replace(/{{#if h2}}/g, config.database?.type === 'H2' ? '' : '<!--')
    .replace(/{{\/if}}/g, config.database?.type === 'H2' ? '' : '-->')
    .replace(/{{#if authentication}}/g, config.authentication ? '' : '<!--')
    .replace(/{{\/if}}/g, config.authentication ? '' : '-->');

  await fs.writeFile(path.join(config.projectPath, 'pom.xml'), pomContent);

  // Copy application.properties template
  const propertiesTemplate = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/resources/application.properties'), 'utf8');
  const propertiesContent = propertiesTemplate
    .replace(/{{projectName}}/g, config.projectName)
    .replace(/{{#if mysql}}/g, config.database?.type === 'MySQL' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if postgresql}}/g, config.database?.type === 'PostgreSQL' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if mongodb}}/g, config.database?.type === 'MongoDB' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if h2}}/g, config.database?.type === 'H2' ? '' : '# ')
    .replace(/{{\/if}}/g, '')
    .replace(/{{#if authentication}}/g, config.authentication ? '' : '# ')
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
- ${config.database?.type} database
${config.frontend?.framework !== 'None' ? '- Node.js and npm' : ''}
${config.deployment?.docker ? '- Docker and Docker Compose' : ''}

### Running the Application

1. Clone the repository
2. Configure the database connection in \`src/main/resources/application.properties\`
${config.deployment?.docker ? 
'3. Run \`docker-compose up -d\` to start the application and dependencies' : 
'3. Run \`./mvnw spring-boot:run\` to start the application'}

${config.frontend?.framework !== 'None' ? `
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
    `${config.database?.type} database integration`,
    `REST API with Swagger documentation`
  ];

  if (config.authentication) {
    features.push('Authentication and authorization');
  }

  if (config.frontend?.framework !== 'None') {
    features.push(`${config.frontend?.framework} frontend`);
  }

  if (config.testing) {
    features.push('Comprehensive testing setup');
  }

  if (config.deployment?.docker) {
    features.push('Docker containerization');
  }

  if (config.i18n) {
    features.push('Internationalization support');
  }

  if (config.migrations) {
    features.push('Database migration support');
  }

  if (config.multiModule) {
    features.push('Multi-module project structure');
  }

  return features;
} 

