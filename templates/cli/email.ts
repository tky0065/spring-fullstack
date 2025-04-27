import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupEmail(projectPath: string): Promise<void> {
  const emailPath = path.join(projectPath, 'backend/src/main/java/com/example/email');
  await fs.mkdirp(emailPath);

  // Configuration des emails
  const emailConfig = {
    'EmailConfig.java': `
package com.example.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class EmailConfig {
    
    @Value("\${spring.mail.host}")
    private String host;
    
    @Value("\${spring.mail.port}")
    private int port;
    
    @Value("\${spring.mail.username}")
    private String username;
    
    @Value("\${spring.mail.password}")
    private String password;
    
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);
        
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true");
        
        return mailSender;
    }
}`,
    'EmailService.java': `
package com.example.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.util.Map;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private TemplateEngine templateEngine;
    
    public void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }
    
    public void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) 
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        Context context = new Context();
        context.setVariables(variables);
        
        String htmlContent = templateEngine.process(templateName, context);
        
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
    }
}`,
    'EmailTemplates.java': `
package com.example.email;

import org.springframework.stereotype.Component;

@Component
public class EmailTemplates {
    
    public static final String WELCOME_TEMPLATE = "welcome-email";
    public static final String PASSWORD_RESET_TEMPLATE = "password-reset-email";
    public static final String VERIFICATION_TEMPLATE = "verification-email";
}`
  };

  // Créer les fichiers d'email
  for (const [filename, content] of Object.entries(emailConfig)) {
    await fs.writeFile(path.join(emailPath, filename), content);
  }

  // Créer les templates d'email
  const templatesPath = path.join(projectPath, 'backend/src/main/resources/templates/email');
  await fs.mkdirp(templatesPath);

  const emailTemplates = {
    'welcome-email.html': `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome to ${path.basename(projectPath)}!</h1>
    <p>Dear <span th:text="${username}">User</span>,</p>
    <p>Thank you for joining our platform. We're excited to have you on board!</p>
    <p>Best regards,<br>The Team</p>
</body>
</html>`,
    'password-reset-email.html': `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Password Reset</title>
</head>
<body>
    <h1>Password Reset Request</h1>
    <p>Dear <span th:text="${username}">User</span>,</p>
    <p>We received a request to reset your password. Click the link below to proceed:</p>
    <p><a th:href="${resetLink}">Reset Password</a></p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The Team</p>
</body>
</html>`,
    'verification-email.html': `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Email Verification</title>
</head>
<body>
    <h1>Verify Your Email</h1>
    <p>Dear <span th:text="${username}">User</span>,</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a th:href="${verificationLink}">Verify Email</a></p>
    <p>If you didn't create an account, please ignore this email.</p>
    <p>Best regards,<br>The Team</p>
</body>
</html>`
  };

  // Créer les templates
  for (const [filename, content] of Object.entries(emailTemplates)) {
    await fs.writeFile(path.join(templatesPath, filename), content);
  }

  // Ajouter les dépendances d'email
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');

  const emailDependencies = `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>`;

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${emailDependencies}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);
} 