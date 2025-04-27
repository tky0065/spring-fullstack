import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupThirdPartyApis(projectPath: string, config: ProjectConfig): Promise<void> {
  await setupStripe(projectPath, config);
  await setupSendGrid(projectPath, config);
  await setupAwsS3(projectPath, config);

  const apiPath = path.join(projectPath, 'backend/src/main/java/com/example/api');
  await fs.mkdirp(apiPath);

  // Configuration des API tierces
  const apiConfig = {
    'StripeConfig.java': `
package com.example.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.stripe.Stripe;

@Configuration
public class StripeConfig {
    
    @Value("\${stripe.api.key}")
    private String stripeApiKey;
    
    @Bean
    public void initStripe() {
        Stripe.apiKey = stripeApiKey;
    }
}`,
    'StripeService.java': `
package com.example.api;

import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.param.ChargeCreateParams;
import org.springframework.stereotype.Service;

@Service
public class StripeService {
    
    public Charge createCharge(Long amount, String currency, String source) throws StripeException {
        ChargeCreateParams params = ChargeCreateParams.builder()
            .setAmount(amount)
            .setCurrency(currency)
            .setSource(source)
            .build();
        
        return Charge.create(params);
    }
}`,
    'SendGridConfig.java': `
package com.example.api;

import com.sendgrid.SendGrid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SendGridConfig {
    
    @Value("\${sendgrid.api.key}")
    private String sendGridApiKey;
    
    @Bean
    public SendGrid sendGrid() {
        return new SendGrid(sendGridApiKey);
    }
}`,
    'SendGridService.java': `
package com.example.api;

import com.sendgrid.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SendGridService {
    
    @Autowired
    private SendGrid sendGrid;
    
    public void sendEmail(String to, String subject, String content) throws Exception {
        Email from = new Email("your-email@example.com");
        Email toEmail = new Email(to);
        Content emailContent = new Content("text/plain", content);
        Mail mail = new Mail(from, subject, toEmail, emailContent);
        
        Request request = new Request();
        request.setMethod(Method.POST);
        request.setEndpoint("mail/send");
        request.setBody(mail.build());
        
        sendGrid.api(request);
    }
}`,
    'S3Config.java': `
package com.example.api;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class S3Config {
    
    @Value("\${aws.access.key}")
    private String accessKey;
    
    @Value("\${aws.secret.key}")
    private String secretKey;
    
    @Value("\${aws.region}")
    private String region;
    
    @Bean
    public AmazonS3 amazonS3() {
        BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
        return AmazonS3ClientBuilder.standard()
            .withCredentials(new AWSStaticCredentialsProvider(credentials))
            .withRegion(region)
            .build();
    }
}`,
    'S3Service.java': `
package com.example.api;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.PutObjectRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Service
public class S3Service {
    
    @Autowired
    private AmazonS3 amazonS3;
    
    @Value("\${aws.s3.bucket}")
    private String bucketName;
    
    public String uploadFile(MultipartFile file) throws IOException {
        File fileObj = convertMultiPartFileToFile(file);
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        amazonS3.putObject(new PutObjectRequest(bucketName, fileName, fileObj));
        fileObj.delete();
        return fileName;
    }
    
    private File convertMultiPartFileToFile(MultipartFile file) throws IOException {
        File convertedFile = new File(file.getOriginalFilename());
        FileOutputStream fos = new FileOutputStream(convertedFile);
        fos.write(file.getBytes());
        fos.close();
        return convertedFile;
    }
}`
  };

  // Créer les fichiers d'API
  for (const [filename, content] of Object.entries(apiConfig)) {
    await fs.writeFile(path.join(apiPath, filename), content);
  }

  // Ajouter les dépendances des API tierces
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');

  const apiDependencies = `
        <dependency>
            <groupId>com.stripe</groupId>
            <artifactId>stripe-java</artifactId>
            <version>20.77.0</version>
        </dependency>
        <dependency>
            <groupId>com.sendgrid</groupId>
            <artifactId>sendgrid-java</artifactId>
            <version>4.7.2</version>
        </dependency>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-java-sdk-s3</artifactId>
            <version>1.12.95</version>
        </dependency>`;

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${apiDependencies}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);
}

async function setupStripe(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const servicePath = path.join(backendPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'service');
  
  // Create Stripe configuration
  const stripeConfig = `
stripe:
  api:
    key: your-stripe-secret-key
    public-key: your-stripe-public-key
    webhook-secret: your-stripe-webhook-secret
`;

  await fs.writeFile(
    path.join(backendPath, 'src', 'main', 'resources', 'application-stripe.yml'),
    stripeConfig
  );
  
  // Create StripeService interface
  const stripeServiceInterface = `
package com.${config.projectName.toLowerCase()}.service;

import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Subscription;

public interface StripeService {
    Customer createCustomer(String email, String name);
    PaymentIntent createPaymentIntent(Long amount, String currency, String customerId);
    Subscription createSubscription(String customerId, String priceId);
    void cancelSubscription(String subscriptionId);
    PaymentIntent confirmPayment(String paymentIntentId);
    Customer getCustomer(String customerId);
}
`;

  await fs.writeFile(
    path.join(servicePath, 'StripeService.java'),
    stripeServiceInterface
  );
  
  // Create StripeServiceImpl
  const stripeServiceImpl = `
package com.${config.projectName.toLowerCase()}.service.impl;

import com.${config.projectName.toLowerCase()}.service.StripeService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Subscription;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.SubscriptionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Service
public class StripeServiceImpl implements StripeService {

    @Value("\${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    @Override
    public Customer createCustomer(String email, String name) {
        try {
            CustomerCreateParams params = CustomerCreateParams.builder()
                .setEmail(email)
                .setName(name)
                .build();
            return Customer.create(params);
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create customer", e);
        }
    }

    @Override
    public PaymentIntent createPaymentIntent(Long amount, String currency, String customerId) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setCustomer(customerId)
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                        .setEnabled(true)
                        .build()
                )
                .build();
            return PaymentIntent.create(params);
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create payment intent", e);
        }
    }

    @Override
    public Subscription createSubscription(String customerId, String priceId) {
        try {
            SubscriptionCreateParams params = SubscriptionCreateParams.builder()
                .setCustomer(customerId)
                .addItem(
                    SubscriptionCreateParams.Item.builder()
                        .setPrice(priceId)
                        .build()
                )
                .build();
            return Subscription.create(params);
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create subscription", e);
        }
    }

    @Override
    public void cancelSubscription(String subscriptionId) {
        try {
            Subscription subscription = Subscription.retrieve(subscriptionId);
            subscription.cancel();
        } catch (StripeException e) {
            throw new RuntimeException("Failed to cancel subscription", e);
        }
    }

    @Override
    public PaymentIntent confirmPayment(String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            return paymentIntent.confirm();
        } catch (StripeException e) {
            throw new RuntimeException("Failed to confirm payment", e);
        }
    }

    @Override
    public Customer getCustomer(String customerId) {
        try {
            return Customer.retrieve(customerId);
        } catch (StripeException e) {
            throw new RuntimeException("Failed to retrieve customer", e);
        }
    }
}
`;

  await fs.writeFile(
    path.join(servicePath, 'impl', 'StripeServiceImpl.java'),
    stripeServiceImpl
  );
}

async function setupSendGrid(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const servicePath = path.join(backendPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'service');
  
  // Create SendGrid configuration
  const sendGridConfig = `
sendgrid:
  api:
    key: your-sendgrid-api-key
    from-email: noreply@${config.projectName.toLowerCase()}.com
    from-name: ${config.projectName}
`;

  await fs.writeFile(
    path.join(backendPath, 'src', 'main', 'resources', 'application-sendgrid.yml'),
    sendGridConfig
  );
  
  // Create SendGridService interface
  const sendGridServiceInterface = `
package com.${config.projectName.toLowerCase()}.service;

import com.sendgrid.Response;

public interface SendGridService {
    Response sendEmail(String to, String subject, String content);
    Response sendTemplateEmail(String to, String templateId, Object templateData);
}
`;

  await fs.writeFile(
    path.join(servicePath, 'SendGridService.java'),
    sendGridServiceInterface
  );
  
  // Create SendGridServiceImpl
  const sendGridServiceImpl = `
package com.${config.projectName.toLowerCase()}.service.impl;

import com.${config.projectName.toLowerCase()}.service.SendGridService;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.helpers.mail.objects.Personalization;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class SendGridServiceImpl implements SendGridService {

    @Value("\${sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("\${sendgrid.api.from-email}")
    private String fromEmail;

    @Value("\${sendgrid.api.from-name}")
    private String fromName;

    @Override
    public Response sendEmail(String to, String subject, String content) {
        Email from = new Email(fromEmail, fromName);
        Email toEmail = new Email(to);
        Content emailContent = new Content("text/html", content);
        Mail mail = new Mail(from, subject, toEmail, emailContent);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            return sg.api(request);
        } catch (IOException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    public Response sendTemplateEmail(String to, String templateId, Object templateData) {
        Email from = new Email(fromEmail, fromName);
        Email toEmail = new Email(to);
        Mail mail = new Mail();
        mail.setFrom(from);
        mail.setTemplateId(templateId);

        Personalization personalization = new Personalization();
        personalization.addTo(toEmail);
        personalization.addDynamicTemplateData("data", templateData);
        mail.addPersonalization(personalization);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            return sg.api(request);
        } catch (IOException e) {
            throw new RuntimeException("Failed to send template email", e);
        }
    }
}
`;

  await fs.writeFile(
    path.join(servicePath, 'impl', 'SendGridServiceImpl.java'),
    sendGridServiceImpl
  );
}

async function setupAwsS3(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const servicePath = path.join(backendPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'service');
  
  // Create AWS S3 configuration
  const awsConfig = `
aws:
  s3:
    access-key: your-aws-access-key
    secret-key: your-aws-secret-key
    region: us-east-1
    bucket: ${config.projectName.toLowerCase()}-bucket
`;

  await fs.writeFile(
    path.join(backendPath, 'src', 'main', 'resources', 'application-aws.yml'),
    awsConfig
  );
  
  // Create S3Service interface
  const s3ServiceInterface = `
package com.${config.projectName.toLowerCase()}.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.net.URL;

public interface S3Service {
    String uploadFile(MultipartFile file, String path);
    InputStream downloadFile(String path);
    void deleteFile(String path);
    URL generatePresignedUrl(String path, long expirationInMinutes);
}
`;

  await fs.writeFile(
    path.join(servicePath, 'S3Service.java'),
    s3ServiceInterface
  );
  
  // Create S3ServiceImpl
  const s3ServiceImpl = `
package com.${config.projectName.toLowerCase()}.service.impl;

import com.${config.projectName.toLowerCase()}.service.S3Service;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.*;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Date;

@Service
public class S3ServiceImpl implements S3Service {

    @Value("\${aws.s3.access-key}")
    private String accessKey;

    @Value("\${aws.s3.secret-key}")
    private String secretKey;

    @Value("\${aws.s3.region}")
    private String region;

    @Value("\${aws.s3.bucket}")
    private String bucket;

    private final AmazonS3 s3Client;

    public S3ServiceImpl() {
        this.s3Client = AmazonS3ClientBuilder.standard()
            .withRegion(region)
            .build();
    }

    @Override
    public String uploadFile(MultipartFile file, String path) {
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());

            PutObjectRequest request = new PutObjectRequest(bucket, path, file.getInputStream(), metadata);
            s3Client.putObject(request);
            return path;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    @Override
    public InputStream downloadFile(String path) {
        try {
            S3Object object = s3Client.getObject(bucket, path);
            return object.getObjectContent();
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file", e);
        }
    }

    @Override
    public void deleteFile(String path) {
        try {
            s3Client.deleteObject(bucket, path);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    @Override
    public URL generatePresignedUrl(String path, long expirationInMinutes) {
        try {
            Date expiration = new Date();
            long expTimeMillis = expiration.getTime();
            expTimeMillis += 1000 * 60 * expirationInMinutes;
            expiration.setTime(expTimeMillis);

            GeneratePresignedUrlRequest generatePresignedUrlRequest = 
                new GeneratePresignedUrlRequest(bucket, path)
                    .withMethod(HttpMethod.GET)
                    .withExpiration(expiration);

            return s3Client.generatePresignedUrl(generatePresignedUrlRequest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned URL", e);
        }
    }
}
`;

  await fs.writeFile(
    path.join(servicePath, 'impl', 'S3ServiceImpl.java'),
    s3ServiceImpl
  );
} 