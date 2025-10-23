# Repository Guidelines

## Project Structure & Module Organization
- Next.js App Router lives in `src/app/(public|app|account|auth)` with API handlers under `src/app/api`.
- Shared UI components reside in `src/components` and `src/components/ui`; feature-specific modules live in `src/features/*`.
- Service clients and helpers are grouped in `src/libs/{supabase,resend,stripe}`; avoid editing generated Supabase types in `src/types/supabase`.
- Utility hooks, helpers, and styling primitives are in `src/{hooks,utils,styles}` and static assets in `public/`. Supabase resources are tracked in `supabase/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server on `http://localhost:3007`.
- `npm run build` compiles the production bundle; `npm run start` serves it.
- `npm run lint` runs ESLint with import sorting; fix reported issues before committing.
- Email workflows: `npm run email:dev` previews templates, `npm run email:build` bundles, `npm run email:export` exports HTML.
- Supabase lifecycle: `npm run supabase:start|stop|status|reset`; migrations via `npm run migration:new|up|squash`.

## Coding Style & Naming Conventions
- TypeScript everywhere with 2-space indentation, semicolons, single quotes, and max width 120.
- Prettier (with `prettier-plugin-tailwindcss`) enforces formatting and Tailwind class order; ESLint manages import sorting.
- File naming favors kebab-case; React components use PascalCase.

## Testing Guidelines
- Primary stack: Vitest + React Testing Library. Co-locate tests as `*.test.tsx` or in `__tests__/`.
- Add focused tests for new logic and consider snapshot coverage for email templates (`src/features/emails`).
- Ensure introduced tests pass locally; hook into CI expectations by running targeted `vitest` commands as needed.

## Commit & Pull Request Guidelines
- Commit messages are imperative, ≤72 characters, and scoped (e.g., `feat/auth: add magic-link flow`).
- Branch naming follows `feat/<scope>`, `fix/<scope>`, or `chore/<scope>`.
- Pull requests need clear rationale, linked issues, test notes, and screenshots or recordings for UI work; run `npm run lint` prior to submission.

## Security & Configuration Tips
- Store secrets in `.env.local` (gitignored); never commit API keys or tokens.
- After database schema changes, run `npm run migration:up` followed by `npm run generate-types` to sync Supabase types.
- Stripe integrations expect `npm run stripe:listen` to forward webhooks to `/api/webhooks`.
