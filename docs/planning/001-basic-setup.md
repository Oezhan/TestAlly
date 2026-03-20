# 001 — Basic Setup

## Context

This is the first step. No prior implementation exists. You are initializing the TestAlly monorepo from scratch.

## Dependencies

- None (first step)

## What You're Building

A TypeScript monorepo with separate `client/` and `server/` workspaces, shared tooling config (ESLint, Prettier, TypeScript), and npm scripts for development.

---

## Steps

### 1. Initialize the root package.json

Create the root `package.json` as a workspace root:

```bash
npm init -y
```

Edit `package.json`:

```json
{
  "name": "testally",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "build": "npm run build:client && npm run build:server",
    "build:client": "npm run build --workspace=client",
    "build:server": "npm run build --workspace=server",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "start": "node server/dist/index.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write ."
  },
  "engines": {
    "node": ">=24.0.0"
  }
}
```

### 2. Create root TypeScript config

Create `tsconfig.json` at the project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "references": [
    { "path": "./client" },
    { "path": "./server" }
  ]
}
```

### 3. Create client workspace

```bash
mkdir -p client/src/{pages,components,types}
```

Create `client/package.json`:

```json
{
  "name": "@testally/client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

Create `client/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "include": ["src"]
}
```

Create `client/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TestAlly</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `client/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

Create placeholder `client/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>TestAlly</div>
  </React.StrictMode>,
);
```

### 4. Create server workspace

```bash
mkdir -p server/src/{routes,middleware,lib/{analysis/custom-rules,analyzer,llm/{providers,prompts},wcag}}
```

Create `server/package.json`:

```json
{
  "name": "@testally/server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc -b",
    "start": "node dist/index.js"
  }
}
```

Create `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "include": ["src"]
}
```

Create placeholder `server/src/index.ts`:

```ts
import express from 'express';

const app = express();
const PORT = process.env.API_PORT ?? 3001;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`TestAlly server running on port ${PORT}`);
});
```

### 5. Install root dev dependencies

```bash
npm install -D typescript concurrently vitest @vitest/coverage-v8 eslint @eslint/js typescript-eslint prettier eslint-config-prettier
```

### 6. Install client dependencies

```bash
npm install --workspace=client react react-dom react-router
npm install -D --workspace=client @vitejs/plugin-react vite @types/react @types/react-dom
```

### 7. Install server dependencies

```bash
npm install --workspace=server express dotenv
npm install -D --workspace=server @types/express tsx nodemon
```

### 8. Create ESLint config

Create `eslint.config.js` at root:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['**/dist/', '**/node_modules/'],
  },
);
```

### 9. Create Prettier config

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### 10. Create .gitignore

```
node_modules/
dist/
.env
.env.production
.env.local
*.tsbuildinfo
coverage/
```

### 11. Create .env.example

```env
# LLM Provider API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Application Settings
APP_URL=http://localhost:5173
API_PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Analysis Settings
MAX_INPUT_SIZE_KB=50
ANALYSIS_TIMEOUT_MS=30000
```

---

## Verification

Run these commands to confirm everything is wired correctly:

```bash
# TypeScript compiles without errors
npx tsc --build

# Lint passes
npm run lint

# Dev servers start (kill after confirming both are up)
npm run dev

# Health check responds
curl http://localhost:3001/api/health
# Expected: {"status":"healthy"}
```

## Files Created

```
package.json
tsconfig.json
eslint.config.js
.prettierrc
.gitignore
.env.example
vitest.config.ts
vitest.e2e.config.ts
client/
  package.json
  tsconfig.json
  index.html
  vite.config.ts
  src/
    main.tsx
    vite-env.d.ts
server/
  package.json
  tsconfig.json
  src/
    index.ts
```

### Implementation notes (keep `npx tsc --build` and ESLint working)

1. **Root `package.json`:** add `"type": "module"` so `eslint.config.js` can use `import` (ESM). Without it, Node treats `.js` as CommonJS and ESLint may fail to load.
2. **`client/tsconfig.json`:** add `"lib": ["ES2022", "DOM", "DOM.Iterable"]` under `compilerOptions`. The snippet above omits `lib`; without it, TypeScript may not resolve DOM types for `main.tsx`, and `tsc -b` can fail.
3. **`client/src/vite-env.d.ts`:** add `/// <reference types="vite/client" />` so editor/tsc understand Vite’s module env (optional but recommended).
4. **`vitest.config.ts` / `vitest.e2e.config.ts`:** the root `test` / `test:e2e` scripts expect these files (use `passWithNoTests: true` until tests exist).

If the dev tab never finishes loading, try opening **`http://127.0.0.1:5173/`** (or the port Vite prints), use a normal desktop browser, and ensure nothing else is bound to the same port.

## Next Step

Proceed to `002-docker-setup.md`.
