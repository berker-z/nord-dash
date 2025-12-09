# Calendar/Auth Assessment & Plan

## Requirements Recap
- Sign in with Gmail (Google/Firebase) gated by whitelist; no repeated consent once linked.
- Per-user todos in Firebase; only the authenticated user can read/write their own list.
- Connect multiple Google calendars (multiple accounts), view/edit all, color-coded, pick target calendar when creating events; persist connections across sessions/devices.

## Current State (from code)
- Login uses Google token client (`App.tsx`) to fetch an access token, signs into Firebase with `GoogleAuthProvider.credential`, then fetches userinfo to enforce `ALLOWED_EMAILS`. The whitelist check happens **after** Firebase sign-in.
- Calendar uses a single access token stored in `localStorage` as `nord_calendar_token`; refresh logic only runs if a `refresh_token` exists. A refresh token is set only when the user clicks “Connect Google Cal” (code client) in the widget; the initial login flow never captures one, so tokens expire ~1h and require re-consent.
- Calendar API calls (`services/calendarService.ts`) are hardcoded to the `primary` calendar for list/create/update/delete. `listCalendars` exists but is unused; the UI has no notion of multiple calendars or per-calendar colors; adds/edits don’t let you pick a calendar/account.
- Auto Firebase re-sign-in on load reuses whatever access token is in storage without checking expiry; `handleLogout` doesn’t clear tokens or sign the user out of Firebase.
- Todos: `subscribeTodos` + transaction-based CRUD in `services/todoService.ts` prevent the prior race conditions; no autosave loop remains. Data lives at `users/{email}` with no client-side sharing.
- Firestore rules (per your note) already enforce that only the matching email can read/write its todos, but the rules aren’t checked into the repo.
- Red error bar likely comes from `firebaseAuthError` in `App.tsx` (shown when `signInWithCredential` fails, often because the stored Google access token is expired or the OAuth client ID isn’t whitelisted in Firebase).

## Findings on Race Condition Work
- Code now uses Firestore transactions for add/update/delete and removed the autosave effect, so the documented race conditions appear resolved.
- No new race risks spotted; main remaining risk is missing server-side rules, not client logic.
- Given the above, RACE_CONDITION_FIX.md is informational; safe to remove once rules are in place and the error banner is addressed.

## Gaps vs Desired Behavior
- No multi-calendar/account support; all calls hit `primary` and there’s no persisted list of connected calendars.
- No durable refresh tokens across devices; refresh only works after an explicit “Connect” click and only on that device (localStorage).
- Logout is incomplete (tokens persist; Firebase session not cleared).
- Whitelist is enforced late; an unapproved account can momentarily sign into Firebase before being rejected in UI.
- Todos are access-controlled by Firestore rules (good), but the rules aren’t documented in-code, so environment drift is possible.

## Roadmap to Thunderbird-Style Multi-Calendar
1) **Stabilize Auth & Tokens**
   - Use the code client for login too (`access_type=offline`, `prompt=consent`, `include_granted_scopes=true`) so you always capture `refresh_token` + `expires_in` on first consent.
   - Store `access_token`, `refresh_token`, `expiry` per Google account, and refresh ~5 minutes before expiry; clear them on logout and call `signOut(auth)`.
   - Switch to `onAuthStateChanged` to restore Firebase sessions instead of reusing stale Google tokens; only call `signInWithCredential` when you have a fresh token.
   - Register both localhost and production origins/redirect URIs in Google Cloud; keep separate OAuth client IDs for dev/prod to avoid losing refresh tokens between deploys.

2) **Per-Account/Calendar Data Model**
   - Persist connected accounts in Firestore under the whitelisted user (e.g., `users/{email}/calendarAccounts/{accountEmail}`) with `refresh_token`, `access_token`, `expiry`, `scopes`, and selected calendar IDs. Encrypt at rest if you want extra safety; gate access via rules.
   - On login, load this list, refresh tokens silently, and hydrate UI state without user prompts.

3) **API Layer Changes**
   - Update calendar service functions to accept `calendarId` (and account) instead of hardcoded `primary`; use `calendar.events.list/insert/update/delete` per calendar.
   - Use `calendarList` to fetch available calendars per account; persist title/color/calendarId. Respect Google’s provided colors or map to Nord palette for consistent per-calendar styling.

4) **UI/UX**
   - Add a “Connected Calendars” panel: show accounts, calendars, colors, and toggle visibility; include “Add calendar” (launch code client with account chooser).
   - In Add/Edit event modal, require calendar selection; pre-fill based on the event’s calendar; show color chips in agenda/month views.
   - Surface token issues inline (e.g., “Re-auth needed for berker@lat48.io”) instead of the generic red bar once token handling is stable.

5) **Todos & Security**
   - Firestore rules already restrict access by email; add the rules file to the repo/docs so other envs mirror prod. Optionally move todos under `users/{uid}/todos/{id}` for clearer rule scoping and remove the unused `saveTodos` export to reduce confusion.

6) **Auth Simplification (should we move auth fully to Firebase?)**
   - Keep the hybrid model but consolidate flows: use the Google OAuth code client once to get `access_token` + `refresh_token` (offline access), then create a Firebase credential from that token. Firebase alone (popup/redirect) won’t give a long-lived Calendar refresh token, so “Firebase only” would either break calendar refresh or force re-consent. Simplification = one OAuth+Firebase handshake with proper token storage/refresh, not dropping the OAuth piece.

7) **Auth Moments: Make Them Explicit**
   - Identity login = 1 Google sign-in to know “who you are.” Use the code client so this step also captures offline access for that account (access + refresh token). Immediately sign into Firebase with that token. Result: login + first calendar consent collapse into a single action for account A.
   - Extra calendar accounts (B, C…) = 1 additional consent each via the code client/account chooser to fetch that account’s refresh token. Store per-account tokens (e.g., under `users/{email}/calendarAccounts/{accountEmail}`) so they silently refresh across devices; no further prompts unless revoked.
   - Net: always 1 identity auth + 1 consent per added calendar account. Persisting refresh tokens removes repeat prompts on new sessions/devices.

8) **Cleanup**
   - After token handling is fixed, drop the `firebaseAuthError` banner or downgrade to a toast; remove `RACE_CONDITION_FIX.md` once rules + tests confirm stability.

## Likely Cause of “Random” Red Error
- Trigger: `signInWithCredential` runs on startup with an expired `nord_calendar_token`, yielding `auth/invalid-credential` → `firebaseAuthError` banner.
- Secondary cause: if the OAuth client ID used locally isn’t whitelisted in Firebase Auth, the same banner shows. Register the client ID(s) in Firebase Console or skip re-login until a fresh token is available.
