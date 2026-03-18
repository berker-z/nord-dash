# Calendar/Auth Status — Source of Truth

## Requirements Recap

- Whitelisted Google/Firebase login; minimal re-consent across devices.
- Firebase-backed todos; only the authenticated user can read/write their own list.
- Multi-account Google Calendar: connect several accounts, view/edit all, color-coded, and persist connections across sessions/devices.

## Current Implementation

### Auth & Tokens

- Login uses the Google OAuth **code client** (`handleIdentityLogin` in `authService`), exchanges the code for `access_token`, `refresh_token`, `expires_in`, and enforces `ALLOWED_EMAILS` _before_ signing into Firebase (`signInWithCredential`).
- Calendar tokens are stored per account in Firestore at `users/{ownerEmail}/calendarAccounts/{accountEmail}` with `accessToken`, `refreshToken`, `expiresAt`, and `calendars[]`.
- `useCalendarAccounts` loads accounts, refreshes tokens ~5 minutes before expiry (`refreshAccountTokenIfNeeded`), and writes refreshed tokens back to Firestore so other devices can reuse them.
- Logout calls `auth.signOut()` and clears local user state; calendar account data persists in Firestore for reuse.

### Calendar Data & UI

- API calls live in `services/googleCalendarClient.ts` (list/create/update/delete events, list calendars); `calendarService.ts` re-exports for compatibility.
- `listCalendars` now logs HTTP status/text/body on failure so account-specific Workspace/API permission issues are debuggable.
- Events are fetched via `useCalendarEvents`:
  - Mode-sensitive ranges: today (AGENDA) or month range (MONTH).
  - Per-account visibility: account metadata stores all discovered calendars, and event sync fetches every calendar with `isVisible !== false`.
  - Enriches events with `sourceCalendarId` and `sourceAccountEmail`.
  - Color mapping cycles Nord palette per account index: `["9","2","11","12","13","14","15"]` (supports 6+ accounts).
- `CalendarWidget` is composed of subcomponents:
  - `AgendaView` (today list), `MonthGrid` (month grid + day popover), `AccountModal` (disconnect + Add Account), `EventFormModal` (create/edit), `EventDetailModal`, `EventItem`.
  - Account actions (`connect`, `remove`) are passed down from `App` via `useCalendarAccounts`.
  - Account modal now exposes per-account calendar checkboxes so shared/holiday calendars can be hidden without removing the parent Google account.
  - Account error banner shown inline if account load/refresh fails.
- Event creation/editing:
  - Account selection allowed when creating; locked when editing.
  - Calendar target defaults to the primary calendar for the chosen account, but create can target any writable visible calendar and edit preserves the event's source calendar.
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

- Calendar list in Firestore is refreshed on account load, but the account modal still has no explicit loading/error state per checkbox toggle.
- Account errors still surface as terse error codes; re-auth exists per account, but broader sync failures are still not very descriptive.
- Firestore rules are not documented in-repo (risk of drift).

## Next Actions (targeted)

1. Add inline loading/disabled states for calendar visibility toggles while Firestore updates are in flight.
2. Improve per-calendar labels in the account modal so Google-generated holiday/observance calendars are easier to spot.
3. Check in Firestore rules and reference them here.
