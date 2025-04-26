import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupMultiModule(projectPath: string, config: ProjectConfig) {
  await setupParentPom(projectPath, config);
  await setupApiModule(projectPath, config);
  await setupCoreModule(projectPath, config);
  await setupAdminModule(projectPath, config);
  await setupBatchModule(projectPath, config);
}

async function setupParentPom(projectPath: string, config: ProjectConfig) {
  const parentPom = `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.${config.projectName.toLowerCase()}</groupId>
    <artifactId>${config.projectName.toLowerCase()}-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <modules>
        <module>core</module>
        <module>api</module>
        <module>admin</module>
        <module>batch</module>
    </modules>

    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <spring-boot.version>3.2.0</spring-boot.version>
        <spring-cloud.version>2023.0.0</spring-cloud.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>\${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>\${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>\${spring-boot.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
`;

  await fs.writeFile(
    path.join(projectPath, 'pom.xml'),
    parentPom
  );
}

async function setupApiModule(projectPath: string, config: ProjectConfig) {
  const apiPath = path.join(projectPath, 'api');
  
  // Create API module pom.xml
  const apiPom = `
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

    <artifactId>${config.projectName.toLowerCase()}-api</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.${config.projectName.toLowerCase()}</groupId>
            <artifactId>${config.projectName.toLowerCase()}-core</artifactId>
            <version>\${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`;

  await fs.writeFile(
    path.join(apiPath, 'pom.xml'),
    apiPom
  );
  
  // Create API module main class
  const apiMainClass = `
package com.${config.projectName.toLowerCase()}.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.${config.projectName.toLowerCase()}.api",
    "com.${config.projectName.toLowerCase()}.core"
})
public class ApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }
}
`;

  await fs.writeFile(
    path.join(apiPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'api', 'ApiApplication.java'),
    apiMainClass
  );
}

async function setupCoreModule(projectPath: string, config: ProjectConfig) {
  const corePath = path.join(projectPath, 'core');
  
  // Create Core module pom.xml
  const corePom = `
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

    <artifactId>${config.projectName.toLowerCase()}-core</artifactId>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
`;

  await fs.writeFile(
    path.join(corePath, 'pom.xml'),
    corePom
  );
}

async function setupAdminModule(projectPath: string, config: ProjectConfig) {
  const adminPath = path.join(projectPath, 'admin');
  
  // Create Admin module pom.xml
  const adminPom = `
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

    <artifactId>${config.projectName.toLowerCase()}-admin</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.${config.projectName.toLowerCase()}</groupId>
            <artifactId>${config.projectName.toLowerCase()}-core</artifactId>
            <version>\${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`;

  await fs.writeFile(
    path.join(adminPath, 'pom.xml'),
    adminPom
  );
  
  // Create Admin module main class
  const adminMainClass = `
package com.${config.projectName.toLowerCase()}.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.${config.projectName.toLowerCase()}.admin",
    "com.${config.projectName.toLowerCase()}.core"
})
public class AdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdminApplication.class, args);
    }
}
`;

  await fs.writeFile(
    path.join(adminPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'admin', 'AdminApplication.java'),
    adminMainClass
  );
}

async function setupBatchModule(projectPath: string, config: ProjectConfig) {
  const batchPath = path.join(projectPath, 'batch');
  
  // Create Batch module pom.xml
  const batchPom = `
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

    <artifactId>${config.projectName.toLowerCase()}-batch</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.${config.projectName.toLowerCase()}</groupId>
            <artifactId>${config.projectName.toLowerCase()}-core</artifactId>
            <version>\${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-batch</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-quartz</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`;

  await fs.writeFile(
    path.join(batchPath, 'pom.xml'),
    batchPom
  );
  
  // Create Batch module main class
  const batchMainClass = `
package com.${config.projectName.toLowerCase()}.batch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.${config.projectName.toLowerCase()}.batch",
    "com.${config.projectName.toLowerCase()}.core"
})
public class BatchApplication {
    public static void main(String[] args) {
        SpringApplication.run(BatchApplication.class, args);
    }
}
`;

  await fs.writeFile(
    path.join(batchPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'batch', 'BatchApplication.java'),
    batchMainClass
  );
} 