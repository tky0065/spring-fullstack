export interface ProjectConfig {
  projectName: string;
  projectPath: string;
  database: {
    type: 'postgresql' | 'mysql' | 'mongodb' | 'h2';
    host: string;
    port: string;
    username: string;
    password: string;
  };
  frontend: {
    type: 'react' | 'vue' | 'angular' | 'none';
    framework?: string;
    styling?: 'css' | 'scss' | 'tailwind';
    testing?: boolean;
  };
  authentication: {
    enabled: boolean;
    type?: 'jwt' | 'oauth2' | 'session';
  };
  userManagement: {
    enabled: boolean;
    adminPanel?: boolean;
  };
  testing: boolean;
  docker: boolean;
  api: 'rest' | 'graphql';
  features: string[];
  deployment?: {
    provider: 'aws' | 'gcp' | 'azure';
    region: string;
    environment: 'development' | 'staging' | 'production';
  };
}

export interface Options {
  projectName: string;
  database: string;
  frontend: string;
  auth: string;
}

export const DEFAULT_CONFIG: ProjectConfig = {
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