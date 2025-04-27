#!/usr/bin/env node

import { program } from 'commander';
import { createProject, ProjectOptions } from './commands/create.js';

program
  .version('1.0.0')
  .description('A CLI tool to generate fullstack Spring Boot applications with modern frontend frameworks');

program
  .command('create')
  .description('Create a new fullstack Spring Boot project')
  .argument('<project-name>', 'Name of the project')
  .option('-d, --database <type>', 'Database type (mysql, postgresql, mongodb)', 'postgresql')
  .option('-f, --frontend <framework>', 'Frontend framework (react, vue, angular)', 'react')
  .option('-a, --auth <type>', 'Authentication type (jwt, session)', 'jwt')
  .action((projectName: string, options: ProjectOptions) => {
    createProject(projectName, {
      ...options,
      projectName
    });
  });

program.parse(process.argv); 