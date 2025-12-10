# PROJECT — Nord Dash

## Purpose
- Personal Nord-themed dashboard aggregating calendars, todos, crypto, weather, and Bible reflections behind whitelisted Google/Firebase auth.

## Stack & Layout
- React 18 (Vite) + TypeScript; Tailwind Nord theme compiled via `index.css` (no CDN).
- Three-column grid in `App.tsx`; shared chrome via `WidgetFrame`, `ModalFrame`, `Checkbox`.
- Design tokens and typography live in `design.md` + Tailwind config.

## Auth & Security Flow
- Login (`authService.handleIdentityLogin`): Google OAuth code client → exchange for access/refresh tokens → whitelist check → Firebase sign-in with Google credential.
- Calendar accounts stored at `users/{ownerEmail}/calendarAccounts/{accountEmail}` with `accessToken`, `refreshToken`, `expiresAt`, `calendars[]`, profile info.
- Refresh: `useCalendarAccounts` loads accounts, refreshes tokens near/after expiry via `refreshAccountTokenIfNeeded`, persists updates to Firestore, and runs a 5-minute interval.
- Logout: `auth.signOut()`, local user cleared; Firestore calendar docs remain for reuse. Firestore rules restrict access to the signed-in email.

## Data Sources
- Google Calendar (OAuth access token) — events and calendar list.
- Firestore (Firebase Auth) — todos and calendar account tokens/metadata.
- Binance + CoinGecko (API key gated) — crypto prices/dominance/NFT floors.
- Open-Meteo — current weather.
- OpenAI GPT-4o — Bible quote of the day.

## Feature Modules
- Calendar: `useCalendarAccounts` (load/refresh/connect/disconnect), `useCalendarEvents` (agenda/month ranges, per-account color), API calls in `services/googleCalendarClient.ts`; UI in `components/CalendarWidget` + subcomponents.
- Todos: Firestore-backed list with transactions and realtime `onSnapshot` updates.
- Crypto: Fast Binance pairs plus slower CoinGecko metrics when `COINGECKO_API_KEY` is present.
- Bible: Structured `{ reference, text }` responses from OpenAI.
- Weather: One-off fetch on load from Open-Meteo.

## UI & Styling
- Shared primitives: `WidgetFrame` for widgets, `ModalFrame` for overlays, `Checkbox` reused across forms.
- Nord palette (`nord-0`…`nord-16`) defined in Tailwind; base tokens (radii, borders, typography utilities) in `index.css`.
- Calendar event colors cycle per account; event creation/editing uses the primary calendar; editing keeps account locked.

## Maintenance
- Keep docs (`PROJECT.MD`, `design.md`, `TODO.md`) in sync with code changes.
- Update `project_structure.md` legacy notes are now merged here; use this file as the architecture source of truth.
- Follow `AGENTS.md` principles: modularity, single sources of truth, and consistent shared primitives.
