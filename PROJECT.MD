# PROJECT — Nord Dash

## Purpose

- Personal Nord-themed dashboard aggregating calendars, todos, crypto, weather, and Bible reflections behind whitelisted Google/Firebase auth.

## Stack & Layout

- React 18 (Vite) + TypeScript; Tailwind Nord theme compiled via `index.css` (no CDN).
- Three-column grid in `App.tsx`; shared chrome via `WidgetFrame`, `ModalFrame`, `Checkbox`.
- Design tokens and typography live in `design.md` + Tailwind config.

## Auth & Security Flow

- Login (`authService.handleIdentityLogin`): Google OAuth code client requests offline access with explicit consent, exchanges the code for access/refresh tokens, checks the whitelist, then signs into Firebase with the Google credential.
- Calendar accounts stored at `users/{ownerEmail}/calendarAccounts/{accountEmail}` with `accessToken`, `refreshToken`, `expiresAt`, `calendars[]`, profile info.
- Refresh: `useCalendarAccounts` loads accounts, refreshes tokens near/after expiry via `refreshAccountTokenIfNeeded`, persists updates to Firestore, and runs a 5-minute interval. Accounts missing a stored refresh token now fail with an explicit `MISSING_REFRESH_TOKEN` error so the UI can route the user into re-consent instead of silently retrying.
- Logout: `auth.signOut()`, local user cleared; Firestore calendar docs remain for reuse. Firestore rules restrict access to the signed-in email.

## Data Sources

- Google Calendar (OAuth access token) — events and calendar list.
- Firestore (Firebase Auth) — todos and calendar account tokens/metadata.
- Binance + CoinGecko (API key gated) — crypto prices/dominance/NFT floors.
- Open-Meteo — current weather.
- OpenAI GPT-5 nano — Bible quote of the day.

## Feature Modules

- Calendar: `useCalendarAccounts` (load/refresh/connect/disconnect/reauth plus persisted per-calendar visibility), `useCalendarEvents` (agenda/month ranges, fetches all visible calendars per account with per-account color), API calls in `services/googleCalendarClient.ts`; UI in `components/CalendarWidget` + subcomponents.
- Calendar diagnostics: failed `calendarList` calls now log Google HTTP status + body so Workspace/API restriction issues can be identified instead of appearing as a silent empty account.
- Todos: Firestore-backed list with transactions and realtime `onSnapshot` updates.
- Crypto: Fast Binance pairs plus slower CoinGecko metrics when `COINGECKO_API_KEY` is present.
- Bible: Structured `{ reference, text }` responses from OpenAI via `gpt-5-nano`.
- Weather: One-off fetch on load from Open-Meteo.
- Notepad: Firebase-backed notes stored under `users/{email}/notes/{noteId}` with manual save (autosave TBD), icon-only controls (new/load/save), modal picker that lists notes by name/snippet, autosizing textarea. Lives under the agenda in the left column.

## UI & Styling

- Shared primitives: `WidgetFrame` for widgets, `ModalFrame` for overlays, `Checkbox` reused across forms. Account modal shows REAUTH for failed accounts and exposes per-account calendar visibility toggles so holiday/shared calendars can be hidden without disconnecting the account.
- Nord palette (`nord-0`…`nord-16`) defined in Tailwind; base tokens (radii, borders, typography utilities) in `index.css`.
- Calendar event colors cycle per account; event creation/editing keeps the account locked on edit and now preserves the source calendar instead of forcing edits back onto the primary calendar.

## Maintenance

- Keep docs (`PROJECT.MD`, `DESIGN.md`, `TODO.md`) in sync with code changes.
- Follow `AGENTS.md` principles: modularity, single sources of truth, and consistent shared primitives.
