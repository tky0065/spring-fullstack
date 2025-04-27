#!/usr/bin/env node

import { program } from 'commander';
import createCommand from './commands/create.js';

program
  .version('1.0.0')
  .description('CLI tool for creating fullstack Spring Boot projects');

program.addCommand(createCommand);

program.parse(process.argv);
