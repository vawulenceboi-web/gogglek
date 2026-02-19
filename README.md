# gogglek

Next.js 14 app.

## Setup

```bash
npm install
```

## Scripts

- **`npm run dev`** – Dev server (telemetry disabled to avoid version-check timeouts)
- **`npm run build`** – Production build (extra Node heap for large builds)
- **`npm run start`** – Run production server

## If build fails with "Bus error"

Do a clean reinstall and rebuild:

```bash
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

If it still fails, try Node 18 (e.g. `nvm use 18`) or increase memory:

```bash
NODE_OPTIONS='--max-old-space-size=8192' npm run build
```
