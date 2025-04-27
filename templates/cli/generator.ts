import { ProjectConfig } from '../../src/types/config.js';
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
  if (config.database) {
    await setupDatabase(config, projectPath);
  }
  
  // Setup authentication if enabled
  if (config.authentication?.enabled) {
    await setupAuthentication(projectPath, config.authentication.type || 'jwt');
  }
  
  // Setup frontend if not 'none'
  if (config.frontend) {
    await setupFrontend(config.frontend.type, projectPath);
  }
  
  // Setup user management
  if (config.userManagement) {
    await setupUserManagement(projectPath, config);
  }
  
  // Setup API
  if (config.api) {
    await setupApi(config.api, projectPath);
  }
  
  // Setup testing
  if (config.testing) {
    await setupTesting(projectPath);
  }
  
  // Setup Docker
  if (config.docker) {
    await setupDocker(projectPath, config);
  }
  
  // Setup email if it's in the features
  if (config.features?.includes('email')) {
    await setupEmail(
      projectPath, 
      config, 
      config.database?.username || 'user',
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

  if (config.database) {
    features.push(`Database: ${config.database.type}`);
  }

  if (config.frontend?.type !== 'none') {
    features.push(`Frontend: ${config.frontend?.type}`);
  }

  if (config.api) {
    features.push(`API: ${config.api}`);
  }

  if (config.authentication?.enabled) {
    features.push(`Authentication: ${config.authentication.type || 'jwt'}`);
  }

  if (config.userManagement?.enabled) {
    features.push('User Management');
  }

  if (config.testing) {
    features.push('Testing');
  }

  if (config.docker) {
    features.push('Docker');
  }

  return features;
} 