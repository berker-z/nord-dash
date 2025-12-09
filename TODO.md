# TODO

## In Progress / Next

- [ ] Primary-only calendar flow: ensure primary detection works across accounts; revisit multi-calendar support later if needed.
- [ ] Surface per-account re-auth UX when token refresh fails.
- [ ] Commit and push latest fixes/refactors.

## Completed (current pass)

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
