import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { ProjectConfig, defaultConfig } from '../types/config.js';
import { generateFrontend, generateBackend, generateDocker } from './generators.js';
import { spawn } from 'child_process';

export interface ProjectOptions {
  projectName: string;
  database?: 'postgresql' | 'mysql' | 'mongodb' | 'h2';
  frontend?: 'react' | 'vue' | 'angular' | 'none';
  auth?: 'jwt' | 'session' | 'oauth2';
  templateEngine?: 'thymeleaf' | 'freemarker' | 'jsp';
  swagger?: boolean;
  graphql?: boolean;
  adminPanel?: boolean;
  i18n?: boolean;
  docker?: boolean;
  ciCd?: boolean;
  security?: boolean;
  email?: boolean;
  thirdPartyApis?: boolean;
  tests?: boolean;
  migrations?: boolean;
  multiModule?: boolean;
}

export async function createProject(projectName: string, options: ProjectOptions): Promise<void> {
  try {
    // Validate project name
    if (!projectName) {
      throw new Error('Project name is required');
    }

    // Check if directory already exists
    const projectPath = path.join(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
      throw new Error(`Directory ${projectName} already exists`);
    }

    // Create project directories
    await fs.mkdir(projectPath);
    await fs.mkdir(path.join(projectPath, 'backend'));
    if (options.frontend !== 'none') {
      await fs.mkdir(path.join(projectPath, 'frontend'));
    }

    // Generate backend
    await generateBackend(projectPath, options);

    // Generate frontend if needed
    if (options.frontend !== 'none') {
      await generateFrontend(projectPath, options);
    }

    // Generate Docker files if needed
    if (options.docker) {
      await generateDocker(projectPath, options);
    }

    // Generate backend configuration
    const config: ProjectConfig = {
      ...defaultConfig,
      projectName,
      database: {
        ...defaultConfig.database,
        type: (options.database as 'postgresql' | 'mysql' | 'mongodb') || 'postgresql'
      },
      frontend: {
        framework: (options.frontend as 'react' | 'vue' | 'angular') || 'react'
      },
      auth: {
        type: (options.auth as 'jwt' | 'session') || 'jwt'
      }
    };

    // Create backend configuration file
    await fs.writeJson(path.join(projectPath, 'backend', 'config.json'), config, { spaces: 2 });

    // Install dependencies
    console.log(chalk.blue('Installing dependencies...'));
    await new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], { cwd: projectPath, stdio: 'inherit' });
      npm.on('close', (code) => {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });

    if (options.frontend !== 'none') {
      await new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install'], { cwd: path.join(projectPath, 'frontend'), stdio: 'inherit' });
        npm.on('close', (code) => {
          if (code === 0) {
            resolve(undefined);
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
      });
    }

    console.log(chalk.green(`Project ${projectName} created successfully!`));
    console.log(chalk.blue('Next steps:'));
    console.log(chalk.blue('1. cd ' + projectName));
    console.log(chalk.blue('2. npm start'));
  } catch (error) {
    console.error(chalk.red('Error creating project:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
} 