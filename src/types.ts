export interface ProjectConfig {
  projectName: string;
  projectPath: string;
  databaseType: string;
  databaseHost: string;
  databasePort: string;
  databaseUsername: string;
  databasePassword: string;
  frontendFramework: string;
  authentication: boolean;
  emailEnabled: boolean;
  thirdPartyApis: boolean;
  i18n: boolean;
  migrations: boolean;
  multiModule: boolean;
  testing: boolean;
  deployment: {
    environments: string[];
    docker: boolean;
    kubernetes: boolean;
  };
}

export type Database = 'MySQL' | 'PostgreSQL' | 'MongoDB' | 'H2';
export type Frontend = 'React' | 'Vue.js' | 'Angular' | 'None' | 'Java Template Engine';
export type AuthType = 'JWT' | 'OAuth2' | 'Session';

export interface ProjectOptions {
  projectName: string;
  database: Database;
  authentication: boolean;
  authType?: AuthType;
  frontend: Frontend;
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