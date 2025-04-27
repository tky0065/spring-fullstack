import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupTesting(projectPath: string, config: ProjectConfig) {
  await setupTestConfig(projectPath, config);
  await setupTestUtils(projectPath, config);
  await setupTestTemplates(projectPath, config);
  await setupTestReports(projectPath, config);
}

async function setupTestConfig(projectPath: string, config: ProjectConfig) {
  // Create test configuration
  const testConfig = {
    'pom.xml': `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.${config.projectName.toLowerCase()}</groupId>
        <artifactId>${config.projectName.toLowerCase()}-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>${config.projectName.toLowerCase()}-test</artifactId>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-api</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-engine</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.mockito</groupId>
            <artifactId>mockito-core</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.mockito</groupId>
            <artifactId>mockito-junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>${config.database.type.toLowerCase()}</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <includes>
                        <include>**/*Test.java</include>
                        <include>**/*Tests.java</include>
                    </includes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.8</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-agent</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>test</phase>
                        <goals>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
`,
    'application-test.yml': `
spring:
  datasource:
    url: jdbc:tc:${config.database.type.toLowerCase()}:latest:///testdb
    username: test
    password: test
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  test:
    database:
      replace: none

logging:
  level:
    root: INFO
    com.${config.projectName.toLowerCase()}: DEBUG
    org.springframework: WARN
`
  };

  const testPath = path.join(projectPath, 'test');
  await fs.mkdirp(testPath);

  for (const [filename, content] of Object.entries(testConfig)) {
    await fs.writeFile(
      path.join(testPath, filename),
      content
    );
  }
}

async function setupTestUtils(projectPath: string, config: ProjectConfig) {
  // Create test utilities
  const testUtils = `
package com.${config.projectName.toLowerCase()}.test.util;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.${config.database.type}Container;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
public abstract class AbstractIntegrationTest {
    @Container
    protected static final ${config.database.type}Container database = new ${config.database.type}Container("${config.database.type.toLowerCase()}:latest")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", database::getJdbcUrl);
        registry.add("spring.datasource.username", database::getUsername);
        registry.add("spring.datasource.password", database::getPassword);
    }
}
`;

  const mockUtils = `
package com.${config.projectName.toLowerCase()}.test.util;

import org.mockito.Mockito;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

public class SecurityTestUtils {
    public static void mockSecurityContext(String username, String... roles) {
        UserDetails userDetails = User.builder()
                .username(username)
                .password("password")
                .roles(roles)
                .build();

        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Mockito.when(securityContext.getAuthentication()).thenReturn(authentication);

        SecurityContextHolder.setContext(securityContext);
    }

    public static void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
}
`;

  await fs.writeFile(
    path.join(projectPath, 'test', 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'test', 'util', 'AbstractIntegrationTest.java'),
    testUtils
  );

  await fs.writeFile(
    path.join(projectPath, 'test', 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'test', 'util', 'SecurityTestUtils.java'),
    mockUtils
  );
}

async function setupTestTemplates(projectPath: string, config: ProjectConfig) {
  // Create test templates
  const testTemplates = {
    'UnitTest.java': `
package com.${config.projectName.toLowerCase()}.test.template;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

public class UnitTestTemplate {
    @Mock
    private Dependency dependency;

    @InjectMocks
    private Service service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testMethod() {
        // Arrange
        when(dependency.someMethod()).thenReturn("expected");

        // Act
        String result = service.methodUnderTest();

        // Assert
        assertEquals("expected", result);
        verify(dependency, times(1)).someMethod();
    }
}
`,
    'IntegrationTest.java': `
package com.${config.projectName.toLowerCase()}.test.template;

import com.${config.projectName.toLowerCase()}.test.util.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class IntegrationTestTemplate extends AbstractIntegrationTest {
    @Autowired
    private Service service;

    @Test
    void testIntegration() {
        // Arrange
        String input = "test";

        // Act
        String result = service.methodUnderTest(input);

        // Assert
        assertNotNull(result);
        assertEquals("expected", result);
    }
}
`,
    'ControllerTest.java': `
package com.${config.projectName.toLowerCase()}.test.template;

import com.${config.projectName.toLowerCase()}.test.util.SecurityTestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ControllerTestTemplate {
    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityTestUtils.mockSecurityContext("testuser", "USER");
    }

    @Test
    void testEndpoint() throws Exception {
        mockMvc.perform(get("/api/endpoint"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.field").value("expected"));
    }
}
`
  };

  const templatesPath = path.join(projectPath, 'test', 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'test', 'template');
  await fs.mkdirp(templatesPath);

  for (const [filename, content] of Object.entries(testTemplates)) {
    await fs.writeFile(
      path.join(templatesPath, filename),
      content
    );
  }
}

async function setupTestReports(projectPath: string, config: ProjectConfig) {
  // Create test report configuration
  const reportConfig = `
<?xml version="1.0" encoding="UTF-8"?>
<project name="${config.projectName}">
    <target name="test-reports">
        <mkdir dir="target/test-reports"/>
        <junitreport todir="target/test-reports">
            <fileset dir="target/surefire-reports">
                <include name="**/*.xml"/>
            </fileset>
            <report format="frames" todir="target/test-reports/html"/>
        </junitreport>
    </target>
</project>
`;

  await fs.writeFile(
    path.join(projectPath, 'test', 'build.xml'),
    reportConfig
  );
}

async function setupE2ETests(projectPath: string, config: ProjectConfig) {
  if (config.frontend.framework === 'React') {
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
  
  ${config.authentication.enabled ? `
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
            <version>1.16.3</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <version>1.16.3</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>`;

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${testDependencies}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);
} 
} 