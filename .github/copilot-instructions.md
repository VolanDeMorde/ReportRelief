# ReportRelief — AI Coding Guidelines

ReportRelief is a React 19 + TypeScript + Vite PWA that writes student reports with Google Gemini.
Data lives in Firebase (Auth, Firestore, Cloud Functions, Hosting); billing uses the
`firestore-stripe-payments` extension. See `README.md` for setup and `REVIEW_NOTES.md` for recent changes.

## Architecture

| Concern | Where |
|---|---|
| App state | `hooks/useAppState.ts` composes focused hooks (`useRouting`, `useTheme`, `useAccount`, `useReports`, `useReportGeneration`, `useReportFilters`, `useUiState`); `AppState` is its return type. Add new state to the hook that owns the concern. |
| Pages | `components/*Page.tsx`, lazy-loaded from `App.tsx`; the dashboard mounts only on `/app` and is split into `components/dashboard/*` (each takes `Pick<AppState, …>`) |
| Firestore access | `services/reportService.ts` — reports in `users/{uid}/reports` |
| Report generation | `services/geminiService.ts` → `generateReport` HTTP function (`functions/src/index.ts`) |
| Account deletion | `services/accountService.ts` → `deleteAccount` callable |
| Billing | `services/checkoutService.ts`, `services/portalService.ts` (extension, `CUSTOMERS_COLLECTION=users`) |
| Pure helpers (tested) | `utils/` (CSV import/export, filters, drafts, env, errors); `functions/src/{validation,prompt,subscriptions}.ts` |

## Rules that must not be broken

- **No secrets in the frontend.** Only public `VITE_*` values go in `.env`. The Gemini key is a Functions secret
  (`GEMINI_API_KEY`); Gemini is called **only** from Cloud Functions.
- **Server-managed user fields** (`tier`, `generation_count`, `last_reset_date`, `subscriptionStatus`,
  `isSubscribed`, `stripeId`, …) are written only by Functions/the Stripe extension. `firestore.rules` allows
  clients to write just `displayName`, `email`, `lastLogin` on `users/{uid}`; keep it an allow-list.
- **Teacher-typed text never goes in the Gemini system instruction.** It goes in the delimited
  `<STUDENT DATA>` user message (`functions/src/prompt.ts`). Validate all input server-side (`validation.ts`).
- **Don't persist student data to `localStorage`.** Signed-in data lives in Firestore; the unsent form draft
  lives in `sessionStorage` (`utils/formDraft.ts`, images excluded) and is cleared on sign-out.
- **Privacy claims must match reality.** We use the *paid* Gemini API tier: data isn't used for training, but
  Google may retain it briefly for abuse monitoring. Don't write "never stored" / "immediately discarded".
- Analytics is **opt-in** (`firebase.ts`, `components/AnalyticsConsent.tsx`); never initialise it without consent.

## Conventions

- TypeScript is `strict` with `noUncheckedIndexedAccess`; don't silence it with `!` or `as any`, handle the `undefined` case.
- Every async UI handler catches its own errors and reports them (e.g. `setError`); deliberate fire-and-forget calls use `void`. ESLint enforces `no-floating-promises`.
- Strict lint: `npm run lint` runs with `--max-warnings 0`. No `any` (use `unknown` + `utils/errors.ts`),
  no `console.log` in app code (`console.warn`/`console.error` only; Functions use `firebase-functions/logger`).
- Re-thrown errors carry `{ cause }`.
- Domain constants are enums in `types.ts`; keep `functions/src/validation.ts` allow-lists in sync with them.
- Styling is Tailwind v4 utility classes with `dark:` variants (config in `styles.css`); shared gradients (`gradient-bg`) live in `index.html`.
- No third-party CDNs for fonts/icons/scripts: add them as npm packages (privacy). Icons are Font Awesome 6 solid/brands.
- Plan limits shown in the UI come from `constants.ts`; the Cloud Function enforces the real ones.
- Put new pure logic in `utils/` (web) or a non-Firebase module in `functions/src/` and add Vitest tests.

## Checks (all must pass; CI runs them)

```bash
npm run check && npm run build && npm --prefix functions run build
```
