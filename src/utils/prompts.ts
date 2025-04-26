import inquirer from 'inquirer';
import type { ProjectOptions, Database, Frontend, AuthType } from '../types';

export async function projectPrompts(name: string): Promise<ProjectOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'database',
      message: 'Quelle base de données souhaitez-vous utiliser?',
      choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'H2'] as Database[]
    },
    {
      type: 'confirm',
      name: 'authEnabled',
      message: 'Voulez-vous configurer l\'authentification?'
    },
    {
      type: 'list',
      name: 'authType',
      message: 'Quel type d\'authentification?',
      choices: ['JWT', 'OAuth2', 'Session'] as AuthType[],
      when: (answers) => answers.authEnabled
    },
    {
      type: 'list',
      name: 'frontend',
      message: 'Quel framework frontend souhaitez-vous utiliser?',
      choices: ['React', 'Vue.js', 'Angular', 'None', 'Template Engine'] as Frontend[]
    },
    {
      type: 'confirm',
      name: 'adminPanel',
      message: 'Voulez-vous un panel d\'administration?'
    },
    {
      type: 'confirm',
      name: 'swagger',
      message: 'Voulez-vous ajouter Swagger (documentation API)?'
    },
    {
      type: 'confirm',
      name: 'docker',
      message: 'Voulez-vous ajouter le support Docker?'
    }
  ]);

  return {
    name,
    database: answers.database,
    auth: answers.authEnabled ? {
      enabled: true,
      type: answers.authType
    } : null,
    frontend: answers.frontend,
    adminPanel: answers.adminPanel,
    swagger: answers.swagger,
    docker: answers.docker
  };
}
