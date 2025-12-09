# Calendar/Auth Status — Source of Truth

## Requirements Recap
- Whitelisted Google/Firebase login; minimal re-consent across devices.
- Firebase-backed todos; only the authenticated user can read/write their own list.
- Multi-account Google Calendar: connect several accounts, view/edit all, color-coded, and persist connections across sessions/devices.

## Current Implementation

### Auth & Tokens
- Login uses the Google OAuth **code client** (`handleIdentityLogin` in `authService`), exchanges the code for `access_token`, `refresh_token`, `expires_in`, and enforces `ALLOWED_EMAILS` *before* signing into Firebase (`signInWithCredential`).
- Calendar tokens are stored per account in Firestore at `users/{ownerEmail}/calendarAccounts/{accountEmail}` with `accessToken`, `refreshToken`, `expiresAt`, and `calendars[]`.
- `useCalendarAccounts` loads accounts, refreshes tokens ~5 minutes before expiry (`refreshAccountTokenIfNeeded`), and writes refreshed tokens back to Firestore so other devices can reuse them.
- Logout calls `auth.signOut()` and clears local user state; calendar account data persists in Firestore for reuse.

### Calendar Data & UI
- API calls live in `services/googleCalendarClient.ts` (list/create/update/delete events, list calendars); `calendarService.ts` re-exports for compatibility.
- Events are fetched via `useCalendarEvents`:
  - Mode-sensitive ranges: today (AGENDA) or month range (MONTH).
  - Primary-only: each account is normalized to its primary calendar (`normalizeToPrimaryCalendar` in `authService`); sub-calendars are ignored.
  - Enriches events with `sourceCalendarId` and `sourceAccountEmail`.
  - Color mapping cycles Nord palette per account index: `["9","2","11","12","13","14","15"]` (supports 6+ accounts).
- `CalendarWidget` is composed of subcomponents:
  - `AgendaView` (today list), `MonthGrid` (month grid + day popover), `AccountModal` (disconnect + Add Account), `EventFormModal` (create/edit), `EventDetailModal`, `EventItem`.
  - Account actions (`connect`, `remove`) are passed down from `App` via `useCalendarAccounts`.
  - Account error banner shown inline if account load/refresh fails.
- Event creation/editing:
  - Account selection allowed when creating; locked when editing.
  - Calendar target is always the primary calendar for the chosen account.
  - Google Meet links supported via `conferenceDataVersion=1`; attendees supported.

### Todo/Other Widgets (for context)
- Todos: `services/todoService.ts` uses Firestore transactions; `subscribeTodos` sets/initializes `users/{email}` with `{ todos: [] }`.
- Crypto: Binance + CoinGecko; CoinGecko uses `COINGECKO_API_KEY` (process env) for `x-cg-demo-api-key`.
- Bible: OpenAI GPT-4o via `openaiService.ts`.
- Weather: Open-Meteo, public.

## Strengths
- Per-account tokens persisted in Firestore with scheduled refresh; multi-account supported in UI (visibility toggles, disconnect, color-cycled).
- Events carry source account/calendar metadata; colors are consistent across Agenda/Month.
- Calendar UI decomposed into reusable subcomponents; agenda/month modes share the same data hook.

## Gaps / Risks
- Primary-only calendar sync; reintroducing sub-calendar support would need new UI and data handling.
- Calendar list in Firestore is only loaded at connect time; no periodic `listCalendars` refresh to pick up new calendars or role changes.
- Account errors surface inline but are generic; no per-account re-auth prompt.
- Tailwind still pulled via CDN in HTML (separate infra task).
- Firestore rules are not documented in-repo (risk of drift).

## Next Actions (targeted)
1) Add calendar selection to `EventFormModal` (default writable, allow switch on create; keep edit locked—no moves).
2) Refresh calendar metadata per account periodically or on demand (call `listCalendars` and merge).
3) Add per-account re-auth UX when refresh fails (banner/action instead of silent console error).
4) Remove Tailwind CDN usage; rely solely on built Tailwind.
5) Check in Firestore rules and reference them here.
