#!/usr/bin/env node

import { listTemplates } from './commands/list.js';
import { installGlobally } from './commands/install.js';
import { updatePackage } from './commands/update.js';
import { createProject } from './commands/create.js';
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

program
  .command('new')
  .description('Créer un nouveau projet')
  .argument('<name>', 'Nom du projet')
  .option('-d, --database <type>', 'Type de base de données')
  .option('-f, --frontend <framework>', 'Framework frontend')
  .action(createProject);

program.parse(process.argv);
