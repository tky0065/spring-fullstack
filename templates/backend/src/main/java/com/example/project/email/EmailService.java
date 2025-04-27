package com.example.project.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import java.util.Map;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables) throws MessagingException {
        Context context = new Context();
        variables.forEach(context::setVariable);

        String htmlContent = templateEngine.process(templateName, context);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    public void sendWelcomeEmail(String to, String username) throws MessagingException {
        Map<String, Object> variables = Map.of("username", username);
        sendEmail(to, "Welcome to Our Platform", "email/welcome-email", variables);
    }

    public void sendPasswordResetEmail(String to, String resetLink) throws MessagingException {
        Map<String, Object> variables = Map.of(
            "resetLink", resetLink
        );
        sendEmail(to, "Password Reset Request", "email/password-reset-email", variables);
    }

    public void sendVerificationEmail(String to, String verificationLink) throws MessagingException {
        Map<String, Object> variables = Map.of(
            "verificationLink", verificationLink
        );
        sendEmail(to, "Verify Your Email", "email/verification-email", variables);
    }
} 