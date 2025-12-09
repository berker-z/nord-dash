<!--
MAINTENANCE INSTRUCTION FOR AI AGENTS:
When updating this document, you MUST:
1. Read EVERY single file in the codebase, including all components, services, and config files. Do not infer functionality from imports.
2. Analyze all functions, data structures, and authentication flows in detail.
3. Update every section to reflect the current state of the code.
4. Maintain the high level of detail established here (e.g., explaining specific logic within widgets, exact API calls, etc.).
This file is the source of truth for the project's architecture.
-->

# Project Structure & Architecture Documentation

This document provides a comprehensive technical overview of the Nord Dashboard project. It details the architecture, data flows, component logic, and service integrations to serve as a reference for future development.

## 1. Project Overview

**Nord Dashboard** is a personal "second brain" web application designed to centralize life management. It features a high-aesthetic "Nord" theme and integrates with multiple external services to track time, tasks, markets, and spiritual reflection.

### Technology Stack

- **Core**: React 18 (Vite), TypeScript
- **Styling**: Tailwind CSS (Custom Nord Theme), Lucide React Icons
- **Auth**: Google OAuth 2.0 (Identity Platform) + Firebase Authentication
- **Database**: Firebase Firestore (NoSQL)
- **APIs**: Google Calendar, OpenMeteo (Weather), CoinGecko & Binance (Crypto), OpenAI (Bible Quotes)

## 2. Directory Structure

```
/
├── components/                 # UI Widgets and shared components
│   ├── BibleWidget.tsx         # OpenAI-powered daily scripture
│   ├── CalendarWidget.tsx      # Calendar shell using hooks + subcomponents
│   ├── ConfirmModal.tsx        # Reusable confirmation dialog
│   ├── CryptoWidget.tsx        # Crypto market tracker (Binance + CoinGecko)
│   ├── TodoWidget.tsx          # Firebase-backed task list
│   ├── WidgetContainer.tsx     # Common widget wrapper (window chrome)
│   └── calendar/               # Calendar-only UI pieces
│       ├── AccountModal.tsx    # Account list, visibility toggles, disconnect
│       ├── AgendaView.tsx      # Agenda (today) view
│       ├── EventDetailModal.tsx# Event details with join/delete/edit actions
│       ├── EventFormModal.tsx  # Create/edit event form (account locked on edit)
│       ├── EventItem.tsx       # Standard event row styling
│       └── MonthGrid.tsx       # Month grid with day popover + account button
├── hooks/
│   ├── useCalendarAccounts.ts  # Loads/refreshes account list and visibility toggles
│   └── useCalendarEvents.ts    # Fetches events for agenda/month ranges
├── services/                   # API Integration Layer
│   ├── calendarService.ts      # Re-exports googleCalendarClient
│   ├── googleCalendarClient.ts # Calendar API calls (list/create/update/delete)
│   ├── firebase.ts             # Firebase App & Firestore init
│   ├── openaiService.ts        # GPT-4o integration
│   ├── todoService.ts          # Firestore CRUD operations
│   └── weatherService.ts       # OpenMeteo fetcher
├── App.tsx                     # Root component (Layout, Auth, Global State)
├── types.ts                    # TypeScript interfaces
├── config.ts                   # Environment configuration
├── tailwind.config.js          # Design system (Nord palette)
└── vite.config.ts              # Build configuration
```

## 3. Authentication Architecture

The application uses a **Hybrid Authentication Flow** combining Google OAuth2 for calendar access and Firebase Auth for user identity and database security.

### The Flow

1.  **Trigger**: User clicks "Sign in with Google".
2.  **Google OAuth**: `App.tsx` calls `handleIdentityLogin` (code client).
    - **Scope**: `openid email profile https://www.googleapis.com/auth/calendar`.
    - **Response**: Returns an auth `code`, exchanged for `access_token`, `refresh_token`, `expires_in`.
    - **Whitelist**: Email is checked against `ALLOWED_EMAILS` before signing into Firebase.
3.  **Firebase Sign-In**:
    - The app creates a `GoogleAuthProvider.credential` using the Google `access_token`.
    - It calls `signInWithCredential(auth, credential)` to authenticate with Firebase.
    - **Why?** This allows the app to use Firebase Security Rules for Firestore (Todos) while keeping the Google Token for Calendar API calls.
4.  **Session Management**:
    - **Calendar Tokens**: Stored per account in Firestore at `users/{ownerEmail}/calendarAccounts/{accountEmail}` (`accessToken`, `refreshToken`, `expiresAt`, calendars[]). `useCalendarAccounts` refreshes tokens 5 minutes before expiry.
    - **Firebase Session**: Managed automatically by the Firebase SDK; logout calls `auth.signOut()` and clears local user state.

### Token Refresh Logic (`useCalendarAccounts` + `authService`)

- The code client requests offline access; the first consent yields a `refresh_token`.
- `useCalendarAccounts` runs a 5-minute interval to refresh each account via `authService.refreshAccountTokenIfNeeded` (uses Google token endpoint and client secret from `config.ts`).
- Tokens are persisted back to Firestore so other devices can reuse them without re-consent.

## 4. Data Architecture

### Global State (`App.tsx`)

- **`user`**: Current authenticated user profile (Name, Email, Picture).
- **`layout`**: Grid configuration for widgets (Column/Order/Height).
- **`weather`**: Current temperature and weather code.
- **`currentTime`**: Ticks every second for clock display.
- **`calendarAccounts`**: Loaded via `useCalendarAccounts`; includes tokens, calendars, and visibility.

### Remote Data Sources

| Feature      | Source                  | Auth Method         | Update Frequency        |
| :----------- | :---------------------- | :------------------ | :---------------------- |
| **Calendar** | Google Calendar API     | OAuth2 Access Token | On Load / Manual        |
| **Todos**    | Firebase Firestore      | Firebase Auth       | Real-time (Snapshot)    |
| **Weather**  | Open-Meteo API          | Public (No Key)     | On Load                 |
| **Crypto**   | Binance API + CoinGecko | Public / API Key    | 15s (Binance), 10m (CG) |
| **Bible**    | OpenAI API (GPT-4o)     | API Key             | On User Request         |

## 5. Component Deep Dive

### `App.tsx` (The Controller)

- **Responsibility**: Orchestrates the entire app. It handles the initial auth check, loads the layout, fetches weather, and renders the 3-column grid.
- **Key Logic**:
  - `handleLogin()`: Manages the complex OAuth handshake.
  - `renderWidgetContent()`: Factory function that maps `WidgetType` to actual React components.
  - Calendar state: delegates account loading/refresh/toggle to `useCalendarAccounts`, passes actions down to widgets.
  - Layout resize: immutable updates per column item.

### `CalendarWidget.tsx` (The Planner)

- **Modes**:
  - `AGENDA`: Shows today's events list.
  - `MONTH`: Full monthly calendar grid.
- **Features**:
  - **CRUD**: Create, Read, Update, Delete events via `EventFormModal`/`EventDetailModal`.
  - **Meeting Links**: Auto-detects Zoom/Meet/Teams links and shows a "Join" button.
  - **Styling**: Maps accounts to Nord colors (index 0=blue, 1=green, 2+=red); `EventItem` standardizes rows.
  - **Subcomponents**: `AgendaView`, `MonthGrid`, `AccountModal`, `EventItem`, `EventFormModal`, `EventDetailModal`.
  - **Data**: Uses `useCalendarEvents` for per-mode event ranges; receives account actions from `App`.

### `TodoWidget.tsx` (The Task Manager)

- **Backend**: Firestore collection `users/{email}`.
- **Data Structure**: `{ todos: [{ id, text, completed }] }`.
- **Sync**: Uses `onSnapshot` for instant updates across devices.
- **Safety**: Uses Firestore transactions to prevent race conditions when multiple operations happen simultaneously.

### `CryptoWidget.tsx` (The Market Watch)

- **Hybrid Fetching**:
  - **Binance**: Fetches `BTC`, `ETH`, `SOL` prices (fast updates).
  - **CoinGecko**: Fetches "Market Dominance", "Milady Cult Coin", and NFT floor prices (slower updates to avoid rate limits).
- **Display**: Shows Price + 24h % Change with color coding (Green/Red).
- **Config**: Uses `COINGECKO_API_KEY` from `process.env` to set `x-cg-demo-api-key`; skips CoinGecko fetch if missing.

### `BibleWidget.tsx` (The Reflector)

- **Integration**: Sends user's "feeling" to OpenAI.
- **Prompting**: System prompt instructs GPT to return a JSON object with `{ reference, text }` focusing on comfort and wisdom.

## 6. Services Layer Details

### `services/calendarService.ts`

- Re-exports the functions from `googleCalendarClient` for compatibility.

### `services/googleCalendarClient.ts`

- **`listCalendars`**: Lists calendars for the authorized user.
- **`listEvents`**: Fetches events for a time range; parses conferenceData/location/description for meeting links; maps to `CalendarEvent` with `colorId` and `isTimeSpecific`.
- **`createEvent/updateEvent`**: Supports Google Meet links via `conferenceDataVersion=1`.
- **`deleteEvent`**: Deletes events by id.

### `services/todoService.ts`

- **`subscribeTodos`**: Sets up the Firestore listener. Handles creating the user document if it doesn't exist.
- **`addTodo/updateTodo/deleteTodo`**: Uses Firestore transactions to ensure atomic operations and prevent race conditions.

### `services/openaiService.ts`

- **`getBibleQuote`**: Calls `v1/chat/completions`.
- **Error Handling**: Returns a fallback "System Error" quote if the API key is missing or the request fails.

## 7. Configuration & Design System

### Tailwind Configuration (`tailwind.config.js`)

Defines the **Nord Palette** as a custom color extension:

- `nord-0` to `nord-3`: Polar Night (Dark Backgrounds)
- `nord-4` to `nord-6`: Snow Storm (Text)
- `nord-7` to `nord-10`: Frost (Blue/Teal Accents)
- `nord-11` to `nord-15`: Aurora (Functional Colors: Red, Orange, Yellow, Green, Purple)

### Environment Variables (`.env`)

- `VITE_GOOGLE_CLIENT_ID`: For OAuth.
- `VITE_FIREBASE_*`: For Firestore/Auth.
- `VITE_OPENAI_API_KEY`: For Bible widget.
- `COINGECKO_API_KEY`: For crypto data.
- `VITE_GOOGLE_CLIENT_SECRET` (used in auth token exchange).

---

_Generated by Antigravity Agent_
