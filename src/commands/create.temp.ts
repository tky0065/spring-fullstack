import inquirer from 'inquirer';
import { execa } from 'execa';
import gitClone from 'git-clone';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { generateBackend, generateFrontend, generateDocker } from './generators';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cloneAsync = promisify(gitClone);

interface Options {
  projectName: string;
  database?: string;
  authentication?: boolean;
  authType?: string;
  frontend?: string;
  adminPanel?: boolean;
  swagger?: boolean;
  docker?: boolean;
  ciCd?: boolean;
  environments?: boolean;
  monorepo?: boolean;
  security?: boolean;
  email?: boolean;
  thirdPartyApis?: boolean;
  tests?: boolean;
  i18n?: boolean;
  migrations?: boolean;
  multiModule?: boolean;
}

export interface ProjectOptions extends Options {
  projectName: string;
  database: string;
  authentication: boolean;
  authType: string;
  frontend: string;
  adminPanel: boolean;
  swagger: boolean;
  docker: boolean;
  ciCd: boolean;
  environments: boolean;
  monorepo: boolean;
  security: boolean;
  email: boolean;
  thirdPartyApis: boolean;
  tests: boolean;
  i18n: boolean;
  migrations: boolean;
  multiModule: boolean;
}

export async function createProject(projectName: string, options: Partial<Omit<Options, 'projectName'>> = {}) {
  const projectPath = path.join(process.cwd(), projectName);
  const spinner = ora('Création du projet...').start();

  try {
    // Vérifier si le dossier existe déjà
    if (existsSync(projectPath)) {
      spinner.fail(`Le dossier ${projectPath} existe déjà`);
      return;
    }

    // Créer le dossier du projet
    mkdirSync(projectPath);

    // Questions interactives
    const answers = await inquirer.prompt<ProjectOptions>([
      {
        type: 'list',
        name: 'database',
        message: 'Quel type de base de données voulez-vous utiliser ?',
        choices: ['MySQL', 'PostgreSQL', 'MongoDB', 'H2', 'Autre'],
      },
      {
        type: 'confirm',
        name: 'authentication',
        message: 'Voulez-vous configurer l\'authentification ?',
        default: true,
      },
      {
        type: 'list',
        name: 'authType',
        message: 'Type d\'authentification ?',
        choices: ['JWT', 'OAuth2', 'Session classique'],
        when: (answers: ProjectOptions) => answers.authentication,
      },
      {
        type: 'list',
        name: 'frontend',
        message: 'Souhaitez-vous un Frontend ?',
        choices: ['React', 'Vue.js', 'Angular', 'Aucun', 'Java Template Engine'],
      },
      {
        type: 'confirm',
        name: 'adminPanel',
        message: 'Voulez-vous un panel d\'administration prêt à l\'emploi ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'swagger',
        message: 'Voulez-vous ajouter Swagger (documentation API) ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'docker',
        message: 'Voulez-vous ajouter support Docker ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'ciCd',
        message: 'Voulez-vous ajouter la configuration CI/CD ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'environments',
        message: 'Voulez-vous configurer les environnements (dev/prod) ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'monorepo',
        message: 'Voulez-vous utiliser une structure monorepo ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'security',
        message: 'Voulez-vous ajouter des outils de sécurité avancés ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'email',
        message: 'Voulez-vous ajouter le support des emails ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'thirdPartyApis',
        message: 'Voulez-vous ajouter le support pour des API tierces ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'tests',
        message: 'Voulez-vous ajouter des tests avancés ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'i18n',
        message: 'Voulez-vous ajouter le support i18n ?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'migrations',
        message: 'Voulez-vous configurer les migrations de données ?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'multiModule',
        message: 'Voulez-vous utiliser une structure multi-modules ?',
        default: false,
      },
    ]);

    // Cloner le template de base
    await cloneAsync(
      'https://github.com/your-org/spring-fullstack-template.git',
      projectPath
    );

    // Générer les composants du projet
    spinner.text = 'Génération du backend...';
    await generateBackend(projectPath, answers);

    spinner.text = 'Génération du frontend...';
    await generateFrontend(projectPath, answers);

    if (answers.docker) {
      spinner.text = 'Génération des fichiers Docker...';
      await generateDocker(projectPath, answers);
    }

    // Installer les dépendances
    spinner.text = 'Installation des dépendances...';
    await execa('npm', ['install'], { cwd: projectPath });

    spinner.succeed(`Projet ${projectName} créé avec succès !`);
    console.log('\nPour démarrer le projet :');
    console.log(`cd ${projectName}`);
    console.log('npm run dev');

  } catch (error) {
    spinner.fail('Erreur lors de la création du projet');
    console.error(error);
  }
} 