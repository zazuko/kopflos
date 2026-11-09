import eslint from 'eslint/config'
import { fileURLToPath } from 'node:url'
import tpluscode from '@tpluscode/eslint-config'

const { defineConfig, globalIgnores, includeIgnoreFile } = eslint

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
  }])
