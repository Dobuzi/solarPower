# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all application code. Key areas include:
  - `src/components/` for UI modules (organized by feature, e.g. `Panel3D/`, `Map/`).
  - `src/core/` for solar math and domain logic (e.g. `solarPosition.ts`, `irradiance.ts`).
  - `src/hooks/`, `src/store/`, `src/models/` for React hooks, Zustand state, and shared types.
- `public/` holds static assets (e.g. `public/sun.svg`).
- Build output goes to `dist/` (GitHub Pages deployment uses this).

## Build, Test, and Development Commands
- `npm run dev` runs the Vite dev server for local development.
- `npm run build` runs `tsc -b` and builds the Vite bundle into `dist/`.
- `npm run preview` serves the built `dist/` locally.
- `npm run typecheck` runs TypeScript without emitting files (`--noEmit`).
- `npm run lint` lints `src/` with ESLint.
- `npm run test` / `npm run test:watch` runs Vitest (single run / watch mode).

## Coding Style & Naming Conventions
- TypeScript + React (TSX). Follow existing file style (2 spaces, semicolons).
- Components use `PascalCase` in `src/components/<Feature>/`.
- Hooks use `useX` in `src/hooks/`.
- Domain logic lives in `src/core/` with `camelCase.ts` filenames.
- Alias `@` points to `src/` (see `vite.config.ts`).

## Testing Guidelines
- Vitest is used. Keep tests adjacent to code, e.g. `src/core/*.test.ts`.
- No strict coverage target; add tests for critical math and calculations.

## Commit & Pull Request Guidelines
- History is currently minimal; no strict convention yet. Use a short imperative: `Fix`, `Add`, `Refactor`, `Docs`.
- PRs should include: a brief description, verification steps, and UI screenshots when relevant.
- Link related issues when applicable.

## Configuration Notes
- Environment variables are supported via `.env` and `.env.*` (do not commit).
- GitHub Pages deploy via Actions expects `base: "/solarPower/"` in `vite.config.ts`.
