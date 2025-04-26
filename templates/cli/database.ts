import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupDatabase(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  
  // Create database configuration
  const dbConfig = generateDatabaseConfig(config);
  await fs.writeFile(
    path.join(resourcesPath, 'application-database.yml'),
    dbConfig
  );
  
  // Create migration files if enabled
  if (config.features.migrations.enabled) {
    await setupMigrations(backendPath, config);
  }
}

function generateDatabaseConfig(config: ProjectConfig): string {
  const baseConfig = `
spring:
  datasource:
    url: ${getDatabaseUrl(config)}
    username: ${getDefaultUsername(config)}
    password: ${getDefaultPassword(config)}
    driver-class-name: ${getDriverClassName(config)}
  jpa:
    hibernate:
      ddl-auto: ${config.features.migrations.enabled ? 'validate' : 'update'}
    show-sql: true
    properties:
      hibernate:
        dialect: ${getHibernateDialect(config)}
`;

  if (config.database.type === 'MongoDB') {
    return `
spring:
  data:
    mongodb:
      uri: ${getDatabaseUrl(config)}
      database: ${config.projectName.toLowerCase()}
`;
  }

  return baseConfig;
}

function getDatabaseUrl(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'H2':
      return 'jdbc:h2:mem:testdb';
    case 'MySQL':
      return `jdbc:mysql://localhost:3306/${config.projectName.toLowerCase()}`;
    case 'PostgreSQL':
      return `jdbc:postgresql://localhost:5432/${config.projectName.toLowerCase()}`;
    case 'MongoDB':
      return 'mongodb://localhost:27017';
    default:
      return '';
  }
}

function getDefaultUsername(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'H2':
      return 'sa';
    case 'MySQL':
    case 'PostgreSQL':
      return 'root';
    default:
      return '';
  }
}

function getDefaultPassword(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'H2':
      return '';
    case 'MySQL':
    case 'PostgreSQL':
      return 'root';
    default:
      return '';
  }
}

function getDriverClassName(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'H2':
      return 'org.h2.Driver';
    case 'MySQL':
      return 'com.mysql.cj.jdbc.Driver';
    case 'PostgreSQL':
      return 'org.postgresql.Driver';
    default:
      return '';
  }
}

function getHibernateDialect(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'H2':
      return 'org.hibernate.dialect.H2Dialect';
    case 'MySQL':
      return 'org.hibernate.dialect.MySQL8Dialect';
    case 'PostgreSQL':
      return 'org.hibernate.dialect.PostgreSQLDialect';
    default:
      return '';
  }
}

async function setupMigrations(backendPath: string, config: ProjectConfig) {
  const migrationsPath = path.join(backendPath, 'src', 'main', 'resources', 'db', 'migration');
  await fs.ensureDir(migrationsPath);
  
  if (config.features.migrations.type === 'Flyway') {
    await setupFlywayMigrations(migrationsPath, config);
  } else {
    await setupLiquibaseMigrations(migrationsPath, config);
  }
}

async function setupFlywayMigrations(migrationsPath: string, config: ProjectConfig) {
  // Create initial migration
  await fs.writeFile(
    path.join(migrationsPath, 'V1__Initial_schema.sql'),
    generateInitialSchema(config)
  );
}

async function setupLiquibaseMigrations(migrationsPath: string, config: ProjectConfig) {
  // Create changelog
  await fs.writeFile(
    path.join(migrationsPath, 'changelog-master.xml'),
    generateLiquibaseChangelog(config)
  );
}

function generateInitialSchema(config: ProjectConfig): string {
  return `
-- Initial schema
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add more tables based on project needs
`;
}

function generateLiquibaseChangelog(config: ProjectConfig): string {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                      http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.4.xsd">

    <changeSet id="1" author="spring-fullstack">
        <createTable tableName="users">
            <column name="id" type="BIGINT" autoIncrement="true">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="username" type="VARCHAR(255)">
                <constraints unique="true" nullable="false"/>
            </column>
            <column name="password" type="VARCHAR(255)">
                <constraints nullable="false"/>
            </column>
            <column name="email" type="VARCHAR(255)">
                <constraints unique="true" nullable="false"/>
            </column>
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
            <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
        </createTable>
    </changeSet>
</databaseChangeLog>
`;
} 