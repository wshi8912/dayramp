# Repository Guidelines

## Project Structure & Module Organization
- `src/app/(public|app|account|auth)`: Next.js App Router routes. API handlers under `src/app/api`.
- `src/components` and `src/components/ui`: Reusable components.
- `src/features/*`: Feature domains (e.g., `emails`, `account`, `pricing`). Email templates: `src/features/emails`.
- `src/libs/{supabase,resend,stripe}`: Service clients and helpers.
- `src/types/supabase`: Generated DB types (do not edit).
- `src/{hooks,utils,styles}`: Hooks, utilities, Tailwind styles. Static assets in `public/`. Supabase project in `supabase/`.

## Build, Test, and Development Commands
- `npm run dev`: Start dev server on `http://localhost:3007`.
- `npm run build` / `npm run start`: Build and run production.
- `npm run lint`: ESLint with import sorting.
- Email templates: `npm run email:dev` (preview on 3001), `email:build`, `email:export`.
- Supabase: `npm run supabase:start|stop|status|reset`.
- DB migrations: `npm run migration:new|up|squash`.
- Types: `npm run generate-types` to refresh `src/types/supabase/database.types.ts`.
- Stripe webhooks: `npm run stripe:listen` → forwards to `/api/webhooks`.

## Coding Style & Naming Conventions
- Language: TypeScript. Indent 2 spaces; semicolons; single quotes; max width 120; `arrowParens: always` (see `prettier.config.js`).
- Tailwind: rely on `prettier-plugin-tailwindcss` for class order; prefer utility-first composition.
- Imports: `eslint-plugin-simple-import-sort` (React/Next, external, aliases, parent, sibling, styles).
- Filenames: kebab-case; React components: PascalCase. Do not edit generated files in `src/types/supabase`.

## Testing Guidelines
- Preferred stack: Vitest + React Testing Library.
- Place tests alongside sources as `*.test.ts(x)` or in `__tests__/`.
- For email templates, consider snapshot-testing rendered HTML.
- Run tests like typical Vitest projects (add scripts as needed).

## Commit & Pull Request Guidelines
- Commits: imperative mood, concise subject (<72 chars). Example: `feat(timer): add pause/resume logic`.
- Branches: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`.
- PRs: clear description, rationale, screenshots for UI changes, test steps, and linked issues. Keep scope focused and run `npm run lint` before submitting.

## Security & Configuration Tips
- Keep secrets in `.env.local` (gitignored). Never commit tokens/keys.
- After DB changes: run `npm run migration:up` then `npm run generate-types` to keep types in sync.
