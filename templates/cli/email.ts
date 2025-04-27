import { ProjectConfig } from '../../src/types.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupEmail(
  config: ProjectConfig,
  projectPath: string,
  username: string,
  resetPasswordUrl: string,
  verifyEmailUrl: string
): Promise<void> {
  const emailPath = path.join(projectPath, 'backend', 'src', 'main', 'java', 'com', 'example', 'email');

  // Create email directory
  await fs.mkdirp(emailPath);

  // Generate email configuration file
  const emailConfigContent = `
    package com.example.email;

    public class EmailConfig {
        public static final String USERNAME = "${username}";
        public static final String RESET_PASSWORD_URL = "${resetPasswordUrl}";
        public static final String VERIFY_EMAIL_URL = "${verifyEmailUrl}";
    }
  `;

  await fs.writeFile(path.join(emailPath, 'EmailConfig.java'), emailConfigContent);
}
