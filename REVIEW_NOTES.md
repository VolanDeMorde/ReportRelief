# Code Review — Changes & Open Items

Started 2026-10-08 on branch `feature/improvements-and-fixes`. Nothing in this log is committed or deployed yet.

**Verification status (after round 5 + formatting):** `npm run check` passes (Prettier check, strict `tsc`, lint 0 errors/0 warnings with type-aware promise checks, web tests **149/149**, functions typecheck, functions tests **50/50**) · web build OK · functions build OK.
Not yet verified: Firestore rules and Cloud Functions have **not** been exercised against the emulator or production, and the UI changes (routing, consent banner, service worker, account deletion) have not been clicked through in a browser.

---

## 1. Changes made — round 1 (critical & high)

### Security / Firestore rules — `firestore.rules`
| Issue | Fix |
|---|---|
| Users could delete their own `users/{uid}` doc, resetting `generation_count` (free-tier bypass) | `allow delete: if false` |
| Users could edit `stripeId` / `stripeLink` on their user doc (extension uses `CUSTOMERS_COLLECTION=users`) → open another customer's billing portal | Replaced deny-list with allow-list: client may only write `displayName`, `email`, `lastLogin` |
| Create on `users/{uid}` always errored (`resource.data` is null on create) | Separate `create` rule using the same allow-list |
| Dead `customers/` rules (extension doesn't use that collection) | Removed; added read-only `users/{uid}/payments` |
| `checkout_sessions` were client-updatable/deletable | Now create + read only |

### Auth — `services/authService.ts`
- Login showed "Login failed" after a successful sign-in because `saveUserProfile` wrote to the blocked `customers/` collection. It now writes only profile fields; a profile write failure no longer fails login.

### Privacy leak / state — `hooks/useAppState.ts`
- **Sign-out copied the signed-in teacher's reports into `localStorage`**, and the next account to sign in on that machine migrated them into their own account. Removed the localStorage persistence effect (signed-out users can't generate anyway) and the listener cleanup now clears all report state on sign-out / user switch.
- Sign-out clears the session form draft (contains student data).
- Any Firestore snapshot forced the view to the dashboard (e.g. restoring from Trash navigated away). Now only on the first snapshot.
- Bulk generation saves each report as it completes (was: all saved at the end, lost if the tab closed).
- Local undo-delete keeps the report in memory (previously relied on the removed localStorage snapshot).

### Data layer — `services/reportService.ts`, `services/geminiService.ts`
- Trash listener streamed the **entire** reports collection; now `where('deletedAt', '!=', null)`. TTL expiry backstop moved to this listener.
- `upsertReportWithId` overwrote `createdAt` on every edit; it no longer writes `createdAt`.
- Report cache key ignored `gender`, `gradeLevel`, `classGroup`, `includeActionPlan` → changing gender returned the cached report with wrong pronouns. Key now covers every input except images.

### Cloud Functions — `functions/`
- **Deploy was broken:** `main` pointed at non-existent `lib/index.js`, `src/index.ts` didn't compile, and a divergent `functions/index.js` copy existed. Fixed the type errors, added a `predeploy` build in `firebase.json`, and moved the stale copy to `backups/legacy-functions/index.js`.
- Input validated **before** the quota is charged; quota refunded if Gemini fails.
- Prompt-injection hardening: the system instruction contains only fixed text + validated enum values; teacher free text goes in a delimited `<STUDENT DATA>` block in the user message.
- `imageEvidence` validated (JPEG/PNG/WebP data URL, size cap); real MIME type passed to Gemini.
- Mark clamped to 0–100; target mark enforced server-side; action plan respected when disabled.
- Internal error messages (including "rotate GEMINI_API_KEY") no longer returned to clients; logged server-side.
- CORS handled by one allow-list for preflight and requests (localhost dev now works).
- `syncSubscriptionTier` derives the tier from **all** of a user's subscriptions; stopped writing to `customers/`.
- Model configurable via `GEMINI_MODEL` env var, default `gemini-2.5-flash` (was the deprecated `gemini-2.0-flash`).
- Runtime Node 20 → 22; `firebase-admin` 12 → 14 (migrated to modular imports), `firebase-functions` 5 → 7, `@google/genai` → 2.x. Remaining audit: 1 moderate (`brace-expansion`, dev tooling).
- Added `firestore.indexes.json` with the collection-group index `purgeDeletedReports` needs (without it the daily purge query fails).

### Config / env
- `utils/validateEnv.ts` required the unused `VITE_STRIPE_PUBLISHABLE_KEY` (missing from `.env` → `npm run dev` threw). Now checks `VITE_FUNCTION_URL`, `VITE_STRIPE_PRICE_MONTHLY`, `VITE_STRIPE_PRICE_YEARLY`. `.env.example` updated.
- `.gitignore`: added `.env*` (except `.env.example`), `.firebase/`, `.venv/`, `functions/lib/`, `coverage/`. `.env` had never been committed.
- Removed unused `@google/genai` from the frontend. Kept `firebase` at 12.8.0 (newer 12.x adds ~60 KB gzip; the remaining `@grpc/grpc-js` advisory is Node-only and not in the browser bundle).
- Fixed 4 pre-existing type errors (test fixtures, `vite.config.ts` vitest typing).

### UX — `components/ReportForm.tsx`
- Images were rejected if the original was > 500 KB, i.e. nearly every phone photo. Now accepts up to 20 MB, compresses, then enforces 500 KB on the result. Profile photos are shrunk to 256 px (they're stored on every report).

---

## 1b. Changes made — round 2 (medium & low)

### Tooling
- **Lint works again.** Migrated `.eslintrc.json` → `eslint.config.js` (ESLint 10 flat config; added `@eslint/js`, `typescript-eslint`, `globals`; removed the separate `@typescript-eslint/*` packages). Fixed the 10 errors (missing `cause` on re-thrown errors, empty `catch` blocks, a useless escape). `--max-warnings 0` dropped for now; 29 warnings remain (mostly `console.log` / `any`).
- **CI:** `.github/workflows/ci.yml` runs type-check, lint, tests, web build and functions build on PRs and pushes to `main`.
- `validateEnv` test now tests the real module (`vi.stubEnv`) instead of a copy of its logic.
- README rewritten (architecture, setup, secrets, deploy). `FIREBASE_SETUP.md` replaced with a pointer: it told you to inject `GEMINI_API_KEY` into the frontend build, which is unsafe.

### Routing — `hooks/useAppState.ts`
- Views now have URLs (`/`, `/app`, `/faq`, `/about`, `/privacy`, `/trash`) via the History API: back/forward, refresh and deep links work, and the tab title follows the view. Auto-opening the dashboard for returning users uses `replaceState` and only happens from `/`, so deep links aren't overridden.

### Reports list — `hooks/useAppState.ts`, `components/DashboardPage.tsx`
- Loaded older pages are merged into `reports`, so **search, sort, grade filter, stats, CSV export and Share All cover them** (previously only the first 50). The separate "Older" section is gone.
- Older pages are no longer wiped on every live update; the pagination cursor isn't reset once you've paged.
- Edits, deletes and undo now update older (non-live) reports too.

### Privacy / compliance
- **Analytics is opt-in** (`firebase.js`, new `components/AnalyticsConsent.tsx`): the SDK is only downloaded and started after consent. Consent banner on first visit; on/off control in Privacy page section 8. Privacy and About page wording updated to match.
- Legacy `rb-reports` in `localStorage` are no longer imported silently: the user is asked (with sample names) and can decline. A failed import is retried next sign-in.
- CSV export neutralises formula injection (`= + - @` prefixes); new tests read the actual CSV output.

### PWA / hosting
- **The service worker had never been deployed**: `sw.js` sat outside `public/`, so it wasn't in `dist/` and Firebase served `index.html` at `/sw.js`. Moved to `public/sw.js`, rewritten to cache only Vite's hashed `/assets/*` (cache-first), network-first navigations, and ignore cross-origin requests; registered at `/sw.js`.
- `firebase.json`: the one-year cache header now applies only to `/assets/**` (it also matched `sw.js`); added `X-Content-Type-Options` and `Referrer-Policy`.
- Removed `user-scalable=no` / `maximum-scale` (zoom works; WCAG 1.4.4). App icons are now local (`public/icon.svg`) instead of hotlinked from flaticon.

### Small fixes
- Print view used invalid CSS `grid-template-cols` → `grid-template-columns`.
- Removed the `console.log` `onSelectPlan` handler on the pricing modal.

## 1c. Changes made — round 3 (account deletion, dashboard, lint, accuracy)

### Account deletion (GDPR right to erasure)
- **New `deleteAccount` callable** (`functions/src/index.ts`): requires a Google sign-in within the last 5 minutes, refuses while a subscription would keep billing (active/trialing/past_due/unpaid/incomplete and not set to cancel), revokes the user's tokens, recursively deletes `users/{uid}` (reports, checkout sessions, subscriptions, payments) and legacy `customers/{uid}`, then deletes the Auth user.
- **Client** (`services/accountService.ts`): re-authenticates with Google, calls the function, clears this browser's copies of the user's data (legacy reports, presets, form draft), signs out. Closing the Google popup counts as "cancelled", not an error.
- **UI** (`components/DeleteAccountSection.tsx`, Profile tab): explains what is deleted, points Pro users to Manage Subscription first, requires typing `DELETE`. On success the app returns to `/` with a confirmation toast (new app-wide `notice` toast).
- **Hardening that supports deletion:** `generateReport` now verifies ID tokens with `checkRevoked`, so a deleted/disabled account can't keep generating with a still-valid token; `syncSubscriptionTier` ignores (and cleans up) late Stripe webhooks for deleted users instead of recreating their user doc.

### Dashboard no longer loads on the landing page
- `App.tsx` mounts `DashboardPage` only on `/app` (it was rendered hidden on `/`, so every visitor downloaded the dashboard, form and card code). The pricing modal and notice toast moved to `App` because the landing page uses them too. Removed the dead "Launch App" FAB branch.
- **Form drafts now actually work** (`utils/formDraft.ts`): the hook had draft state that was never connected to the form. `ReportForm` now restores and (debounced) saves its own draft in `sessionStorage` (images excluded), so leaving `/app` doesn't lose typed input. The form remounts on user change; drafts are cleared on sign-out, successful generation and account deletion.
- Vendor chunks now include `react-dom/client` and `firebase/functions`: the app-code chunk dropped from ~70 KB to ~11 KB gzip, so deploys invalidate far less cached code.

### Lint: 29 warnings to 0
- New `utils/errors.ts` (`getErrorMessage`, `getErrorCode`) replaces every `catch (err: any)`.
- `DashboardPageProps` is now `AppState` (= `ReturnType<typeof useAppState>`) instead of a hand-maintained 60-field copy containing `any`s.
- Typed Web Speech API wrapper in `ReportForm`; speech recognition uses the browser language instead of hard-coded `en-US`.
- Removed debug `console.log`s; `import.meta.env` typed for the Stripe price IDs (`env.d.ts`); the service worker only registers in production builds.
- Functions code is linted from the root config (its legacy `.eslintrc.js` relied on an uninstalled ESLint and never ran) and logs via `firebase-functions/logger`.

### Bugs found and fixed along the way
- **CSV import marked every girl as male**: gender matching used `includes('m')`, and "Female" contains an "m". Every bulk row also inherited the single form's work-sample image and details. Rewritten as `utils/csvImport.ts` (tested); rows without a name are skipped, and an empty/unreadable CSV shows an error.
- **CSV export only included loaded reports** (first 50 + "Load more"). It now fetches all reports when more exist and applies the same search/grade/sort (`utils/reportFilters.ts`, tested, shared with the list).
- "Share all" threw an unhandled error when the share sheet was dismissed; copy-to-clipboard reported success even when it failed.

### Inaccurate claims corrected (consumer protection / GDPR transparency)
- **FAQ** said "we do not store any student names or report data on our servers... all information stays on your local browser's storage". False; rewritten.
- **About** said Trash keeps reports 30 days (it's 24 h) and that "we have no admin access" (project owners can read Firestore); corrected.
- "Immediately discarded" / "never stored, logged" (Privacy page, dashboard banner, About, Footer) replaced with the accurate paid-tier statement: not used for training; Google may retain briefly for abuse monitoring.
- Privacy page: deletion is self-service and immediate (was "within 30 days"); the rights section points to Delete account and Export CSV.
- **Pricing:** "Unlimited Reports" became "Up to 500 reports a month" (the real cap); removed "Priority AI Speed" (not implemented). The Profile tab said "unlimited" too; fixed.

### Tests and tooling
- Functions now have unit tests (Vitest, `functions/vitest.config.mts`): input validation, prompt-injection separation, subscription/tier logic. Pure logic was split out of `index.ts` into `validation.ts`, `prompt.ts`, `subscriptions.ts`.
- New web tests: CSV import, report filters, full-export fetch. CI runs the functions tests too.
- `.github/copilot-instructions.md` rewritten: it told AI assistants to put the Gemini key in the frontend and store reports in `localStorage`.
- README updated (deleteAccount, functions tests, lint policy).

## 1d. Changes made — round 4 (strict TypeScript)

### The root cause: React had no types
- `@types/react` / `@types/react-dom` were **not installed**, so every React API and every JSX element was silently `any`. That is where the ~1,800 strict-mode errors came from, and it meant component props were never actually checked. Installing them (plus `@types/papaparse`) left just 5 strict errors.

### Real bugs the types exposed (all were live)
- **The landing page's main "Get Started" buttons did nothing**: `App` passed `onGetStarted`, the page expected `onStart`, so `onClick` was `undefined`. Same for the "Get Started" buttons on the FAQ and About pages (`onStart` was never passed at all).
- **Footer "Privacy" link went to the wrong place on every page**: About (from landing), back to landing (from FAQ), an in-page scroll (from About), nothing (on Privacy). The About page's footer had no FAQ link. All pages now receive the same navigation callbacks from `App` (`navProps`).
- Navigating to a new page kept the previous page's scroll position; user navigation now starts at the top (back/forward keeps the browser's behaviour).

### Strict compiler settings (`tsconfig.json`, `functions/tsconfig.json`)
- `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch` on, zero errors. Removed unused `experimentalDecorators` / `useDefineForClassFields` / `allowJs`.
- `firebase.js` converted to `firebase.ts`, so the Firebase setup and analytics consent code are type-checked.
- Unchecked index access fixed properly (no `!` assertions in app code): bulk generation iterates with `entries()`, speech results via `Array.from`, regex groups via destructuring. The duplicated report-building code in single and bulk generation became one `toGeneratedReport` helper.
- Functions test files were excluded from type-checking (to keep them out of `lib/`); new `functions/tsconfig.check.json` + `npm run typecheck` covers them, and CI runs it.

### Type-aware lint for promises
- ESLint now runs `@typescript-eslint/no-floating-promises` and `no-misused-promises` (type-aware, web + functions). Async JSX handlers are allowed, on the rule that **every async UI handler catches and reports its own errors**.
- That audit found four handlers that could fail silently — **saving an edit, deleting, undo-delete, restoring from Trash**. If Firestore rejected the write (offline, permissions), the teacher saw no error and assumed it worked. Each now shows an error message (undo failure points to Trash).
- Promises that are intentionally fire-and-forget (and handle their own errors) are marked with `void`.

## 1e. Changes made — round 5 (structure, performance, privacy polish)

### Fonts and icons are self-hosted (GDPR)
- Google Fonts and the Font Awesome CDN were loaded on every page, sending each visitor's IP address to Google/Cloudflare (German courts have ruled this unlawful without consent for Google Fonts). Both are now npm packages bundled by Vite (`@fontsource-variable/plus-jakarta-sans`, `@fortawesome/fontawesome-free` v6, solid + brands only), served from your own domain, cached with the app, and no longer render-blocking `@import`s. The print view no longer loads Google Fonts either.
- `tailwind.config.js` was dead (Tailwind v4 ignores it); deleted, and its font setting moved into `styles.css` (`@theme`).

### SEO / sharing
- `index.html` now has a meta description, canonical URL and Open Graph / Twitter card tags (titles already change per route).

### Deploys and scripts
- `npm run deploy` no longer copies the whole project (35 MB) into `backups/` each time; it runs **`npm run check`** first (type-check, lint, tests for web and functions), then builds and deploys, so a broken build can't ship. `npm run backup` still exists for manual use.
- New scripts: `typecheck`, `check`. `format` / `format:check` now cover the whole codebase (they only looked at `src/`, which holds almost no code); `.prettierignore` added. `test:coverage` works (installed `@vitest/coverage-v8`).

### Bulk generation is faster and stops at the limit
- Students are generated **3 at a time** (`utils/concurrency.ts`, tested) instead of one by one, so a 30-student CSV takes roughly a third of the time.
- When the monthly limit is hit (HTTP 429) it **stops sending the rest** instead of failing every remaining student, and reports how many still need reports. Other failures now list the students' names.
- Report errors are typed (`ReportGenerationError` with the HTTP status). Network failures no longer show the browser's raw "Failed to fetch" message.

### `useAppState` split into focused hooks (`hooks/`)
| Hook | Responsibility |
|---|---|
| `useRouting` | URL ↔ view, history, titles |
| `useTheme` | Dark mode |
| `useAccount` | Auth user, plan/usage, sign-in/out, billing portal |
| `useReports` | Firestore sync, pagination, trash/undo, legacy import |
| `useReportGeneration` | Single and bulk generation |
| `useReportFilters` | Search, sort, grade filter, stats |
| `useUiState` | Errors/notices, menus, modals, tabs, connectivity |

`useAppState` (~660 → ~110 lines) now only composes them; the public `AppState` shape is unchanged except for removing six values nothing used (`searchQuery`, `setShowAccountMenu`, `olderReports`, `openDashboard`, `scrollToGenerateSection`, `scrollToSavedReportsSection`) and the two refs only they used.

### `DashboardPage` split (`components/dashboard/`)
- `DashboardPage.tsx` (~720 → ~150 lines) composes `DashboardHeader`, `GenerateTab`, `ReportsTab`, `ProfileTab`. Each declares exactly the state it needs (`Pick<AppState, …>`).
- The "Class Stats" card was duplicated in two tabs with different labels; now one `ClassStats` component. It showed "—%" with no reports; now "—".
- Plan limits live in `constants.ts` (display only; the server enforces them) instead of a local copy in the dashboard.

### Small fixes found during the refactor
- **The usage bar showed "Limit reached" after the monthly window had already reset**: the server only resets the stored counter on the next generation. The client now treats an expired window as 0 (`effectiveGenerationCount`, tested).
- The app saved the OS dark-mode preference on first visit, freezing it; now only an explicit choice is saved, so OS changes still apply otherwise.
- "Load more" failures were silent; they now show an error.
- `portalService` no longer initialises Firebase Functions at import time.

### Tests
- New: hook tests for routing, theme and `useReports` (including **"signing out clears the teacher's reports and writes nothing to localStorage"**), plus helpers (usage window, stats, grouping, report building, concurrency). Web tests 115 → 149.
- `src/test/setup.ts` works around Node 25's experimental global `localStorage` (a stub without methods that shadows jsdom's). CI uses Node 22 and wasn't affected; local runs on Node 25 were.

### Code formatting
- Ran Prettier (`.prettierrc`) over the whole codebase: 44 files were reformatted (quotes, line breaks, indentation, trailing commas only; no behaviour change, all checks re-run and passing). `npm run format:check` is now part of `npm run check` and CI, so formatting can't drift again; run `npm run format` (or format-on-save) before committing.
- Because nothing was committed beforehand, the formatting is mixed into the same diff as the review changes. Reviewing with whitespace hidden (`git diff -w`, or "Hide whitespace" on GitHub) filters most of it out.

### Decision: no offline copy of reports (privacy)
- Firestore can cache reports in the browser (IndexedDB) for offline use, but that would leave pupils' data on shared school computers after sign-out: the same class of problem fixed in round 1. Offline support stays at "the app shell loads"; generation and reports need a connection. Revisit only with an explicit "this is my own device" opt-in that's cleared on sign-out.

## 2. What you need to check

- [x] ~~Gemini API billing tier~~ — confirmed paid tier (2026-10-08); wording updated to match.
- [x] ~~Account deletion~~ — built (see 1c); test it as below.
- [ ] **Gemini model.** Confirm `gemini-2.5-flash` is available to your key, or set `GEMINI_MODEL` in `functions/.env`.
- [ ] **On `firebase deploy`:** if prompted to delete indexes not in `firestore.indexes.json`, answer **No** (or add them to the file).
- [ ] **Smoke test after deploy:** sign in (no error toast), single report, report with a phone photo, bulk CSV (a "Female" row must get she/her), upgrade checkout, billing portal, delete, trash, restore, undo-delete on an older ("Load more") report, Export CSV with more than 50 reports.
- [ ] **Account deletion test** with a throwaway Google account: (a) free account deletes, lands on `/` with the toast, and can sign up again fresh; (b) an account with an active subscription is refused with the "cancel first" message, and deletes after cancelling in the portal. Confirm in the Firebase console that `users/{uid}` and its subcollections are gone and the Auth user is removed.
- [ ] **Form draft:** type into the form, go to `/faq` and back: the text is still there. Sign out: it's cleared.
- [ ] **Navigation:** on `/`, `/faq` and `/about`, click every "Get Started" button (should open `/app`) and every footer link (About / FAQ / Privacy go to those pages, scrolled to the top).
- [ ] **Error messages:** with DevTools set to Offline, try editing, deleting and restoring a report: each should show an error instead of appearing to succeed.
- [ ] **Fonts and icons:** pages look the same as before (font, all icons). DevTools > Network should show no requests to `fonts.googleapis.com`, `fonts.gstatic.com` or `cdnjs.cloudflare.com`.
- [ ] **Bulk CSV:** a 10+ student CSV runs ~3 at a time with a progress counter; on a free account that runs out, generation stops with the "limit reached" message.
- [ ] **Routing:** open `/privacy` and `/app` directly, refresh, and use the browser back button.
- [ ] **Service worker (newly live):** after deploy, check DevTools > Application > Service Workers shows `/sw.js` activated, and that a second deploy is picked up on reload. To roll back, delete `public/sw.js` and deploy a `sw.js` that calls `self.registration.unregister()`.
- [ ] **Analytics consent:** banner appears once; Accept/Decline is remembered; the Privacy page toggle works.
- [ ] **Purge job:** check the `purgeDeletedReports` logs the day after deploy ("Purged N expired reports").
- [ ] **Existing user docs** created by the old client contain `tier`/`generation_count` written client-side. If you suspect anyone self-assigned `tier: 'paid'` before the rules fix, query `users` where `tier == 'paid'` and cross-check against Stripe.
- [ ] **Pricing copy:** the yearly plan still promises "Lock in this price forever". Keep it only if you intend to honour it.
- [ ] **Mailboxes:** the Privacy and About pages tell users to email `privacy@reportrelief.app` and `hello@reportrelief.app`. Make sure both actually receive mail.
- [ ] **Firebase project.** The app runs in project `imagecaptioner-464205`. Consider a dedicated project (data separation and billing).
- [ ] **PNG icons.** `public/icon.svg` works for Chrome/Edge installs; iOS home-screen icons need a 180x180 PNG (`apple-touch-icon`).

## 3. Still open

| Priority | Item |
|---|---|
| Low | **`backups/` (35 MB)** is no longer added to on deploy. Once this work is committed and tagged, you can delete the folder (it's gitignored) and `BACKUP_MANIFEST.json`. |
| Low | iOS home-screen icon needs a 180×180 PNG (see checklist). |
| Won't do | Offline access to reports (privacy on shared computers; see 1e). |
