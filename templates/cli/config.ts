import { ProjectConfig } from '../../src/types/config.js';

export const defaultConfig: ProjectConfig = {
  projectName: '',
  projectPath: '',
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    username: 'root',
    password: 'password'
  },
  frontend: {
    type: 'none',
    testing: false
  },
  authentication: {
    enabled: false
  },
  userManagement: {
    enabled: false
  },
  testing: false,
  docker: false,
  api: 'rest',
  features: [],
  deployment: undefined
};