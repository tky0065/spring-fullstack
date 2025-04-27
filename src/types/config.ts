export interface ProjectConfig {
  projectName: string;
  database: {
    type: 'postgresql' | 'mysql' | 'mongodb' | 'h2';
    host: string;
    port: string;
    username: string;
    password: string;
  };
  frontend: {
    framework: 'react' | 'vue' | 'angular' | 'none';
    templateEngine?: 'thymeleaf' | 'freemarker' | 'jsp';
  };
  auth: {
    type: 'jwt' | 'session' | 'oauth2';
  };
}

export const defaultConfig: ProjectConfig = {
  projectName: 'my-spring-app',
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    username: 'postgres',
    password: 'postgres'
  },
  frontend: {
    framework: 'react'
  },
  auth: {
    type: 'jwt'
  }
}; 