import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import type { ProjectOptions } from '../types';

export class TemplateManager {
  private readonly templatesDir: string;

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }

  async processTemplate(templatePath: string, targetPath: string, options: ProjectOptions): Promise<void> {
    const template = await fs.readFile(templatePath, 'utf-8');
    const compiled = Handlebars.compile(template);
    const processed = compiled(options);
    await fs.writeFile(targetPath, processed);
  }

  async copyTemplate(type: 'backend' | 'frontend', options: ProjectOptions): Promise<void> {
    const sourcePath = path.join(this.templatesDir, type);
    const targetPath = path.join(process.cwd(), options.name, type);
    await fs.copy(sourcePath, targetPath);
  }
}
