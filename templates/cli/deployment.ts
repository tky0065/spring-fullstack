import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupDeployment(projectPath: string, config: ProjectConfig) {
  await setupEnvironments(projectPath, config);
  await setupDeploymentScripts(projectPath, config);
  await setupCI(projectPath, config);
}

async function setupEnvironments(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  
  // Create development environment
  const devConfig = `
spring:
  profiles:
    active: dev
  datasource:
    url: ${getDatabaseUrl(config, 'dev')}
    username: ${getDefaultUsername(config)}
    password: ${getDefaultPassword(config)}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  logging:
    level:
      root: INFO
      com.${config.projectName.toLowerCase()}: DEBUG
`;

  await fs.writeFile(
    path.join(resourcesPath, 'application-dev.yml'),
    devConfig
  );
  
  // Create test environment
  const testConfig = `
spring:
  profiles:
    active: test
  datasource:
    url: ${getDatabaseUrl(config, 'test')}
    username: ${getDefaultUsername(config)}
    password: ${getDefaultPassword(config)}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  logging:
    level:
      root: WARN
      com.${config.projectName.toLowerCase()}: INFO
`;

  await fs.writeFile(
    path.join(resourcesPath, 'application-test.yml'),
    testConfig
  );
  
  // Create production environment
  const prodConfig = `
spring:
  profiles:
    active: prod
  datasource:
    url: ${getDatabaseUrl(config, 'prod')}
    username: ${getDefaultUsername(config)}
    password: ${getDefaultPassword(config)}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  logging:
    level:
      root: WARN
      com.${config.projectName.toLowerCase()}: INFO
`;

  await fs.writeFile(
    path.join(resourcesPath, 'application-prod.yml'),
    prodConfig
  );
}

async function setupDeploymentScripts(projectPath: string, config: ProjectConfig) {
  const scriptsPath = path.join(projectPath, 'scripts');
  await fs.ensureDir(scriptsPath);
  
  // Create deployment script
  const deployScript = `
#!/bin/bash

# Load environment variables
source .env

# Build and deploy backend
cd backend
mvn clean package -DskipTests
docker build -t ${config.projectName.toLowerCase()}-backend:latest .
docker push ${config.projectName.toLowerCase()}-backend:latest

# Build and deploy frontend
cd ../frontend
npm install
npm run build
docker build -t ${config.projectName.toLowerCase()}-frontend:latest .
docker push ${config.projectName.toLowerCase()}-frontend:latest

# Deploy to Kubernetes
cd ..
kubectl apply -f k8s/
`;

  await fs.writeFile(
    path.join(scriptsPath, 'deploy.sh'),
    deployScript
  );
  
  // Create Kubernetes configurations
  await setupKubernetes(projectPath, config);
}

async function setupKubernetes(projectPath: string, config: ProjectConfig) {
  const k8sPath = path.join(projectPath, 'k8s');
  await fs.ensureDir(k8sPath);
  
  // Create deployment configurations
  const backendDeployment = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${config.projectName.toLowerCase()}-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${config.projectName.toLowerCase()}-backend
  template:
    metadata:
      labels:
        app: ${config.projectName.toLowerCase()}-backend
    spec:
      containers:
      - name: backend
        image: ${config.projectName.toLowerCase()}-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
`;

  await fs.writeFile(
    path.join(k8sPath, 'backend-deployment.yaml'),
    backendDeployment
  );
  
  const frontendDeployment = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${config.projectName.toLowerCase()}-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${config.projectName.toLowerCase()}-frontend
  template:
    metadata:
      labels:
        app: ${config.projectName.toLowerCase()}-frontend
    spec:
      containers:
      - name: frontend
        image: ${config.projectName.toLowerCase()}-frontend:latest
        ports:
        - containerPort: 80
`;

  await fs.writeFile(
    path.join(k8sPath, 'frontend-deployment.yaml'),
    frontendDeployment
  );
  
  // Create service configurations
  const backendService = `
apiVersion: v1
kind: Service
metadata:
  name: ${config.projectName.toLowerCase()}-backend
spec:
  selector:
    app: ${config.projectName.toLowerCase()}-backend
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
`;

  await fs.writeFile(
    path.join(k8sPath, 'backend-service.yaml'),
    backendService
  );
  
  const frontendService = `
apiVersion: v1
kind: Service
metadata:
  name: ${config.projectName.toLowerCase()}-frontend
spec:
  selector:
    app: ${config.projectName.toLowerCase()}-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
`;

  await fs.writeFile(
    path.join(k8sPath, 'frontend-service.yaml'),
    frontendService
  );
}

async function setupCI(projectPath: string, config: ProjectConfig) {
  const ciPath = path.join(projectPath, '.github', 'workflows');
  await fs.ensureDir(ciPath);
  
  // Create GitHub Actions workflow
  const workflow = `
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up JDK 17
      uses: actions/setup-java@v2
      with:
        java-version: '17'
        distribution: 'temurin'
        
    - name: Build and test backend
      run: |
        cd backend
        mvn clean package
        
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Build and test frontend
      run: |
        cd frontend
        npm install
        npm run build
        npm test
        
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to production
      run: |
        ./scripts/deploy.sh
`;

  await fs.writeFile(
    path.join(ciPath, 'ci-cd.yml'),
    workflow
  );
}

function getDatabaseUrl(config: ProjectConfig, environment: string): string {
  const dbName = `${config.projectName.toLowerCase()}_${environment}`;
  switch (config.database.type) {
    case 'PostgreSQL':
      return `jdbc:postgresql://localhost:5432/${dbName}`;
    case 'MySQL':
      return `jdbc:mysql://localhost:3306/${dbName}`;
    case 'MongoDB':
      return `mongodb://localhost:27017/${dbName}`;
    default:
      return '';
  }
}

function getDefaultUsername(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'PostgreSQL':
    case 'MySQL':
      return 'root';
    case 'MongoDB':
      return '';
    default:
      return '';
  }
}

function getDefaultPassword(config: ProjectConfig): string {
  switch (config.database.type) {
    case 'PostgreSQL':
    case 'MySQL':
      return 'root';
    case 'MongoDB':
      return '';
    default:
      return '';
  }
} 