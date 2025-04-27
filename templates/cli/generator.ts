import { ProjectConfig } from '../../src/types.js'; // Correction du chemin d'importation
import { setupDatabase } from './database.js';
import { setupAuthentication } from './auth.js';
import { setupFrontend } from './frontend.js';
import { setupUserManagement } from './user-management.js';
import { setupApi } from './api.js';
import { setupTesting } from './testing.js';
import { setupDocker } from './docker.js';
import { setupEmail } from './email.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateProject(config: ProjectConfig): Promise<void> {
  const projectPath = path.join(process.cwd(), config.projectName);

  // Create project directory
  await fs.mkdirp(projectPath);

  // Setup basic project structure
  await setupBasicStructure(projectPath, config);

  // Setup database
  if (config.databaseType) {
    await setupDatabase(config, projectPath);
  }

  // Setup authentication if enabled
  if (config.authentication) {
    await setupAuthentication(projectPath, config); // Correction : passer l'objet config
  }

  // Setup frontend if not 'None'
  if (config.frontendFramework && config.frontendFramework !== 'None') {
    await setupFrontend(config.frontendFramework, projectPath);
  }

  // Setup user management (if applicable)
  if (config.adminPanel) {
    await setupUserManagement(projectPath, config);
  }

  // Setup API
  if (config.swagger) {
    await setupApi(config, projectPath); // Correction : passer l'objet config
  }

  // Setup testing
  if (config.testing) {
    await setupTesting(projectPath);
  }

  // Setup Docker
  if (config.deployment.docker) {
    await setupDocker(config, projectPath); // Correction : inverser les arguments
  }

  // Setup email if enabled
  if (config.emailEnabled) {
    await setupEmail(
      config, // Correction : passer l'objet config
      projectPath,
      config.databaseUsername || 'user',
      'http://localhost:8080/reset-password',
      'http://localhost:8080/verify-email'
    );
  }
}

async function setupBasicStructure(projectPath: string, config: ProjectConfig): Promise<void> {
  // Create basic directory structure
  const directories = [
    'backend/src/main/java',
    'backend/src/main/resources',
    'backend/src/test/java',
    'backend/src/test/resources',
    'frontend/src',
    'frontend/public',
    'docs',
    '.github/workflows'
  ];

  for (const dir of directories) {
    await fs.mkdirp(path.join(projectPath, dir));
  }

  // Create README.md
  const readmeContent = `
# ${config.projectName}

## Description
This project was generated using Spring Fullstack Generator.

## Features
${getFeaturesList(config).join('\n')}

## Getting Started
1. Install dependencies:
   \`\`\`bash
   cd backend
   ./mvnw install
   cd ../frontend
   npm install
   \`\`\`

2. Run the application:
   \`\`\`bash
   # Backend
   cd backend
   ./mvnw spring-boot:run
   
   # Frontend
   cd frontend
   npm start
   \`\`\`

## Documentation
- API Documentation: http://localhost:8080/swagger-ui.html
- Backend Documentation: ./docs/backend
- Frontend Documentation: ./docs/frontend
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
}

function getFeaturesList(config: ProjectConfig): string[] {
  const features: string[] = [];

  if (config.databaseType) {
    features.push(`Database: ${config.databaseType}`);
  }

  if (config.frontendFramework && config.frontendFramework !== 'None') {
    features.push(`Frontend: ${config.frontendFramework}`);
  }

  if (config.swagger) {
    features.push('API: REST');
  }

  if (config.authentication) {
    features.push('Authentication: JWT');
  }

  if (config.adminPanel) {
    features.push('Admin Panel');
  }

  if (config.testing) {
    features.push('Testing');
  }

  if (config.deployment.docker) {
    features.push('Docker');
  }

  return features;
}

