import { ProjectConfig, ProjectFeatures, AuthenticationConfig, UserManagementConfig, TestingConfig, DockerConfig, FrontendConfig, ApiConfig, DatabaseConfig } from './features';

export const defaultFeatures: ProjectFeatures = {
  multiModule: false,
  monorepo: false,
  security: false,
  email: false,
  thirdPartyApis: false,
  migrations: {
    enabled: false,
    type: 'flyway'
  },
  i18n: false,
  openApi: false,
  environments: false
};

export const defaultAuthentication: AuthenticationConfig = {
  enabled: false,
  type: 'jwt'
};

export const defaultUserManagement: UserManagementConfig = {
  enabled: false,
  adminPanel: false
};

export const defaultTesting: TestingConfig = {
  enabled: false,
  advanced: false
};

export const defaultDocker: DockerConfig = {
  enabled: false
};

export const defaultFrontend: FrontendConfig = {
  framework: 'react',
  templateEngine: 'thymeleaf'
};

export const defaultApi: ApiConfig = {
  type: 'rest'
};

export const defaultDatabase: DatabaseConfig = {
  type: 'h2',
  host: 'localhost',
  port: '3306',
  username: 'root',
  password: 'root'
};

export const defaultConfig: ProjectConfig = {
  projectName: 'my-spring-app',
  features: defaultFeatures,
  authentication: defaultAuthentication,
  userManagement: defaultUserManagement,
  testing: defaultTesting,
  docker: defaultDocker,
  frontend: defaultFrontend,
  api: defaultApi,
  database: defaultDatabase
}; 