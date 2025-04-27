import inquirer from 'inquirer';
import type { ProjectOptions, Database, Frontend, AuthType } from '../types';

async function promptForProjectName(): Promise<string> {
  const { projectName } = await inquirer.prompt({
    type: 'input',
    name: 'projectName',
    message: 'Nom du projet :',
    validate: (input: string) => input.length > 0
  });
  return projectName;
}

async function promptForDatabase(): Promise<Database> {
  const { database } = await inquirer.prompt({
    type: 'list',
    name: 'database',
    message: 'Base de données :',
    choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'H2']
  });
  return database;
}

async function promptForAuth(): Promise<{ enabled: boolean; type: AuthType } | null> {
  const { enabled } = await inquirer.prompt({
    type: 'confirm',
    name: 'enabled',
    message: 'Activer l\'authentification ?',
    default: true
  });

  if (!enabled) return null;

  const { type } = await inquirer.prompt({
    type: 'list',
    name: 'type',
    message: 'Type d\'authentification :',
    choices: ['JWT', 'OAuth2', 'Session']
  });

  return { enabled, type };
}

async function promptForFrontend(): Promise<Frontend> {
  const { frontend } = await inquirer.prompt({
    type: 'list',
    name: 'frontend',
    message: 'Framework frontend :',
    choices: ['React', 'Vue.js', 'Angular', 'None', 'Java Template Engine']
  });
  return frontend;
}

async function promptForAdminPanel(): Promise<boolean> {
  const { adminPanel } = await inquirer.prompt({
    type: 'confirm',
    name: 'adminPanel',
    message: 'Ajouter un panel admin ?',
    default: false
  });
  return adminPanel;
}

async function promptForSwagger(): Promise<boolean> {
  const { swagger } = await inquirer.prompt({
    type: 'confirm',
    name: 'swagger',
    message: 'Ajouter Swagger ?',
    default: true
  });
  return swagger;
}

async function promptForDocker(): Promise<boolean> {
  const { docker } = await inquirer.prompt({
    type: 'confirm',
    name: 'docker',
    message: 'Ajouter Docker ?',
    default: true
  });
  return docker;
}

async function promptForCiCd(): Promise<boolean> {
  const { ciCd } = await inquirer.prompt({
    type: 'confirm',
    name: 'ciCd',
    message: 'Ajouter CI/CD ?',
    default: true
  });
  return ciCd;
}

async function promptForEnvironments(): Promise<boolean> {
  const { environments } = await inquirer.prompt({
    type: 'confirm',
    name: 'environments',
    message: 'Configurer les environnements ?',
    default: true
  });
  return environments;
}

async function promptForMonorepo(): Promise<boolean> {
  const { monorepo } = await inquirer.prompt({
    type: 'confirm',
    name: 'monorepo',
    message: 'Utiliser une structure monorepo ?',
    default: false
  });
  return monorepo;
}

async function promptForSecurity(): Promise<boolean> {
  const { security } = await inquirer.prompt({
    type: 'confirm',
    name: 'security',
    message: 'Ajouter la sécurité avancée ?',
    default: true
  });
  return security;
}

async function promptForEmail(): Promise<boolean> {
  const { email } = await inquirer.prompt({
    type: 'confirm',
    name: 'email',
    message: 'Ajouter le support des emails ?',
    default: false
  });
  return email;
}

async function promptForThirdPartyApis(): Promise<boolean> {
  const { thirdPartyApis } = await inquirer.prompt({
    type: 'confirm',
    name: 'thirdPartyApis',
    message: 'Ajouter le support des API tierces ?',
    default: false
  });
  return thirdPartyApis;
}

async function promptForTests(): Promise<boolean> {
  const { tests } = await inquirer.prompt({
    type: 'confirm',
    name: 'tests',
    message: 'Ajouter les tests avancés ?',
    default: true
  });
  return tests;
}

async function promptForI18n(): Promise<boolean> {
  const { i18n } = await inquirer.prompt({
    type: 'confirm',
    name: 'i18n',
    message: 'Ajouter le support i18n ?',
    default: false
  });
  return i18n;
}

async function promptForMigrations(): Promise<boolean> {
  const { migrations } = await inquirer.prompt({
    type: 'confirm',
    name: 'migrations',
    message: 'Configurer les migrations ?',
    default: true
  });
  return migrations;
}

async function promptForMultiModule(): Promise<boolean> {
  const { multiModule } = await inquirer.prompt({
    type: 'confirm',
    name: 'multiModule',
    message: 'Utiliser une structure multi-modules ?',
    default: false
  });
  return multiModule;
}

export async function promptForOptions(): Promise<ProjectOptions> {
  const projectName = await promptForProjectName();
  const database = await promptForDatabase();
  const auth = await promptForAuth();
  const frontend = await promptForFrontend();
  const adminPanel = await promptForAdminPanel();
  const swagger = await promptForSwagger();
  const docker = await promptForDocker();
  const ciCd = await promptForCiCd();
  const environments = await promptForEnvironments();
  const monorepo = await promptForMonorepo();
  const security = await promptForSecurity();
  const email = await promptForEmail();
  const thirdPartyApis = await promptForThirdPartyApis();
  const tests = await promptForTests();
  const i18n = await promptForI18n();
  const migrations = await promptForMigrations();
  const multiModule = await promptForMultiModule();

  return {
    projectName,
    database,
    authentication: auth?.enabled || false,
    authType: auth?.type,
    frontend,
    adminPanel,
    swagger,
    docker,
    ciCd,
    environments,
    monorepo,
    security,
    email,
    thirdPartyApis,
    tests,
    i18n,
    migrations,
    multiModule
  };
}
