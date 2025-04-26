import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupEnvironments(projectPath: string, config: ProjectConfig) {
  await setupEnvFiles(projectPath, config);
  await setupSpringProfiles(projectPath, config);
  await setupDockerEnv(projectPath, config);
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