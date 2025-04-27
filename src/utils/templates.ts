import fs from 'fs-extra';
import path from 'path';
import type { ProjectOptions } from '../types.js';

export async function generateProjectStructure(options: ProjectOptions): Promise<void> {
  const projectPath = path.join(process.cwd(), options.projectName);

  // Create project directory
  await fs.ensureDir(projectPath);

  // Create basic structure
  await fs.ensureDir(path.join(projectPath, 'src/main/java'));
  await fs.ensureDir(path.join(projectPath, 'src/main/resources'));
  await fs.ensureDir(path.join(projectPath, 'src/test/java'));
  await fs.ensureDir(path.join(projectPath, 'src/test/resources'));

  // Create frontend directory if needed
  if (options.frontend !== 'None') {
    await fs.ensureDir(path.join(projectPath, 'frontend'));
  }

  // Create basic files
  await generatePomXml(projectPath, options);
  await generateApplicationProperties(projectPath, options);
  await generateReadme(projectPath, options);
}

async function generatePomXml(projectPath: string, options: ProjectOptions): Promise<void> {
  const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>${options.projectName}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${options.projectName}</name>
    <description>Spring Boot project generated with spring-fullstack CLI</description>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.0.0</version>
        <relativePath/>
    </parent>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

  await fs.writeFile(path.join(projectPath, 'pom.xml'), pomXml);
}

async function generateApplicationProperties(projectPath: string, options: ProjectOptions): Promise<void> {
  const applicationProperties = `# Application properties
spring.application.name=${options.projectName}
server.port=8080

# Database configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect`;

  await fs.writeFile(path.join(projectPath, 'src/main/resources/application.properties'), applicationProperties);
}

async function generateReadme(projectPath: string, options: ProjectOptions): Promise<void> {
  const readme = `# ${options.projectName}

A Spring Boot application generated with spring-fullstack CLI.

## Features

- Spring Boot 3.0
- ${options.database} database
${options.frontend !== 'None' ? `- ${options.frontend} frontend` : ''}
${options.authentication ? `- ${options.authType} authentication` : ''}

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven
${options.frontend !== 'None' ? '- Node.js and npm' : ''}

### Running the Application

1. Clone the repository
2. Run \`./mvnw spring-boot:run\` to start the backend
${options.frontend !== 'None' ? '3. In a separate terminal, run `cd frontend && npm install && npm run dev` to start the frontend' : ''}

## API Documentation

The API documentation is available at \`http://localhost:8080/swagger-ui.html\` when the application is running.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}
