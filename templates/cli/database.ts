import { ProjectConfig } from './features';
import fs from 'fs-extra';
import path from 'path';

export async function setupDatabase(projectPath: string, config: ProjectConfig): Promise<void> {
  const { database } = config;
  
  // Create database configuration directory
  const dbConfigPath = path.join(projectPath, 'backend/src/main/resources');
  await fs.ensureDir(dbConfigPath);
  
  // Create application.properties with database configuration
  const dbConfig = generateDatabaseConfig(database);
  await fs.writeFile(
    path.join(dbConfigPath, 'application.properties'),
    dbConfig
  );
  
  // Add database dependencies to pom.xml
  await addDatabaseDependencies(projectPath, database.type);
}

function generateDatabaseConfig(database: ProjectConfig['database']): string {
  const config = {
    'spring.datasource.url': getDatabaseUrl(database),
    'spring.datasource.username': database.username,
    'spring.datasource.password': database.password,
    'spring.jpa.hibernate.ddl-auto': 'update',
    'spring.jpa.show-sql': 'true',
    'spring.jpa.properties.hibernate.format_sql': 'true',
    'spring.jpa.properties.hibernate.dialect': getHibernateDialect(database.type)
  };
  
  return Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function getDatabaseUrl(database: ProjectConfig['database']): string {
  switch (database.type) {
    case 'mysql':
      return `jdbc:mysql://${database.host}:${database.port}/spring_app?createDatabaseIfNotExist=true`;
    case 'postgresql':
      return `jdbc:postgresql://${database.host}:${database.port}/spring_app`;
    case 'mongodb':
      return `mongodb://${database.host}:${database.port}/spring_app`;
    case 'h2':
      return 'jdbc:h2:mem:spring_app;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE';
    default:
      throw new Error(`Unsupported database type: ${database.type}`);
  }
}

function getHibernateDialect(databaseType: string): string {
  switch (databaseType) {
    case 'mysql':
      return 'org.hibernate.dialect.MySQL8Dialect';
    case 'postgresql':
      return 'org.hibernate.dialect.PostgreSQLDialect';
    case 'h2':
      return 'org.hibernate.dialect.H2Dialect';
    default:
      throw new Error(`Unsupported database type: ${databaseType}`);
  }
}

async function addDatabaseDependencies(projectPath: string, databaseType: string): Promise<void> {
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');
  
  let dependencies = '';
  switch (databaseType) {
    case 'mysql':
      dependencies = `
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>`;
      break;
    case 'postgresql':
      dependencies = `
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>`;
      break;
    case 'mongodb':
      dependencies = `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>`;
      break;
    case 'h2':
      dependencies = `
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>`;
      break;
  }
  
  const updatedPom = pomContent.replace(
    '</dependencies>',
    `${dependencies}\n    </dependencies>`
  );
  
  await fs.writeFile(pomPath, updatedPom);
} 