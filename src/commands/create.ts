import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import { generateProject } from '../utils/generator.js';
import { Database, Frontend, AuthType } from '../types.js';
import { ProjectConfig } from '../types/config.js';
import { setupDatabase } from '../templates/cli/database.js';
import { setupAuthentication } from '../templates/cli/auth.js';
import { setupDocker } from '../templates/cli/docker.js';
import { setupEmail } from '../templates/cli/email.js';

const createCommand = new Command('create')
  .description('Create a new fullstack Spring Boot project')
  .argument('<projectName>', 'Name of the project')
  .option('-d, --database <type>', 'Database type (MySQL, PostgreSQL, MongoDB, H2)', 'H2')
  .option('-f, --frontend <type>', 'Frontend type (React, Vue.js, Angular, None, Java Template Engine)', 'None')
  .option('-a, --auth [type]', 'Authentication type (JWT, OAuth2, Session)', 'JWT')
  .option('--admin-panel', 'Include admin panel')
  .option('--swagger', 'Include Swagger/OpenAPI documentation')
  .option('--docker', 'Include Docker configuration')
  .option('--ci-cd', 'Include CI/CD configuration')
  .option('--environments', 'Include multiple environment configurations')
  .option('--monorepo', 'Setup as monorepo')
  .option('--security', 'Include advanced security features')
  .option('--email', 'Include email functionality')
  .option('--third-party-apis', 'Include third-party API integrations')
  .option('--tests', 'Include testing configuration')
  .option('--i18n', 'Include internationalization')
  .option('--migrations', 'Include database migration configuration')
  .option('--multi-module', 'Setup as multi-module project')
  .action(async (projectName: string, options: any) => {
    try {
      const projectOptions = {
        projectName,
        database: options.database,
        authentication: options.auth !== undefined,
        authType: options.auth,
        frontend: options.frontend,
        adminPanel: options.adminPanel || false,
        swagger: options.swagger || false,
        docker: options.docker || false,
        ciCd: options.ciCd || false,
        environments: options.environments || false,
        monorepo: options.monorepo || false,
        security: options.security || false,
        email: options.email || false,
        thirdPartyApis: options.thirdPartyApis || false,
        tests: options.tests || false,
        i18n: options.i18n || false,
        migrations: options.migrations || false,
        multiModule: options.multiModule || false
      };

      const config = {
        projectName,
        projectPath: `./${projectName}`,
        databaseType: projectOptions.database,
        databaseHost: 'localhost',
        databasePort: projectOptions.database === 'PostgreSQL' ? '5432' : '3306',
        databaseUsername: 'root',
        databasePassword: 'password',
        frontendFramework: projectOptions.frontend,
        authentication: projectOptions.authentication,
        emailEnabled: projectOptions.email,
        thirdPartyApis: projectOptions.thirdPartyApis,
        i18n: projectOptions.i18n,
        migrations: projectOptions.migrations,
        multiModule: projectOptions.multiModule,
        testing: projectOptions.tests,
        deployment: {
          environments: projectOptions.environments ? ['dev', 'prod'] : ['dev'],
          docker: projectOptions.docker,
          kubernetes: false
        }
      };

      console.log(chalk.blue('Creating project...'));
      await generateProject(config);
      console.log(chalk.green('Project created successfully!'));

      if (config.frontendFramework !== 'None') {
        console.log(chalk.blue('Installing frontend dependencies...'));
        await execa('npm', ['install'], { cwd: `${projectName}/frontend` });
      }

      console.log(chalk.green('Project setup complete!'));
      console.log(chalk.blue(`\nTo get started:\n`));
      console.log(chalk.blue(`cd ${projectName}`));
      if (config.deployment.docker) {
        console.log(chalk.blue('docker-compose up -d'));
      } else {
        console.log(chalk.blue('./mvnw spring-boot:run'));
      }
    } catch (error) {
      console.error(chalk.red('Error creating project:'), error);
      process.exit(1);
    }
  });

export default createCommand; 