import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupEnvironments(projectPath: string): Promise<void> {
  const resourcesPath = path.join(projectPath, 'backend/src/main/resources');
  
  // Configuration de base
  const baseConfig = `
spring:
  profiles:
    active: dev
  application:
    name: ${path.basename(projectPath)}
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: UTC
  mvc:
    pathmatch:
      matching-strategy: ant_path_matcher
`;

  // Configuration développement
  const devConfig = `
spring:
  datasource:
    url: jdbc:h2:mem:devdb
    username: sa
    password: 
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
  h2:
    console:
      enabled: true
      path: /h2-console
`;

  // Configuration production
  const prodConfig = `
spring:
  datasource:
    url: ${process.env.DATABASE_URL}
    username: ${process.env.DATABASE_USERNAME}
    password: ${process.env.DATABASE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  security:
    require-ssl: true
  mail:
    host: ${process.env.MAIL_HOST}
    port: ${process.env.MAIL_PORT}
    username: ${process.env.MAIL_USERNAME}
    password: ${process.env.MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
`;

  // Configuration test
  const testConfig = `
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password: 
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
  test:
    database:
      replace: none
`;

  // Créer les fichiers de configuration
  await fs.writeFile(path.join(resourcesPath, 'application.yml'), baseConfig);
  await fs.writeFile(path.join(resourcesPath, 'application-dev.yml'), devConfig);
  await fs.writeFile(path.join(resourcesPath, 'application-prod.yml'), prodConfig);
  await fs.writeFile(path.join(resourcesPath, 'application-test.yml'), testConfig);

  // Créer un fichier .env.example
  const envExample = `
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/your_database
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400000

# OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
`;

  await fs.writeFile(path.join(projectPath, '.env.example'), envExample);
}

async function setupEnvFiles(projectPath: string, config: ProjectConfig) {
  const envFiles = {
    '.env': `
# Application
APP_NAME=${config.projectName}
APP_VERSION=1.0.0
APP_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${config.projectName.toLowerCase()}
DB_USER=postgres
DB_PASSWORD=postgres

# Security
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
`,
    '.env.development': `
# Development Environment
APP_ENV=development
DEBUG=true
DB_HOST=localhost
DB_PORT=5432
`,
    '.env.production': `
# Production Environment
APP_ENV=production
DEBUG=false
DB_HOST=production-db
DB_PORT=5432
`
  };

  for (const [filename, content] of Object.entries(envFiles)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
}

async function setupSpringProfiles(projectPath: string, config: ProjectConfig) {
  const springProfiles = {
    'src/main/resources/application.yml': `
spring:
  profiles:
    active: ${config.environment}
  application:
    name: ${config.projectName}
`,
    'src/main/resources/application-development.yml': `
spring:
  datasource:
    url: jdbc:postgresql://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}
    username: ${process.env.DB_USER}
    password: ${process.env.DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    root: INFO
    com.${config.projectName.toLowerCase()}: DEBUG
`,
    'src/main/resources/application-production.yml': `
spring:
  datasource:
    url: jdbc:postgresql://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}
    username: ${process.env.DB_USER}
    password: ${process.env.DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

logging:
  level:
    root: WARN
    com.${config.projectName.toLowerCase()}: INFO
`
  };

  for (const [filename, content] of Object.entries(springProfiles)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
}

async function setupDockerEnv(projectPath: string, config: ProjectConfig) {
  const dockerEnv = {
    'docker-compose.yml': `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "${process.env.APP_PORT}:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=${process.env.APP_ENV}
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=${process.env.DB_NAME}
      - DB_USER=${process.env.DB_USER}
      - DB_PASSWORD=${process.env.DB_PASSWORD}
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=${process.env.DB_NAME}
      - POSTGRES_USER=${process.env.DB_USER}
      - POSTGRES_PASSWORD=${process.env.DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`
  };

  for (const [filename, content] of Object.entries(dockerEnv)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
} 