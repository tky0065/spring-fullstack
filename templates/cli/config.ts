import { ProjectConfig } from '../../src/types.js';

export const defaultConfig: ProjectConfig = {
  projectName: '',
  projectPath: '',
  database: {
    type: 'PostgreSQL',
    host: 'localhost',
    port: '5432',
    username: 'postgres',
    password: 'postgres',
    database: 'default_db'
  },
  frontend: {
    type: 'None',
    testing: false,
    framework: ''
  },
  authentication: {
    enabled: false,
    type: 'JWT',
    jwt: {
      secret: 'default_secret',
      expiration: 3600
    }
  },
  api: {
    type: 'rest',
    documentation: true
  },
  features: [],
  deployment: {
    type: 'docker',
    environments: ['dev', 'prod']
  },
  userManagement: {
    enabled: false,
    adminPanel: false // Ajout de la configuration par défaut pour userManagement
  }
};

export function validateConfig(config: ProjectConfig): void {
  if (!config.projectName) {
    throw new Error('Le nom du projet (projectName) est requis.');
  }
  if (!config.database.type) {
    throw new Error('Le type de base de données (database.type) est requis.');
  }
  if (config.authentication.enabled && !config.authentication.jwt?.secret) {
    throw new Error('Le secret JWT est requis lorsque l\'authentification est activée.');
  }
  if (!['rest', 'graphql'].includes(config.api.type)) {
    throw new Error('Le type d\'API doit être "rest" ou "graphql".');
  }
}
