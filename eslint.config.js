import { defineConfig, globalIgnores, includeIgnoreFile } from 'eslint/config'
import { fileURLToPath } from 'node:url'
import tpluscode from '@tpluscode/eslint-config'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default defineConfig([
  globalIgnores(['packages/sparql-path-parser/']),
  includeIgnoreFile(gitignorePath),
  ...tpluscode, {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  }, {
    files: ['**/*.test.ts'],
    rules: {
      'n/no-unsupported-features/node-builtins': 'off',
    },
  }])
