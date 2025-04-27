import { ProjectConfig } from '../../src/types.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupDocker(config: ProjectConfig, projectPath: string): Promise<void> {
  const dockerPath = path.join(projectPath, 'docker');

  // Create Docker directory
  await fs.mkdirp(dockerPath);

  // Generate Dockerfile
  const dockerfileContent = `
    FROM openjdk:11
    WORKDIR /app
    COPY ./backend/target/*.jar app.jar
    ENTRYPOINT ["java", "-jar", "app.jar"]
  `;

  await fs.writeFile(path.join(dockerPath, 'Dockerfile'), dockerfileContent);

  // Generate docker-compose.yml
  const dockerComposeContent = `
    version: '3.8'
    services:
      app:
        build: .
        ports:
          - "8080:8080"
  `;

  await fs.writeFile(path.join(dockerPath, 'docker-compose.yml'), dockerComposeContent);
}
