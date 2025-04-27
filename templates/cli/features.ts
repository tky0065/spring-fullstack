export interface ProjectFeatures {
  multiModule: boolean;
  monorepo: boolean;
  security: boolean;
  email: boolean;
  thirdPartyApis: boolean;
  migrations: {
    enabled: boolean;
    type: 'flyway' | 'liquibase';
  };
  i18n: boolean;
  openApi: boolean;
  environments: boolean;
}

export interface AuthenticationConfig {
  enabled: boolean;
  type: 'jwt' | 'oauth2' | 'basic';
}

export interface UserManagementConfig {
  enabled: boolean;
  adminPanel: boolean;
}

export interface TestingConfig {
  enabled: boolean;
  advanced: boolean;
}

export interface DockerConfig {
  enabled: boolean;
}

export interface FrontendConfig {
  framework: 'react' | 'vue' | 'angular' | 'none';
  templateEngine?: 'thymeleaf' | 'freemarker' | 'jsp';
}

export interface ApiConfig {
  type: 'rest' | 'graphql';
}

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'mongodb' | 'h2';
  host: string;
  port: string;
  username: string;
  password: string;
}

export interface ProjectConfig {
  projectName: string;
  features: ProjectFeatures;
  authentication: AuthenticationConfig;
  userManagement: UserManagementConfig;
  testing: TestingConfig;
  docker: DockerConfig;
  frontend: FrontendConfig;
  api: ApiConfig;
  database: DatabaseConfig;
} 