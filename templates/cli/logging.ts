import fs from 'fs-extra';
import path from 'path';

export async function setupLogging(projectPath: string): Promise<void> {
  const loggingPath = path.join(projectPath, 'backend/src/main/resources');
  await fs.mkdirp(loggingPath);

  // Configuration des logs
  const loggingConfig = `
logging:
  level:
    root: INFO
    com.example: DEBUG
    org.springframework: INFO
    org.hibernate: INFO
  file:
    name: logs/application.log
    max-size: 10MB
    max-history: 10
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
`;

  await fs.writeFile(path.join(loggingPath, 'application-logging.yml'), loggingConfig);

  // Créer le dossier des logs
  await fs.mkdirp(path.join(projectPath, 'backend/logs'));

  // Ajouter les dépendances de logging
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');

  const loggingDependencies = `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
        </dependency>`;

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${loggingDependencies}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);
} 