import { ProjectConfig } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupDocker(config: ProjectConfig): Promise<void> {
  if (!config.deployment?.docker) {
    return;
  }

  const dockerfilePath = path.join(config.projectPath, 'Dockerfile');
  const dockerComposeFilePath = path.join(config.projectPath, 'docker-compose.yml');

  const dockerfileContent = `FROM openjdk:17-jdk-slim
WORKDIR /app
COPY backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]`;

  const dockerComposeContent = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    depends_on:
      - db
  db:
    image: ${config.database?.type === 'PostgreSQL' ? 'postgres:15-alpine' : config.database?.type === 'MySQL' ? 'mysql:8' : 'mongo:6'}
    ports:
      - "${config.database?.port}:${config.database?.port}"
    environment:
      - ${config.database?.type === 'PostgreSQL' ? 'POSTGRES_DB' : config.database?.type === 'MySQL' ? 'MYSQL_DATABASE' : 'MONGO_INITDB_DATABASE'}=app
      - ${config.database?.type === 'PostgreSQL' ? 'POSTGRES_USER' : config.database?.type === 'MySQL' ? 'MYSQL_USER' : 'MONGO_INITDB_ROOT_USERNAME'}=${config.database?.username}
      - ${config.database?.type === 'PostgreSQL' ? 'POSTGRES_PASSWORD' : config.database?.type === 'MySQL' ? 'MYSQL_PASSWORD' : 'MONGO_INITDB_ROOT_PASSWORD'}=${config.database?.password}`;

  await fs.writeFile(dockerfilePath, dockerfileContent);
  await fs.writeFile(dockerComposeFilePath, dockerComposeContent);
}
