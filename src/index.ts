#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import createCommand from './commands/create.js';

const program = new Command();

program
  .name('spring-fullstack')
  .description('CLI tool to generate fullstack Spring Boot applications')
  .version('1.0.8');

program.addCommand(createCommand);

program.parse(process.argv); 