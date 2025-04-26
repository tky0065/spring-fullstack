export interface ProjectOptions {
  name: string;
  database: Database;
  auth: AuthOptions | null;
  frontend: Frontend;
  adminPanel: boolean;
  swagger: boolean;
  docker: boolean;
}

export type Database = 'MySQL' | 'PostgreSQL' | 'MongoDB' | 'H2';
export type Frontend = 'React' | 'Vue.js' | 'Angular' | 'None' | 'Template Engine';
export type AuthType = 'JWT' | 'OAuth2' | 'Session';

export interface AuthOptions {
  enabled: boolean;
  type: AuthType;
}
