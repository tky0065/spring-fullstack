import { ProjectConfig } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupTesting(config: ProjectConfig): Promise<void> {
  const backendPath = path.join(config.projectPath, 'backend');
  const frontendPath = path.join(config.projectPath, 'frontend');

  // Setup backend testing
  if (await fs.pathExists(backendPath)) {
    await setupBackendTesting(backendPath, config);
  }

  // Setup frontend testing
  if (await fs.pathExists(frontendPath)) {
    await setupFrontendTesting(frontendPath, config);
  }
}

async function setupBackendTesting(backendPath: string, config: ProjectConfig): Promise<void> {
  const testPath = path.join(backendPath, 'src/test/java/com/example/app');
  await fs.ensureDir(testPath);

  // Add testing dependencies to pom.xml
  const pomPath = path.join(backendPath, 'pom.xml');
  if (await fs.pathExists(pomPath)) {
    const pomContent = await fs.readFile(pomPath, 'utf-8');
    const testingDependencies = `
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
        <groupId>org.mockito</groupId>
        <artifactId>mockito-core</artifactId>
        <scope>test</scope>
      </dependency>`;

    if (!pomContent.includes('<artifactId>spring-boot-starter-test</artifactId>')) {
      const updatedPom = pomContent.replace(
        '</dependencies>',
        `${testingDependencies}\n    </dependencies>`
      );
      await fs.writeFile(pomPath, updatedPom);
    }
  }

  // Create a sample test file
  const sampleTestContent = `
package com.example.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApplicationTests {

    @Test
    void contextLoads() {
    }
}
`;
  await fs.writeFile(path.join(testPath, 'ApplicationTests.java'), sampleTestContent);
}

async function setupFrontendTesting(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJsonPath = path.join(frontendPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);

    // Add testing dependencies
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      jest: '^29.0.0',
      '@testing-library/react': '^13.4.0',
      '@testing-library/jest-dom': '^5.16.5',
      '@testing-library/vue': '^6.0.0',
      '@testing-library/angular': '^12.0.0',
      'ts-jest': '^29.0.0'
    };

    packageJson.scripts = {
      ...packageJson.scripts,
      test: 'jest'
    };

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Create a sample test file
  const testPath = path.join(frontendPath, 'src');
  await fs.ensureDir(testPath);

  const sampleTestContent = `
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const linkElement = screen.getByText(/Welcome to ${config.projectName}/i);
  expect(linkElement).toBeInTheDocument();
});
`;

  await fs.writeFile(path.join(testPath, 'App.test.js'), sampleTestContent);
}
