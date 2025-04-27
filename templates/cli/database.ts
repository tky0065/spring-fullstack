import { ProjectConfig } from '../../src/types/config.js';
import fs from 'fs-extra';
import path from 'path';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'h2';

interface DatabaseConfig {
  url: string;
  driver?: string;
  dialect?: string;
}

interface DatabaseConfigs {
  postgresql: DatabaseConfig;
  mysql: DatabaseConfig;
  mongodb: DatabaseConfig;
  h2: DatabaseConfig;
}

interface DatabaseDependencies {
  postgresql: string;
  mysql: string;
  mongodb: string;
  h2: string;
}

export async function setupDatabase(config: ProjectConfig, projectPath: string): Promise<void> {
  const backendPath = join(projectPath, 'backend');
  const resourcesPath = join(backendPath, 'src/main/resources');
  
  // Create application.properties with database configuration
  const dbConfig: DatabaseConfigs = {
    postgresql: {
      url: 'jdbc:postgresql://localhost:5432/${spring.datasource.database}',
      driver: 'org.postgresql.Driver',
      dialect: 'org.hibernate.dialect.PostgreSQLDialect'
    },
    mysql: {
      url: 'jdbc:mysql://localhost:3306/${spring.datasource.database}',
      driver: 'com.mysql.cj.jdbc.Driver',
      dialect: 'org.hibernate.dialect.MySQL8Dialect'
    },
    mongodb: {
      url: 'mongodb://localhost:27017/${spring.data.mongodb.database}'
    },
    h2: {
      url: 'jdbc:h2:mem:testdb',
      driver: 'org.h2.Driver',
      dialect: 'org.hibernate.dialect.H2Dialect'
    }
  };

  const dbType = config.database.type as DatabaseType;
  const dbProps = dbConfig[dbType];

  let applicationProps = '';
  if (dbType === 'mongodb') {
    applicationProps = `
spring.data.mongodb.uri=${dbProps.url}
spring.data.mongodb.database=${config.projectName.toLowerCase()}
spring.data.mongodb.host=${config.database.host}
spring.data.mongodb.port=${config.database.port}
`;
  } else {
    applicationProps = `
spring.datasource.url=${dbProps.url}
spring.datasource.username=${config.database.username}
spring.datasource.password=${config.database.password}
spring.datasource.driver-class-name=${dbProps.driver}
spring.jpa.database-platform=${dbProps.dialect}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
`;
  }

  await mkdir(resourcesPath, { recursive: true });
  await writeFile(join(resourcesPath, 'application.properties'), applicationProps);

  // Add database dependencies to pom.xml
  const pomPath = join(backendPath, 'pom.xml');
  const pomContent = await readFile(pomPath, 'utf-8');
  
  const dbDependencies: DatabaseDependencies = {
    postgresql: `
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>`,
    mysql: `
    <dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
    </dependency>`,
    mongodb: `
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>`,
    h2: `
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>`
  };

  const updatedPom = pomContent.replace(
    '</dependencies>',
    `${dbDependencies[dbType]}\n    </dependencies>`
  );

  await writeFile(pomPath, updatedPom);
} 