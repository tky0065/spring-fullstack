#!/usr/bin/env node
import inquirer from 'inquirer';
import { ProjectConfig, defaultConfig } from './config.js';
import { generateProject } from './generator.js';
export * from './database.js';
export * from './auth.js';
export * from './docker.js';
export * from './email.js';
export * from './frontend.js';
export * from './user-management.js';
export * from './api.js';
export * from './testing.js';
export * from './security.js';
export * from './third-party-apis.js';
export * from './i18n.js';
export * from './migrations.js';
export * from './multi-module.js';
import { setupPlugins } from './plugins.js';
import { setupAlternativeFrontends } from './alternativeFrontends.js';
import { setupDocumentation } from './documentation.js';
import { setupEnvironments } from './environments.js';
import { setupLogging } from './logging.js';
import { setupSwagger } from './swagger.js';
import { setupI18n } from './i18n.js';
import { setupMigrations } from './migrations.js';
import { setupAdminPanel } from './admin.js';

async function main() {
  console.log('Welcome to Spring Fullstack Generator!');
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: process.argv[2] || 'my-app',
    },
    {
      type: 'list',
      name: 'database.type',
      message: 'Choose database:',
      choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'H2', 'Other'],
    },
    {
      type: 'confirm',
      name: 'authentication.enabled',
      message: 'Enable authentication?',
      default: false,
    },
    {
      type: 'list',
      name: 'authentication.type',
      message: 'Choose authentication type:',
      choices: ['JWT', 'Session', 'OAuth2'],
      when: (answers) => answers.authentication.enabled,
    },
    {
      type: 'list',
      name: 'frontend.framework',
      message: 'Choose frontend framework:',
      choices: ['React', 'Vue.js', 'Angular', 'None', 'JavaTemplate'],
    },
    {
      type: 'list',
      name: 'frontend.templateEngine',
      message: 'Choose template engine:',
      choices: ['Thymeleaf', 'Freemarker', 'JSP', 'jte'],
      when: (answers) => answers.frontend.framework === 'JavaTemplate',
    },
    {
      type: 'confirm',
      name: 'userManagement.enabled',
      message: 'Enable user management?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'userManagement.adminPanel',
      message: 'Include admin panel?',
      when: (answers) => answers.userManagement.enabled,
    },
    {
      type: 'list',
      name: 'api.type',
      message: 'Choose API type:',
      choices: ['REST', 'GraphQL'],
    },
    {
      type: 'confirm',
      name: 'testing.enabled',
      message: 'Enable testing?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'testing.advanced',
      message: 'Include advanced testing?',
      when: (answers) => answers.testing.enabled,
    },
    {
      type: 'confirm',
      name: 'docker.enabled',
      message: 'Generate Docker files?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.openApi',
      message: 'Include OpenAPI (Swagger)?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.i18n',
      message: 'Enable internationalization?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.ciCd',
      message: 'Generate CI/CD configuration?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.environments',
      message: 'Generate environment configurations?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.monorepo',
      message: 'Use monorepo structure?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.security',
      message: 'Enable advanced security features?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.email',
      message: 'Include email module?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.thirdPartyApis',
      message: 'Include third-party API integrations?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'features.migrations.enabled',
      message: 'Enable database migrations?',
      default: false,
    },
    {
      type: 'list',
      name: 'features.migrations.type',
      message: 'Choose migration tool:',
      choices: ['Flyway', 'Liquibase'],
      when: (answers) => answers.features.migrations.enabled,
    },
    {
      type: 'confirm',
      name: 'features.multiModule',
      message: 'Use multi-module structure?',
      default: false,
    },
  ]);

  const config: ProjectConfig = {
    ...defaultConfig,
    ...answers,
  };

  try {
    await generateProject(config);
    console.log('Project generated successfully!');
  } catch (error) {
    console.error('Error generating project:', error);
    process.exit(1);
  }
}

main().catch(console.error); 