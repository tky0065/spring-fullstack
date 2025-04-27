import { ProjectConfig } from './config.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupFrontend(projectPath: string, config: ProjectConfig) {
  const frontendPath = path.join(projectPath, 'frontend');
  
  switch (config.frontend.framework) {
    case 'React':
      await setupReactFrontend(frontendPath, config);
      break;
    case 'Vue.js':
      await setupVueFrontend(frontendPath, config);
      break;
    case 'Angular':
      await setupAngularFrontend(frontendPath, config);
      break;
    case 'JavaTemplate':
      await setupJavaTemplateFrontend(projectPath, config);
      break;
    default:
      break;
  }
}

async function setupReactFrontend(frontendPath: string, config: ProjectConfig) {
  // Create React project structure
  await fs.ensureDir(frontendPath);
  
  // Create package.json
  const packageJson = {
    name: `${config.projectName}-frontend`,
    version: '0.1.0',
    private: true,
    dependencies: {
      '@testing-library/jest-dom': '^5.16.5',
      '@testing-library/react': '^13.4.0',
      '@testing-library/user-event': '^13.5.0',
      'axios': '^1.4.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.11.1',
      'web-vitals': '^2.1.4',
      'tailwindcss': '^3.3.3',
      'daisyui': '^3.7.3'
    },
    devDependencies: {
      '@types/node': '^20.5.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@typescript-eslint/eslint-plugin': '^6.7.0',
      '@typescript-eslint/parser': '^6.7.0',
      'autoprefixer': '^10.4.14',
      'eslint': '^8.49.0',
      'postcss': '^8.4.27',
      'typescript': '~5.2.2',
      'vite': '^4.4.9'
    },
    scripts: {
      'start': 'vite',
      'build': 'tsc && vite build',
      'test': 'jest',
      'eject': 'react-scripts eject'
    }
  };
  
  await fs.writeFile(
    path.join(frontendPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }]
  };
  
  await fs.writeFile(
    path.join(frontendPath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );
  
  // Create vite.config.ts
  const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
`;
  
  await fs.writeFile(
    path.join(frontendPath, 'vite.config.ts'),
    viteConfig
  );
  
  // Create src directory and files
  const srcPath = path.join(frontendPath, 'src');
  await fs.ensureDir(srcPath);
  
  // Create App.tsx
  const appContent = `
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          ${config.authentication.enabled ? `
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          ` : ''}
        </Routes>
      </div>
    </Router>
  );
};

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to ${config.projectName}</h1>
      <p className="text-gray-600">This is your new React application.</p>
    </div>
  );
};

${config.authentication.enabled ? `
const Login: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {/* Add login form here */}
    </div>
  );
};

const Register: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      {/* Add registration form here */}
    </div>
  );
};
` : ''}

export default App;
`;
  
  await fs.writeFile(
    path.join(srcPath, 'App.tsx'),
    appContent
  );
  
  // Create index.css
  const indexCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles can be added below */
`;
  
  await fs.writeFile(
    path.join(srcPath, 'index.css'),
    indexCss
  );
  
  // Create main.tsx
  const mainTsx = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  
  await fs.writeFile(
    path.join(srcPath, 'main.tsx'),
    mainTsx
  );
}

async function setupVueFrontend(frontendPath: string, config: ProjectConfig) {
  // Similar structure to React but with Vue.js specific files
  // Implementation details for Vue.js setup
}

async function setupAngularFrontend(frontendPath: string, config: ProjectConfig) {
  // Similar structure to React but with Angular specific files
  // Implementation details for Angular setup
}

async function setupJavaTemplateFrontend(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  const templatesPath = path.join(resourcesPath, 'templates');
  
  await fs.ensureDir(templatesPath);
  
  // Create base template
  const baseTemplate = `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>${config.projectName}</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Welcome to ${config.projectName}</h1>
        </header>
        <main>
            <div th:replace="\${template} :: content"></div>
        </main>
        <footer>
            <p>&copy; 2024 ${config.projectName}</p>
        </footer>
    </div>
</body>
</html>
`;
  
  await fs.writeFile(
    path.join(templatesPath, 'base.html'),
    baseTemplate
  );
  
  // Create home template
  const homeTemplate = `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" th:replace="base :: layout(~{::content})">
<head>
    <title>Home</title>
</head>
<body>
    <div th:fragment="content">
        <h2>Home Page</h2>
        <p>Welcome to your new application!</p>
    </div>
</body>
</html>
`;
  
  await fs.writeFile(
    path.join(templatesPath, 'home.html'),
    homeTemplate
  );
} 