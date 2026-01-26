# solarPower

Vite + React app.

## Local development
```bash
npm install
npm run dev
```

## GitHub Pages deployment (GitHub Actions)
This project deploys automatically on pushes to `main`.

Checklist:
- In GitHub repo settings: Pages → Source = "GitHub Actions"
- `vite.config.ts` has `base: "/solarPower/"`

Build output is `dist/` and is uploaded by the workflow at `.github/workflows/deploy.yml`.
