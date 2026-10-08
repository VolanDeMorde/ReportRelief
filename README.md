# ReportRelief

AI-assisted student report writing for teachers. React + Vite frontend on Firebase Hosting,
Firestore for storage, a Cloud Function that calls Gemini, and Stripe subscriptions via the
`firestore-stripe-payments` extension.

## Architecture

| Part | Where | Notes |
|---|---|---|
| Web app | `App.tsx`, `components/` (dashboard tabs in `components/dashboard/`) | Routes: `/`, `/app`, `/faq`, `/about`, `/privacy`, `/trash` |
| State | `hooks/` — `useAppState` composes `useRouting`, `useTheme`, `useAccount`, `useReports`, `useReportGeneration`, `useReportFilters`, `useUiState` | |
| Data access | `services/` | Reports live in `users/{uid}/reports` |
| Report generation | `functions/src/index.ts` → `generateReport` | Auth + quota (10/month free, 500 paid) + Gemini |
| Billing | Stripe extension (`CUSTOMERS_COLLECTION=users`) | `syncSubscriptionTier` mirrors the tier onto `users/{uid}` |
| Cleanup | `purgeDeletedReports` (daily) | Hard-deletes trashed reports after 24 h |
| Account deletion | `deleteAccount` (callable) | Re-auth required; refuses while a subscription would keep billing |
| Security | `firestore.rules`, `firestore.indexes.json` | Clients may only write profile fields on their user doc |

## Local development

Prerequisites: Node 22, Firebase CLI (`npm i -g firebase-tools`).

```bash
npm install
cp .env.example .env        # fill in the values
npm run dev                 # http://localhost:3000
```

The dev server talks to the deployed `generateReport` function (`VITE_FUNCTION_URL`);
`localhost:3000` and `:5173` are in the function's CORS allow-list.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest unit tests (web) |
| `cd functions && npm test` | Vitest unit tests (Cloud Functions: validation, prompt, subscriptions) |
| `npm run lint` | ESLint (flat config, `eslint.config.js`, zero warnings allowed, type-aware promise checks; covers `functions/src` too) |
| `npm run typecheck` | Type-check (strict) |
| `npm run check` | Everything CI checks: type-check, lint, tests (web + functions) |
| `npm run format` | Prettier over the whole codebase |
| `npm run test:coverage` | Tests with coverage report (`coverage/`) |
| `cd functions && npm run typecheck` | Type-check functions, including tests |
| `npm run build` | Production build to `dist/` |
| `npm run deploy` | `npm run check`, build, `firebase deploy` (functions are built by the predeploy hook) |

CI (`.github/workflows/ci.yml`) runs type-check, lint, tests and builds for both the web app and functions on every PR.

## Secrets and configuration

- **Frontend (`.env`)** — only public `VITE_*` values (Firebase web config, function URL, Stripe price IDs).
  Anything in `.env` with a `VITE_` prefix is shipped to browsers. Never put secret keys there.
- **Gemini API key** — a Functions secret, never in the frontend:
  ```bash
  firebase functions:secrets:set GEMINI_API_KEY
  ```
  Use a key on the **paid** Gemini API tier; the free tier may use prompts to improve Google's products,
  which is not acceptable for student data.
- **Gemini model** — optional `GEMINI_MODEL` in `functions/.env` (default `gemini-2.5-flash`).

## Deploying

```bash
firebase login
firebase use <project>
npm run deploy
```

When deploying `firestore.indexes.json`, answer **No** if the CLI offers to delete indexes that aren't in the file.

See `REVIEW_NOTES.md` for the latest review, open items and the post-deploy checklist.
