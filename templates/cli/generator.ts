import { ProjectConfig } from './config';
import { setupDatabase } from './database';
import { setupAuthentication } from './auth';
import { setupFrontend } from './frontend';
import { setupUserManagement } from './userManagement';
import { setupApi } from './api';
import { setupTesting } from './testing';
import { setupDocker } from './docker';
import { setupMultiModule } from './multiModule';
import { setupMonorepo } from './monorepo';
import { setupPlugins } from './plugins';
import { setupSecurity } from './security';
import { setupAlternativeFrontends } from './alternativeFrontends';
import { setupDocumentation } from './documentation';
import { setupEnvironments } from './environments';
import { setupThirdPartyApis } from './thirdPartyApis';
import { setupEmail } from './email';
import { setupLogging } from './logging';
import { setupSwagger } from './swagger';
import { setupI18n } from './i18n';
import { setupMigrations } from './migrations';
import { setupAdminPanel } from './admin';
import fs from 'fs-extra';
import path from 'path';

export async function generateProject(config: ProjectConfig): Promise<void> {
  const projectPath = path.join(process.cwd(), config.projectName);
  
  // Create project directory
  await fs.mkdirp(projectPath);
  
  // Setup basic project structure
  await setupBasicStructure(projectPath, config);
  
  // Setup database
  await setupDatabase(projectPath, config);
  
  // Setup authentication
  if (config.authentication.enabled) {
    await setupAuthentication(projectPath, config);
  }
  
  // Setup frontend
  await setupFrontend(projectPath, config);
  
  // Setup user management
  if (config.userManagement.enabled) {
    await setupUserManagement(projectPath, config);
    if (config.userManagement.adminPanel) {
      await setupAdminPanel(projectPath);
    }
  }
  
  // Setup API
  await setupApi(projectPath, config);
  
  // Setup testing
  if (config.testing.enabled) {
    await setupTesting(projectPath, config);
  }
  
  // Setup Docker
  if (config.docker.enabled) {
    await setupDocker(projectPath, config);
  }
  
  // Setup multi-module structure
  if (config.features.multiModule) {
    await setupMultiModule(projectPath, config);
  }
  
  // Setup monorepo structure
  if (config.features.monorepo) {
    await setupMonorepo(projectPath, config);
  }
  
  // Setup plugins
  await setupPlugins(projectPath, config);
  
  // Setup security
  if (config.features.security) {
    await setupSecurity(projectPath, config);
  }
  
  // Setup alternative frontends
  await setupAlternativeFrontends(projectPath, config);
  
  // Setup documentation
  await setupDocumentation(projectPath, config);
  
  // Setup environments
  if (config.features.environments) {
    await setupEnvironments(projectPath, config);
  }
  
  // Setup third-party APIs
  if (config.features.thirdPartyApis) {
    await setupThirdPartyApis(projectPath, config);
  }
  
  // Setup email
  if (config.features.email) {
    await setupEmail(projectPath);
  }
  
  // Setup logging
  await setupLogging(projectPath);
  
  // Setup Swagger
  if (config.features.openApi) {
    await setupSwagger(projectPath);
  }
  
  // Setup i18n
  if (config.features.i18n) {
    await setupI18n(projectPath, config);
  }
  
  // Setup migrations
  if (config.features.migrations.enabled) {
    await setupMigrations(projectPath, config);
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
${getFeaturesList(config)}

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

function getFeaturesList(config: ProjectConfig): string {
  const features = [];
  
  if (config.authentication.enabled) {
    features.push(`- Authentication (${config.authentication.type})`);
  }
  
  if (config.userManagement.enabled) {
    features.push('- User Management');
    if (config.userManagement.adminPanel) {
      features.push('  - Admin Panel');
    }
  }
  
  if (config.testing.enabled) {
    features.push('- Testing');
    if (config.testing.advanced) {
      features.push('  - Advanced Testing');
    }
  }
  
  if (config.docker.enabled) {
    features.push('- Docker Support');
  }
  
  if (config.features.multiModule) {
    features.push('- Multi-module Structure');
  }
  
  if (config.features.monorepo) {
    features.push('- Monorepo Structure');
  }
  
  if (config.features.security) {
    features.push('- Advanced Security');
  }
  
  if (config.features.email) {
    features.push('- Email Module');
  }
  
  if (config.features.thirdPartyApis) {
    features.push('- Third-party API Integrations');
  }
  
  if (config.features.migrations.enabled) {
    features.push(`- Database Migrations (${config.features.migrations.type})`);
  }
  
  if (config.features.i18n) {
    features.push('- Internationalization');
  }
  
  if (config.features.openApi) {
    features.push('- OpenAPI Documentation');
  }
  
  return features.join('\n');
} 