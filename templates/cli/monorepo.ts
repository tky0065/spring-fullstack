import { ProjectConfig } from '../../src/types.js'; // Correction du chemin d'importation
import fs from 'fs-extra';
import path from 'path';

export async function setupMonorepo(projectPath: string, config: ProjectConfig) {
  await setupMonorepoStructure(projectPath, config);
  await setupSharedLibraries(projectPath, config);
  await setupWorkspaceConfig(projectPath, config);
}

async function setupMonorepoStructure(projectPath: string, config: ProjectConfig) {
  // Create monorepo structure
  const structure = {
    'package.json': `
{
  "name": "${config.projectName.toLowerCase()}-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "lerna run build",
    "test": "lerna run test",
    "lint": "lerna run lint",
    "clean": "lerna run clean",
    "bootstrap": "lerna bootstrap"
  },
  "devDependencies": {
    "lerna": "^6.0.0",
    "typescript": "^4.9.0",
    "@types/node": "^18.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.0.0"
  }
}
`,
    'lerna.json': `
{
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "packages": [
    "packages/*",
    "apps/*"
  ]
}
`,
    'tsconfig.json': `
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@${config.projectName.toLowerCase()}/common": ["packages/common/src"],
      "@${config.projectName.toLowerCase()}/ui": ["packages/ui/src"],
      "@${config.projectName.toLowerCase()}/api": ["packages/api/src"]
    }
  },
  "include": ["packages/**/*", "apps/**/*"],
  "exclude": ["node_modules", "dist"]
}
`
  };

  for (const [filename, content] of Object.entries(structure)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }

  // Create directory structure
  await fs.mkdirp(path.join(projectPath, 'packages'));
  await fs.mkdirp(path.join(projectPath, 'apps'));
}

async function setupSharedLibraries(projectPath: string, config: ProjectConfig) {
  // Create common package
  const commonPackage = {
    'package.json': `
{
  "name": "@${config.projectName.toLowerCase()}/common",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "class-validator": "^0.13.0",
    "class-transformer": "^0.5.0"
  }
}
`,
    'src/index.ts': `
export * from './types';
export * from './utils';
export * from './constants';
`
  };

  const commonPath = path.join(projectPath, 'packages', 'common');
  await fs.mkdirp(commonPath);

  for (const [filename, content] of Object.entries(commonPackage)) {
    await fs.writeFile(
      path.join(commonPath, filename),
      content
    );
  }

  // Create UI package
  const uiPackage = {
    'package.json': `
{
  "name": "@${config.projectName.toLowerCase()}/ui",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@${config.projectName.toLowerCase()}/common": "^1.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
`,
    'src/index.ts': `
export * from './components';
export * from './hooks';
export * from './styles';
`
  };

  const uiPath = path.join(projectPath, 'packages', 'ui');
  await fs.mkdirp(uiPath);

  for (const [filename, content] of Object.entries(uiPackage)) {
    await fs.writeFile(
      path.join(uiPath, filename),
      content
    );
  }

  // Create API package
  const apiPackage = {
    'package.json': `
{
  "name": "@${config.projectName.toLowerCase()}/api",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@${config.projectName.toLowerCase()}/common": "^1.0.0",
    "axios": "^1.0.0"
  }
}
`,
    'src/index.ts': `
export * from './client';
export * from './types';
export * from './utils';
`
  };

  const apiPath = path.join(projectPath, 'packages', 'api');
  await fs.mkdirp(apiPath);

  for (const [filename, content] of Object.entries(apiPackage)) {
    await fs.writeFile(
      path.join(apiPath, filename),
      content
    );
  }
}

async function setupWorkspaceConfig(projectPath: string, config: ProjectConfig) {
  // Create workspace configuration
  const workspaceConfig = {
    '.eslintrc.js': `
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
};
`,
    '.prettierrc': `
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
`,
    'jest.config.js': `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
`
  };

  for (const [filename, content] of Object.entries(workspaceConfig)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
} 
