import { ProjectConfig } from '../../src/types/config';
import fs from 'fs-extra';
import path from 'path';

export function setupTesting(projectPath: string): void {
  setupTestConfig(projectPath);
  setupTestUtils(projectPath);
  setupTestTemplates(projectPath);
  setupTestReports(projectPath);
}

function setupTestConfig(projectPath: string): void {
  // Configuration code here
}

function setupTestUtils(projectPath: string): void {
  // Utils code here
}

function setupTestTemplates(projectPath: string): void {
  // Templates code here
}

function setupTestReports(projectPath: string): void {
  // Reports code here
}

async function setupE2ETests(projectPath: string, config: ProjectConfig) {
  if (config.frontend.type === 'react') {
    await setupCypressTests(projectPath, config);
  }
}

async function setupCypressTests(projectPath: string, config: ProjectConfig) {
  const frontendPath = path.join(projectPath, 'frontend');
  const cypressPath = path.join(frontendPath, 'cypress');
  
  await fs.ensureDir(cypressPath);
  
  // Create Cypress configuration
  const cypressConfig = `
{
  "baseUrl": "http://localhost:3000",
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "testFiles": "**/*.test.{js,jsx,ts,tsx}",
  "componentFolder": "src",
  "fixturesFolder": "cypress/fixtures",
  "integrationFolder": "cypress/integration",
  "pluginsFile": "cypress/plugins/index.js",
  "supportFile": "cypress/support/index.js",
  "video": false
}
`;

  await fs.writeFile(
    path.join(frontendPath, 'cypress.json'),
    cypressConfig
  );
  
  // Create example E2E test
  const e2eTest = `
describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('displays welcome message', () => {
    cy.contains('Welcome to ${config.projectName}');
  });
  
  ${config.authentication.type === 'jwt' ? `
  it('can navigate to login page', () => {
    cy.contains('Login').click();
    cy.url().should('include', '/login');
  });
  ` : ''}
});
`;

  await fs.writeFile(
    path.join(cypressPath, 'integration', 'home.test.ts'),
    e2eTest
  );
}

export async function setupAdvancedTesting(projectPath: string): Promise<void> {
  const testPath = path.join(projectPath, 'backend/src/test/java/com/example');
  await fs.mkdirp(testPath);

  // Configuration des tests
  const testConfig = {
    'application-test.yml': `
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password: 
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
  test:
    database:
      replace: none
`,
    'AbstractIntegrationTest.java': `
package com.example;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {
    
    @Autowired
    protected WebApplicationContext webApplicationContext;
    
    protected MockMvc mockMvc;
    
    @BeforeEach
    void setup() {
        this.mockMvc = MockMvcBuilders
            .webAppContextSetup(this.webApplicationContext)
            .build();
    }
}`,
    'SecurityTestUtils.java': `
package com.example;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.test.util.ReflectionTestUtils;

public class SecurityTestUtils {
    
    public static void mockAuthentication(Authentication authentication) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
    }
    
    public static void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
}`,
    'TestContainersConfig.java': `
package com.example;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

public class TestContainersConfig {
    
    @Container
    public static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:13")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void postgresqlProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
    }
}`
  };

  // Créer les fichiers de test
  for (const [filename, content] of Object.entries(testConfig)) {
    await fs.writeFile(path.join(testPath, filename), content);
  }

  // Ajouter les dépendances de test
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');

  const testDependencies = `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers</artifactId>
            <version>1.17.6</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>1.17.6</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <version>1.17.6</version>
            <scope>test</scope>
        </dependency>`;

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${testDependencies}
    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);
} 