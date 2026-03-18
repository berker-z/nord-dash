# TODO

## In Progress / Next

- [ ] Calendar account modal: polish per-account calendar visibility controls (loading states / clearer role labels if needed).
- [x] Surface re-auth CTA when token refresh fails (per-account).
- [x] Show which calendar accounts failed to refresh so the user can re-auth them.
- [ ] Commit and push latest fixes/refactors.
- [ ] Notepad autosave cadence: settle on debounce/interval strategy and hook it up to Firestore without hammering.
- [ ] Notepad UX polish: allow renaming notes and confirm destructive actions.

## Completed (current pass)

- [x] Switched the Bible quote OpenAI model from `gpt-4o` to `gpt-5-nano` and removed unsupported GPT-5 sampling params.
- [x] Improved calendar-list diagnostics so Google Calendar API status/body is logged instead of silently collapsing account metadata to an empty calendar list.
- [x] Replaced primary-only calendar sync with per-account calendar visibility controls, synced calendar metadata from Google on refresh, and fetched events from all visible calendars.
- [x] Kept event editing pinned to the source calendar and allowed create flow to target writable calendars when more than one is available.
- [x] Forced offline-consent on Google code flows so the primary account can recover a refresh token, and made missing refresh tokens fail explicitly for re-auth.
- [x] Moved notepad to Firebase per-user notes, added icon-only actions, modal loader, and save-state colored icon with autosizing textarea.
- [x] Ensured calendar access tokens refresh on initial account load so overnight sessions don’t hit 401s before the interval kicks in.
- [x] Restyled calendar account modal to mirror the todo list (flat rows, separators, no status pill), removed sub-calendar toggles, and renamed the CTA to "Add account".
- [x] Removed Tailwind CDN usage; styles now flow through the built Tailwind pipeline (`index.css` import in `index.tsx`).
- [x] Introduced shared UI frames (`WidgetFrame`, `ModalFrame`) and migrated widgets/modals for consistency.
- [x] Authored design system doc (`design.md`) and centralized base tokens (colors, shadows, radii) in Tailwind + `index.css`.
- [x] Update `calendars.md` after refactors.
- [x] Added shared checkbox component and applied it to Google Meet toggle (was also used for subcalendars before primary-only pivot).
- [x] Softened widget title icon styling (removed pill background) to match lighter chrome.
- [x] Centralized Google Calendar API client (`services/googleCalendarClient.ts`) and removed duplicate token helpers.
- [x] Stabilized calendar account actions (owner email prop, Firestore toggle/remove helpers).
- [x] Guarded CoinGecko config via Vite env (`VITE_COINGECKO_API_KEY`).
- [x] Made widget resize updates immutable to prevent layout state mutation.
- [x] Added `useCalendarEvents` hook and moved `CalendarWidget` event fetching onto it.
- [x] Extracted calendar modals/list items into dedicated components to reduce `CalendarWidget` size.
- [x] Added `useCalendarAccounts` hook and wired `App` + `CalendarWidget` to centralized account actions.
- [x] Split Calendar agenda/month rendering into dedicated subcomponents with inline account error banner.
- [x] Expanded calendar color mapping to cycle Nord Aurora/Frost colors across up to 6 accounts.
- [x] Updated `project_structure.md` to current architecture.
