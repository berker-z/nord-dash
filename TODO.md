# TODO

## In Progress / Next

- [ ] URGENT: Remove Tailwind CDN usage; ensure styles come from the built Tailwind pipeline.
- [ ] Introduce shared UI frames (`WidgetFrame`, `ModalFrame`) and migrate widgets/modals for consistency.
- [x] Update `calendars.md` after refactors.

## Completed (current pass)

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
