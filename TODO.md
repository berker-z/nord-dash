# Nord Dashboard - Roadmap

## Progression (Completed)

- [x] **Core Architecture**: React + Vite + Tailwind (Nord Theme).
- [x] **Authentication**: Hybrid Google OAuth2 (Calendar) + Firebase Auth (Identity).
- [x] **Calendar**: Integrated Google Calendar API (Month & Agenda views).
- [x] **Tasks**: Implemented real-time Firestore sync for Todos.
- [x] **Markets**: Added Crypto tracking (Binance + CoinGecko).
- [x] **Scripture**: Migrated Bible Widget to OpenAI (GPT-4o).

## Todo

### Refinement & UX

- [ ] **Widget State**: Persist minimized/expanded state of widgets in localStorage.
- [ ] **Offline Mode**: Improve UI feedback when network is unreachable.
- [ ] **Mobile View**: Polish responsive layout for smaller screens (currently optimized for desktop).

### New Features

- [ ] **Bible History**: Save favorite daily quotes to Firestore.
- [ ] **Todo Enhancements**: Add drag-and-drop reordering and due dates.
- [ ] **Weather Details**: Add hourly forecast modal to Weather widget.

### Infrastructure

- [ ] **Docker**: Containerize the application for easy self-hosting.
- [ ] **CI/CD**: Set up automated build/test pipeline.
