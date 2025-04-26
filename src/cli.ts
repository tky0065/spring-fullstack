#!/usr/bin/env node
import { Command } from 'commander';
import { createProject } from './commands/create';
import { install } from './commands/install';
import { update } from './commands/update';
import { list } from './commands/list';

const program = new Command();

program
  .name('spring-fullstack')
  .description('CLI pour générer des projets fullstack Spring Boot')
  .version('1.0.0');

program
  .command('new')
  .description('Créer un nouveau projet fullstack')
  .argument('<project-name>', 'Nom du projet')
  .action(createProject);

program
  .command('install')
  .description('Installer le CLI globalement')
  .action(install);

program
  .command('update')
  .description('Mettre à jour le starter kit')
  .action(update);

program
  .command('list')
  .description('Lister les versions des templates disponibles')
  .action(list);

program.parse();
