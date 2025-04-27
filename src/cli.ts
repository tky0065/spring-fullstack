#!/usr/bin/env node

import { listTemplates } from './commands/list.js';
import { installGlobally } from './commands/install.js';
import { updatePackage } from './commands/update.js';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('CLI pour générer des projets Spring Boot fullstack');

program
  .command('list')
  .description('Lister les versions disponibles des templates')
  .action(listTemplates);

program
  .command('install')
  .description('Installer le CLI globalement')
  .action(installGlobally);

program
  .command('update')
  .description('Mettre à jour le CLI')
  .action(updatePackage);

program.parse(process.argv);
