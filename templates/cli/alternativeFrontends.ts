import { ProjectConfig } from './config.js';
import fs from 'fs-extra';
import path from 'path';

export async function setupAlternativeFrontends(projectPath: string, config: ProjectConfig) {
  await setupSvelteConfig(projectPath, config);
  await setupVueConfig(projectPath, config);
  await setupSharedFrontendConfig(projectPath, config);
  await setupFrontendTemplates(projectPath, config);
}

async function setupSvelteConfig(projectPath: string, config: ProjectConfig) {
  // Create Svelte configuration
  const svelteConfig = {
    'svelte.config.js': `
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false
    }),
    alias: {
      '@components': './src/components',
      '@lib': './src/lib',
      '@stores': './src/stores',
      '@utils': './src/utils'
    }
  },
  preprocess: vitePreprocess()
};

export default config;
`,
    'vite.config.js': `
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
`,
    'package.json': `
{
  "name": "${config.projectName.toLowerCase()}-svelte",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "dependencies": {
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^4.0.0",
    "svelte-navigator": "^3.0.0",
    "svelte-i18n": "^3.0.0",
    "svelte-query": "^1.0.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^2.0.0",
    "@tsconfig/svelte": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}
`
  };

  const sveltePath = path.join(projectPath, 'frontend', 'svelte');
  await fs.mkdirp(sveltePath);

  for (const [filename, content] of Object.entries(svelteConfig)) {
    await fs.writeFile(
      path.join(sveltePath, filename),
      content
    );
  }
}

async function setupVueConfig(projectPath: string, config: ProjectConfig) {
  // Create Vue configuration
  const vueConfig = {
    'vite.config.js': `
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
`,
    'package.json': `
{
  "name": "${config.projectName.toLowerCase()}-vue",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "vue-i18n": "^9.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}
`
  };

  const vuePath = path.join(projectPath, 'frontend', 'vue');
  await fs.mkdirp(vuePath);

  for (const [filename, content] of Object.entries(vueConfig)) {
    await fs.writeFile(
      path.join(vuePath, filename),
      content
    );
  }
}

async function setupSharedFrontendConfig(projectPath: string, config: ProjectConfig) {
  // Create shared frontend configuration
  const sharedConfig = {
    'tsconfig.json': `
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`,
    '.eslintrc.json': `
{
  "root": true,
  "env": {
    "browser": true,
    "es2020": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
`
  };

  const sharedPath = path.join(projectPath, 'frontend', 'shared');
  await fs.mkdirp(sharedPath);

  for (const [filename, content] of Object.entries(sharedConfig)) {
    await fs.writeFile(
      path.join(sharedPath, filename),
      content
    );
  }
}

async function setupFrontendTemplates(projectPath: string, config: ProjectConfig) {
  // Create frontend templates
  const templates = {
    'svelte': {
      'App.svelte': `
<script lang="ts">
  import { onMount } from 'svelte';
  import { Router, Route } from 'svelte-navigator';
  import { QueryClient, QueryClientProvider } from 'svelte-query';
  
  const queryClient = new QueryClient();
  
  onMount(() => {
    // Initialize app
  });
</script>

<QueryClientProvider client={queryClient}>
  <Router>
    <Route path="/" component={Home} />
    <Route path="/login" component={Login} />
    <Route path="/dashboard" component={Dashboard} />
  </Router>
</QueryClientProvider>
`,
      'Home.svelte': `
<script lang="ts">
  import { onMount } from 'svelte';
  
  let message = 'Welcome to ${config.projectName}';
</script>

<main>
  <h1>{message}</h1>
  <p>This is a Svelte frontend for ${config.projectName}</p>
</main>

<style>
  main {
    padding: 2rem;
    text-align: center;
  }
</style>
`
    },
    'vue': {
      'App.vue': `
<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // Initialize app
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
`,
      'Home.vue': `
<template>
  <div class="home">
    <h1>{{ message }}</h1>
    <p>This is a Vue frontend for ${config.projectName}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref('Welcome to ${config.projectName}');
</script>

<style scoped>
.home {
  padding: 2rem;
  text-align: center;
}
</style>
`
    }
  };

  for (const [framework, files] of Object.entries(templates)) {
    const frameworkPath = path.join(projectPath, 'frontend', framework, 'src');
    await fs.mkdirp(frameworkPath);

    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(
        path.join(frameworkPath, filename),
        content
      );
    }
  }
} 