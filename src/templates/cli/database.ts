import { ProjectConfig } from '../../types.js'; // Correction du chemin d'importation
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupDatabase(config: ProjectConfig): Promise<void> {
  const backendPath = path.join(config.projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src/main/resources');
  
  await fs.ensureDir(resourcesPath);

  // Create application.properties with database configuration
  const applicationProps = `
spring.datasource.url=jdbc:${config.database.type.toLowerCase()}://${config.database.host}:${config.database.port}/app
spring.datasource.username=${config.database.username}
spring.datasource.password=${config.database.password}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
`;

  await fs.writeFile(path.join(resourcesPath, 'application.properties'), applicationProps);

  // Add database dependencies to pom.xml
  const pomPath = path.join(backendPath, 'pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');
  
  const dbType = config.database.type.toLowerCase();
  const dbDependency = dbType === 'postgresql' ?
    `<dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>` :
    dbType === 'mysql' ?
    `<dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
    </dependency>` :
    dbType === 'mongodb' ?
    `<dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>` :
    `<dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>`;

  const updatedPom = pomContent.replace(
    '</dependencies>',
    `${dbDependency}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPom);
} 
