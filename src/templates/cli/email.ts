import { ProjectConfig } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupEmail(config: ProjectConfig): Promise<void> {
  if (!config.emailEnabled) {
    return;
  }

  const backendPath = path.join(config.projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src/main/resources');
  const templatesPath = path.join(resourcesPath, 'templates/email');

  // Créer les dossiers nécessaires
  await fs.ensureDir(templatesPath);

  // Mettre à jour le pom.xml pour ajouter les dépendances email
  const pomPath = path.join(backendPath, 'pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');
  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-mail</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
</dependencies>`
  );
  await fs.writeFile(pomPath, updatedPomContent);

  // Créer les templates d'email
  const welcomeTemplate = `<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome to our application!</h1>
    <p>Dear <span th:text="\${name}">User</span>,</p>
    <p>Thank you for joining our platform. We're excited to have you on board!</p>
    <p>Best regards,<br>The Team</p>
</body>
</html>`;

  const resetPasswordTemplate = `<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body>
    <h1>Password Reset Request</h1>
    <p>Dear <span th:text="\${name}">User</span>,</p>
    <p>We received a request to reset your password. Click the link below to proceed:</p>
    <p><a th:href="\${resetLink}" th:text="\${resetLink}">Reset Password</a></p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The Team</p>
</body>
</html>`;

  const verificationTemplate = `<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body>
    <h1>Verify Your Email</h1>
    <p>Dear <span th:text="\${name}">User</span>,</p>
    <p>Please click the link below to verify your email address:</p>
    <p><a th:href="\${verificationLink}" th:text="\${verificationLink}">Verify Email</a></p>
    <p>If you didn't create an account, please ignore this email.</p>
    <p>Best regards,<br>The Team</p>
</body>
</html>`;

  await fs.writeFile(path.join(templatesPath, 'welcome.html'), welcomeTemplate);
  await fs.writeFile(path.join(templatesPath, 'reset-password.html'), resetPasswordTemplate);
  await fs.writeFile(path.join(templatesPath, 'verification.html'), verificationTemplate);

  // Mettre à jour application.yml pour la configuration email
  const applicationYmlPath = path.join(resourcesPath, 'application.yml');
  const emailConfig = `
spring:
  mail:
    host: \${SMTP_HOST:smtp.gmail.com}
    port: \${SMTP_PORT:587}
    username: \${SMTP_USERNAME:}
    password: \${SMTP_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
`;

  await fs.appendFile(applicationYmlPath, emailConfig);
} 