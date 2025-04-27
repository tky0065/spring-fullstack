import { ProjectConfig } from '../../src/types.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupAuthentication(projectPath: string, config: ProjectConfig): Promise<void> {
  const authPath = path.join(projectPath, 'backend', 'src', 'main', 'java', 'com', 'example', 'auth');

  // Create authentication directory
  await fs.mkdirp(authPath);

  // Generate authentication files based on the configuration
  if (config.authentication) {
    const authType = config.authentication ? 'JWT' : 'None'; // Utilisation de config.authentication
    const authFileContent = `
      package com.example.auth;

      public class AuthConfig {
          public static final String AUTH_TYPE = "${authType}";
      }
    `;

    await fs.writeFile(path.join(authPath, 'AuthConfig.java'), authFileContent);
  }
}

