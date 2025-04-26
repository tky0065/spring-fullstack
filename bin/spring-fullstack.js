#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import { createProject } from '../src/commands/create.js';

program
  .name('spring-fullstack')
  .description('CLI pour générer des projets Spring Boot fullstack')
  .version('1.0.0');

program
  .command('new')
  .argument('<name>', 'nom du projet')
  .action(async (name) => {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Quelle base de données souhaitez-vous utiliser?',
        choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'H2']
      },
      {
        type: 'confirm',
        name: 'auth',
        message: 'Voulez-vous configurer l\'authentification?'
      },
      {
        type: 'list',
        name: 'frontend',
        message: 'Quel framework frontend souhaitez-vous utiliser?',
        choices: ['React', 'Vue.js', 'Angular', 'Aucun', 'Template Engine']
      }
    ]);

    await createProject(name, answers);
  });

program.parse();
