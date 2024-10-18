# Kopflos example

API inspired by [Read the Plaque](https://readtheplaque.com/).

## Start

1. Start the database:
   ```bash
   docker compose up -d
   ```   
2. Start the server in development mode:
   ```bash
   npx kopflos serve --mode development
   ```

The API is running on http://localhost:1429

## Details

When starting, `kopflos` automatically seeds the database wit resource from directories `resources` and
`resources.dev` (configured in `kopflos.config.ts`).

## Building for production

First run the build command which uses vite to transform and bundle HTML templates.

```bash
npx kopflos build
```

Then start the server in production mode:

```bash
npx kopflos serve
```
