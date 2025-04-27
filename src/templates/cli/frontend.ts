import { ProjectConfig } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupFrontend(config: ProjectConfig): Promise<void> {
  const frontendPath = path.join(config.projectPath, 'frontend');
  await fs.ensureDir(frontendPath);

  switch (config.frontend.framework) {
    case 'React':
      await setupReact(frontendPath, config);
      break;
    case 'Vue.js':
      await setupVue(frontendPath, config);
      break;
    case 'Angular':
      await setupAngular(frontendPath, config);
      break;
    case 'None':
      console.log('No frontend framework selected.');
      break;
    default:
      throw new Error(`Unsupported frontend framework: ${config.frontend.framework}`);
  }
}

async function setupReact(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: config.projectName.toLowerCase(),
    version: '1.0.0',
    private: true,
    scripts: {
      start: 'react-scripts start',
      build: 'react-scripts build',
      test: 'react-scripts test',
      eject: 'react-scripts eject'
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.11.2'
    },
    devDependencies: {
      typescript: '^5.0.4',
      '@types/react': '^18.0.28',
      '@types/react-dom': '^18.0.11',
      '@types/react-router-dom': '^5.3.3'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  const srcPath = path.join(frontendPath, 'src');
  await fs.ensureDir(srcPath);

  const appJsContent = `
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<h1>Welcome to ${config.projectName}</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
`;

  await fs.writeFile(path.join(srcPath, 'App.js'), appJsContent);
}

async function setupVue(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: config.projectName.toLowerCase(),
    version: '1.0.0',
    private: true,
    scripts: {
      serve: 'vue-cli-service serve',
      build: 'vue-cli-service build',
      lint: 'vue-cli-service lint'
    },
    dependencies: {
      vue: '^3.3.4',
      'vue-router': '^4.2.2'
    },
    devDependencies: {
      '@vue/cli-service': '^5.0.8',
      '@vue/compiler-sfc': '^3.3.4'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  const srcPath = path.join(frontendPath, 'src');
  await fs.ensureDir(srcPath);

  const appVueContent = `
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>
`;

  await fs.writeFile(path.join(srcPath, 'App.vue'), appVueContent);
}

async function setupAngular(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: config.projectName.toLowerCase(),
    version: '1.0.0',
    private: true,
    scripts: {
      start: 'ng serve',
      build: 'ng build',
      test: 'ng test',
      lint: 'ng lint',
      e2e: 'ng e2e'
    },
    dependencies: {
      '@angular/core': '^16.0.0',
      '@angular/common': '^16.0.0',
      '@angular/router': '^16.0.0',
      rxjs: '^7.8.1',
      'zone.js': '^0.13.0'
    },
    devDependencies: {
      '@angular/cli': '^16.0.0',
      '@angular/compiler-cli': '^16.0.0',
      typescript: '^5.0.4'
    }
  };

  await fs.writeJson(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  const srcPath = path.join(frontendPath, 'src');
  await fs.ensureDir(srcPath);

  const appComponentHtml = `
<h1>Welcome to ${config.projectName}</h1>
`;

  await fs.writeFile(path.join(srcPath, 'app.component.html'), appComponentHtml);
}
