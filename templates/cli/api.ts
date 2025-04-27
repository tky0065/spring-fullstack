import { ProjectConfig } from '../../src/types.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupApi(config: ProjectConfig, projectPath: string): Promise<void> {
  const apiPath = path.join(projectPath, 'backend', 'src', 'main', 'java', 'com', 'example', 'api');

  // Create API directory
  await fs.mkdirp(apiPath);

  // Generate API files based on the configuration
  if (config.api) {
    const apiType = config.api.type === 'rest' ? 'REST' : 'GraphQL';
    const apiFileContent = `
      package com.example.api;

      public class ApiConfig {
          public static final String API_TYPE = "${apiType}";
      }
    `;

    await fs.writeFile(path.join(apiPath, 'ApiConfig.java'), apiFileContent);
  }
}
