import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupEmail(projectPath: string, config: ProjectConfig) {
  await setupEmailConfig(projectPath, config);
  await setupEmailService(projectPath, config);
  await setupEmailTemplates(projectPath, config);
}

async function setupEmailConfig(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  
  // Create email configuration
  const emailConfig = `
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${config.projectName.toLowerCase()}@gmail.com
    password: your-app-password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
`;

  await fs.writeFile(
    path.join(resourcesPath, 'application-email.yml'),
    emailConfig
  );
}

async function setupEmailService(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const servicePath = path.join(backendPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'service');
  
  // Create EmailService interface
  const emailServiceInterface = `
package com.${config.projectName.toLowerCase()}.service;

import org.springframework.mail.SimpleMailMessage;

public interface EmailService {
    void sendSimpleMessage(String to, String subject, String text);
    void sendHtmlMessage(String to, String subject, String htmlContent);
    void sendWelcomeEmail(String to, String username);
    void sendPasswordResetEmail(String to, String token);
    void sendVerificationEmail(String to, String token);
}
`;

  await fs.writeFile(
    path.join(servicePath, 'EmailService.java'),
    emailServiceInterface
  );
  
  // Create EmailServiceImpl
  const emailServiceImpl = `
package com.${config.projectName.toLowerCase()}.service.impl;

import com.${config.projectName.toLowerCase()}.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender emailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Override
    public void sendSimpleMessage(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        emailSender.send(message);
    }

    @Override
    public void sendHtmlMessage(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            emailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    public void sendWelcomeEmail(String to, String username) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("username", username);
        variables.put("appName", "${config.projectName}");
        
        Context context = new Context();
        context.setVariables(variables);
        
        String htmlContent = templateEngine.process("welcome-email", context);
        sendHtmlMessage(to, "Welcome to ${config.projectName}!", htmlContent);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("token", token);
        variables.put("appName", "${config.projectName}");
        
        Context context = new Context();
        context.setVariables(variables);
        
        String htmlContent = templateEngine.process("password-reset-email", context);
        sendHtmlMessage(to, "Reset Your Password", htmlContent);
    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("token", token);
        variables.put("appName", "${config.projectName}");
        
        Context context = new Context();
        context.setVariables(variables);
        
        String htmlContent = templateEngine.process("verification-email", context);
        sendHtmlMessage(to, "Verify Your Email", htmlContent);
    }
}
`;

  await fs.writeFile(
    path.join(servicePath, 'impl', 'EmailServiceImpl.java'),
    emailServiceImpl
  );
}

async function setupEmailTemplates(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const templatesPath = path.join(backendPath, 'src', 'main', 'resources', 'templates', 'email');
  
  // Create welcome email template
  const welcomeEmailTemplate = `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Welcome to ${config.projectName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to ${config.projectName}!</h1>
    </div>
    <div class="content">
        <p>Hello <span th:text="${username}">User</span>,</p>
        <p>Thank you for joining ${config.projectName}! We're excited to have you on board.</p>
        <p>Your account has been successfully created and is ready to use.</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The ${config.projectName} Team</p>
    </div>
    <div class="footer">
        <p>This is an automated message, please do not reply to this email.</p>
    </div>
</body>
</html>
`;

  await fs.writeFile(
    path.join(templatesPath, 'welcome-email.html'),
    welcomeEmailTemplate
  );
  
  // Create password reset email template
  const passwordResetTemplate = `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f44336;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset your password for your ${config.projectName} account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center;">
            <a th:href="@{${'http://localhost:8080/reset-password?token=' + token}}" class="button">
                Reset Password
            </a>
        </p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
    </div>
    <div class="footer">
        <p>This is an automated message, please do not reply to this email.</p>
    </div>
</body>
</html>
`;

  await fs.writeFile(
    path.join(templatesPath, 'password-reset-email.html'),
    passwordResetTemplate
  );
  
  // Create verification email template
  const verificationTemplate = `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2196F3;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Verify Your Email</h1>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p>Thank you for registering with ${config.projectName}!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
            <a th:href="@{${'http://localhost:8080/verify-email?token=' + token}}" class="button">
                Verify Email
            </a>
        </p>
        <p>If you didn't create an account with ${config.projectName}, you can safely ignore this email.</p>
    </div>
    <div class="footer">
        <p>This is an automated message, please do not reply to this email.</p>
    </div>
</body>
</html>
`;

  await fs.writeFile(
    path.join(templatesPath, 'verification-email.html'),
    verificationTemplate
  );
} 