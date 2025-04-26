export interface ProjectConfig {
  projectName: string;
  database: {
    type: 'MySQL' | 'PostgreSQL' | 'MongoDB' | 'H2' | 'Other';
    customType?: string;
  };
  authentication: {
    enabled: boolean;
    type?: 'JWT' | 'Session' | 'OAuth2';
  };
  frontend: {
    framework: 'React' | 'Vue.js' | 'Angular' | 'None' | 'JavaTemplate';
    templateEngine?: 'Thymeleaf' | 'Freemarker' | 'JSP' | 'jte';
  };
  userManagement: {
    enabled: boolean;
    adminPanel: boolean;
  };
  api: {
    type: 'REST' | 'GraphQL';
  };
  testing: {
    enabled: boolean;
    advanced: boolean;
  };
  docker: {
    enabled: boolean;
  };
  features: {
    openApi: boolean;
    i18n: boolean;
    ciCd: boolean;
    environments: boolean;
    monorepo: boolean;
    security: boolean;
    email: boolean;
    thirdPartyApis: boolean;
    migrations: {
      enabled: boolean;
      type: 'Flyway' | 'Liquibase';
    };
    multiModule: boolean;
  };
}

export const defaultConfig: ProjectConfig = {
  projectName: '',
  database: {
    type: 'H2',
  },
  authentication: {
    enabled: false,
  },
  frontend: {
    framework: 'React',
  },
  userManagement: {
    enabled: false,
    adminPanel: false,
  },
  api: {
    type: 'REST',
  },
  testing: {
    enabled: false,
    advanced: false,
  },
  docker: {
    enabled: false,
  },
  features: {
    openApi: false,
    i18n: false,
    ciCd: false,
    environments: false,
    monorepo: false,
    security: false,
    email: false,
    thirdPartyApis: false,
    migrations: {
      enabled: false,
      type: 'Flyway',
    },
    multiModule: false,
  },
}; 