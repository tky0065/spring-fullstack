export interface ProjectConfig {
  projectName: string;
  projectPath: string;
  database: {
    type: 'MySQL' | 'PostgreSQL' | 'MongoDB' | 'H2';
    host: string;
    port: string;
    username: string;
    password: string;
  };
  frontend: {
    framework: 'React' | 'Vue.js' | 'Angular' | 'None';
    testing: boolean;
  };
  authentication: boolean;
  emailEnabled: boolean;
  thirdPartyApis: boolean;
  i18n: boolean;
  migrations: boolean;
  multiModule: boolean;
  testing: boolean;
  adminPanel: boolean;
  swagger: boolean;
  deployment: {
    environments: string[];
    docker: boolean;
    kubernetes: boolean;
  };
  userManagement?: {
    enabled: boolean;
    adminPanel?: boolean;
  }; // Ajout de la propriété userManagement
  api: {
    type: 'rest' | 'graphql';
    documentation: boolean;
  }; // Ajout de la propriété api
  features: string[];
}
