import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ProjectConfig } from '../../src/types';
import { Buffer } from 'buffer';

export function setupDeployment(config: ProjectConfig) {
  const deploymentPath = join(config.projectPath, 'deployment');
  mkdirSync(deploymentPath, { recursive: true });

  // Configuration des environnements
  setupEnvironments(deploymentPath, config);
  
  // Configuration Docker
  setupDocker(deploymentPath, config);
  
  // Configuration Kubernetes
  setupKubernetes(deploymentPath, config);
  
  // Scripts de déploiement
  setupDeploymentScripts(deploymentPath, config);
}

function setupEnvironments(deploymentPath: string, config: ProjectConfig) {
  const envPath = join(deploymentPath, 'environments');
  mkdirSync(envPath, { recursive: true });

  // Configuration développement
  writeFileSync(
    join(envPath, 'application-dev.yml'),
    `spring:
  datasource:
    url: jdbc:${config.databaseType}://localhost:3306/${config.projectName}_dev
    username: dev_user
    password: dev_password
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  logging:
    level:
      root: DEBUG
      org.hibernate.SQL: DEBUG
      org.hibernate.type.descriptor.sql.BasicBinder: TRACE
`
  );

  // Configuration test
  writeFileSync(
    join(envPath, 'application-test.yml'),
    `spring:
  datasource:
    url: jdbc:${config.databaseType}://localhost:3306/${config.projectName}_test
    username: test_user
    password: test_password
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  logging:
    level:
      root: INFO
`
  );

  // Configuration production
  writeFileSync(
    join(envPath, 'application-prod.yml'),
    `spring:
  datasource:
    url: jdbc:${config.databaseType}://${config.databaseHost}:${config.databasePort}/${config.projectName}
    username: ${config.databaseUsername}
    password: ${config.databasePassword}
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
  logging:
    level:
      root: WARN
`
  );
}

function setupDocker(deploymentPath: string, config: ProjectConfig) {
  const dockerPath = join(deploymentPath, 'docker');
  mkdirSync(dockerPath, { recursive: true });

  // Dockerfile pour le backend
  writeFileSync(
    join(dockerPath, 'Dockerfile'),
    `FROM maven:3.8.4-openjdk-11 as build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
`
  );

  // docker-compose.yml
  writeFileSync(
    join(dockerPath, 'docker-compose.yml'),
    `version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: deployment/docker/Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:${config.databaseType}://db:3306/${config.projectName}
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root
    depends_on:
      - db

  db:
    image: ${config.databaseType}:latest
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=${config.projectName}
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
`
  );
}

function setupKubernetes(deploymentPath: string, config: ProjectConfig) {
  const k8sPath = join(deploymentPath, 'kubernetes');
  mkdirSync(k8sPath, { recursive: true });

  // Déploiement backend
  writeFileSync(
    join(k8sPath, 'backend-deployment.yml'),
    `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${config.projectName}-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${config.projectName}-backend
  template:
    metadata:
      labels:
        app: ${config.projectName}-backend
    spec:
      containers:
      - name: ${config.projectName}-backend
        image: ${config.projectName}-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            secretKeyRef:
              name: ${config.projectName}-secrets
              key: datasource-url
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: ${config.projectName}-secrets
              key: datasource-username
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ${config.projectName}-secrets
              key: datasource-password
`
  );

  // Service backend
  writeFileSync(
    join(k8sPath, 'backend-service.yml'),
    `apiVersion: v1
kind: Service
metadata:
  name: ${config.projectName}-backend
spec:
  selector:
    app: ${config.projectName}-backend
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
`
  );

  // Secrets
  writeFileSync(
    join(k8sPath, 'secrets.yml'),
    `apiVersion: v1
kind: Secret
metadata:
  name: ${config.projectName}-secrets
type: Opaque
data:
  datasource-url: ${Buffer.from(`jdbc:${config.databaseType}://db:3306/${config.projectName}`).toString('base64')}
  datasource-username: ${Buffer.from('root').toString('base64')}
  datasource-password: ${Buffer.from('root').toString('base64')}
`
  );
}

function setupDeploymentScripts(deploymentPath: string, config: ProjectConfig) {
  const scriptsPath = join(deploymentPath, 'scripts');
  mkdirSync(scriptsPath, { recursive: true });

  // Script de déploiement
  writeFileSync(
    join(scriptsPath, 'deploy.sh'),
    `#!/bin/bash

# Variables
APP_NAME="${config.projectName}"
VERSION="1.0.0"
ENVIRONMENT=$1

# Validation de l'environnement
if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./deploy.sh <environment>"
  echo "Environments: dev, test, prod"
  exit 1
fi

# Build de l'application
echo "Building application..."
mvn clean package -DskipTests

# Build de l'image Docker
echo "Building Docker image..."
docker build -t $APP_NAME:$VERSION -f deployment/docker/Dockerfile .

# Tag de l'image
docker tag $APP_NAME:$VERSION $APP_NAME:$ENVIRONMENT

# Déploiement selon l'environnement
case $ENVIRONMENT in
  "dev")
    echo "Deploying to development environment..."
    docker-compose -f deployment/docker/docker-compose.yml up -d
    ;;
  "test")
    echo "Deploying to test environment..."
    kubectl apply -f deployment/kubernetes/
    ;;
  "prod")
    echo "Deploying to production environment..."
    kubectl apply -f deployment/kubernetes/
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "Deployment completed!"
`
  );

  // Rendre le script exécutable
  require('child_process').execSync(`chmod +x ${join(scriptsPath, 'deploy.sh')}`);
} 