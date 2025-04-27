import { ProjectConfig } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupAuthentication(config: ProjectConfig): Promise<void> {
  if (!config.authentication) {
    return;
  }

  const backendPath = path.join(config.projectPath, 'backend');
  const srcPath = path.join(backendPath, 'src/main/java/com/example/app');
  const resourcesPath = path.join(backendPath, 'src/main/resources');
  
  await fs.ensureDir(path.join(srcPath, 'config'));
  await fs.ensureDir(path.join(srcPath, 'security'));
  await fs.ensureDir(path.join(srcPath, 'model'));
  await fs.ensureDir(path.join(srcPath, 'repository'));
  await fs.ensureDir(path.join(srcPath, 'service'));

  // Add security dependencies to pom.xml
  const pomPath = path.join(backendPath, 'pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');
  
  const securityDependency = `
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt</artifactId>
      <version>0.9.1</version>
    </dependency>`;

  const updatedPom = pomContent.replace(
    '</dependencies>',
    `${securityDependency}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPom);

  // Create security configuration
  const securityConfig = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/java/com/example/project/config/SecurityConfig.java'), 'utf8');
  await fs.writeFile(path.join(srcPath, 'config', 'SecurityConfig.java'), securityConfig);

  // Create JWT service
  const jwtService = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/java/com/example/project/service/JwtService.java'), 'utf8');
  await fs.writeFile(path.join(srcPath, 'service', 'JwtService.java'), jwtService);

  // Create user model
  const userModel = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/java/com/example/project/model/User.java'), 'utf8');
  await fs.writeFile(path.join(srcPath, 'model', 'User.java'), userModel);

  // Create user repository
  const userRepository = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/java/com/example/project/repository/UserRepository.java'), 'utf8');
  await fs.writeFile(path.join(srcPath, 'repository', 'UserRepository.java'), userRepository);

  // Create user service
  const userService = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/java/com/example/project/service/UserService.java'), 'utf8');
  await fs.writeFile(path.join(srcPath, 'service', 'UserService.java'), userService);

  // Create authentication controller
  const authController = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/java/com/example/project/controller/AuthController.java'), 'utf8');
  await fs.writeFile(path.join(srcPath, 'controller', 'AuthController.java'), authController);
} 