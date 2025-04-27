import * as path from 'path';
import * as fs from 'fs-extra';
import type { ProjectOptions } from '../types';

export async function generateTemplate(options: ProjectOptions, type: string): Promise<void> {
  const targetPath = path.join(process.cwd(), options.projectName, type);
  await fs.ensureDir(targetPath);
  
  // Génération des fichiers selon le type
  switch (type) {
    case 'backend':
      await generateBackend(targetPath, options);
      break;
    case 'frontend':
      await generateFrontend(targetPath, options);
      break;
    default:
      throw new Error(`Type de template inconnu: ${type}`);
  }
}

async function generateBackend(targetPath: string, options: ProjectOptions): Promise<void> {
  // Copier les templates de base
  await fs.copy(path.join(__dirname, '../../templates/backend'), targetPath);

  // Générer le pom.xml
  const pomTemplate = await fs.readFile(path.join(__dirname, '../../templates/backend/pom.xml.template'), 'utf-8');
  const pomContent = pomTemplate
    .replace('{{projectName}}', options.projectName)
    .replace('{{database}}', options.database);
  await fs.writeFile(path.join(targetPath, 'pom.xml'), pomContent);

  // Générer la configuration application.yml
  const appConfigTemplate = await fs.readFile(path.join(__dirname, '../../templates/backend/src/main/resources/application.yml.template'), 'utf-8');
  const appConfigContent = appConfigTemplate
    .replace('{{database}}', options.database)
    .replace('{{projectName}}', options.projectName);
  await fs.writeFile(path.join(targetPath, 'src/main/resources/application.yml'), appConfigContent);
}

async function generateFrontend(targetPath: string, options: ProjectOptions): Promise<void> {
  if (options.frontend === 'None') return;

  // Copier les templates spécifiques au framework
  const templatePath = path.join(__dirname, `../../templates/frontend/${options.frontend.toLowerCase()}`);
  await fs.copy(templatePath, targetPath);

  // Générer package.json
  const packageTemplate = await fs.readFile(path.join(templatePath, 'package.json.template'), 'utf-8');
  const packageContent = packageTemplate
    .replace('{{projectName}}', options.projectName)
    .replace('{{version}}', '1.0.0');
  await fs.writeFile(path.join(targetPath, 'package.json'), packageContent);

  // Générer la configuration selon le framework
  switch (options.frontend) {
    case 'React':
      await generateReactConfig(targetPath, options);
      break;
    case 'Vue.js':
      await generateVueConfig(targetPath, options);
      break;
    case 'Angular':
      await generateAngularConfig(targetPath, options);
      break;
  }
}

async function generateReactConfig(targetPath: string, options: ProjectOptions): Promise<void> {
  // Configuration spécifique à React
  const configTemplate = await fs.readFile(path.join(__dirname, '../../templates/frontend/react/config/config.js.template'), 'utf-8');
  const configContent = configTemplate
    .replace('{{projectName}}', options.projectName)
    .replace('{{apiUrl}}', 'http://localhost:8080');
  await fs.writeFile(path.join(targetPath, 'src/config/config.js'), configContent);
}

async function generateVueConfig(targetPath: string, options: ProjectOptions): Promise<void> {
  // Configuration spécifique à Vue
  const configTemplate = await fs.readFile(path.join(__dirname, '../../templates/frontend/vue/vue.config.js.template'), 'utf-8');
  const configContent = configTemplate
    .replace('{{projectName}}', options.projectName)
    .replace('{{apiUrl}}', 'http://localhost:8080');
  await fs.writeFile(path.join(targetPath, 'vue.config.js'), configContent);
}

async function generateAngularConfig(targetPath: string, options: ProjectOptions): Promise<void> {
  // Configuration spécifique à Angular
  const configTemplate = await fs.readFile(path.join(__dirname, '../../templates/frontend/angular/environment.ts.template'), 'utf-8');
  const configContent = configTemplate
    .replace('{{projectName}}', options.projectName)
    .replace('{{apiUrl}}', 'http://localhost:8080');
  await fs.writeFile(path.join(targetPath, 'src/environments/environment.ts'), configContent);
}
