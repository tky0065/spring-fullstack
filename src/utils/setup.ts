import { ProjectConfig } from '../types.js';
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
spring.datasource.url=jdbc:${config.database.type?.toLowerCase()}://${config.database.host}:${config.database.port}/app
spring.datasource.username=${config.database.username}
spring.datasource.password=${config.database.password}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
`;

  await fs.writeFile(path.join(resourcesPath, 'application.properties'), applicationProps);

  // Add database dependencies to pom.xml
  const pomPath = path.join(backendPath, 'pom.xml');
  if (await fs.pathExists(pomPath)) {
    const pomContent = await fs.readFile(pomPath, 'utf-8');
    
    const dbDependency = config.database.type === 'PostgreSQL' ?
      `<dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
      </dependency>` :
      config.database.type === 'MySQL' ?
      `<dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
      </dependency>` :
      config.database.type === 'MongoDB' ?
      `<dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
      </dependency>` :
      `<dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
      </dependency>`;

    if (!pomContent.includes(dbDependency)) {
      const updatedPom = pomContent.replace(
        '</dependencies>',
        `${dbDependency}\n    </dependencies>`
      );
      await fs.writeFile(pomPath, updatedPom);
    }
  }
}

export async function setupFrontend(config: ProjectConfig): Promise<void> {
  const frontendPath = path.join(config.projectPath, 'frontend');
  await fs.ensureDir(frontendPath);

  const packageJson = {
    name: path.basename(frontendPath),
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview'
    },
    dependencies: {
      ...(config.frontend.framework === 'React' && {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.11.2'
      }),
      ...(config.frontend.framework === 'Vue.js' && {
        'vue': '^3.3.4',
        'vue-router': '^4.2.2'
      }),
      ...(config.frontend.framework === 'Angular' && {
        '@angular/core': '^16.0.0',
        '@angular/platform-browser': '^16.0.0',
        '@angular/platform-browser-dynamic': '^16.0.0',
        '@angular/router': '^16.0.0',
        'rxjs': '^7.8.1',
        'zone.js': '^0.13.0'
      })
    },
    devDependencies: {
      'typescript': '^5.0.4',
      'vite': '^4.3.9',
      ...(config.frontend.framework === 'React' && {
        '@vitejs/plugin-react': '^4.0.0',
        '@types/react': '^18.2.7',
        '@types/react-dom': '^18.2.4'
      }),
      ...(config.frontend.framework === 'Vue.js' && {
        '@vitejs/plugin-vue': '^4.2.3',
        '@vue/compiler-sfc': '^3.3.4'
      })
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });
}
