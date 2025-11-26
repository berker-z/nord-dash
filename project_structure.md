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

**Nord Dashboard** is a personal "second brain" web application designed to centralize life management. It features a high-aesthetic "Nord" theme and integrates with multiple external services to track time, tasks, flights, markets, and spiritual reflection.

### Technology Stack

- **Core**: React 18 (Vite), TypeScript
- **Styling**: Tailwind CSS (Custom Nord Theme), Lucide React Icons
- **Auth**: Google OAuth 2.0 (Identity Platform) + Firebase Authentication
- **Database**: Firebase Firestore (NoSQL)
- **APIs**: Google Calendar, OpenMeteo (Weather), CoinGecko & Binance (Crypto), OpenAI (Bible Quotes)

## 2. Directory Structure

```
/
├── components/           # UI Widgets and shared components
│   ├── BibleWidget.tsx   # OpenAI-powered daily scripture
│   ├── CalendarWidget.tsx# Google Calendar integration (Month/Agenda views)
│   ├── ConfirmModal.tsx  # Reusable confirmation dialog
│   ├── CryptoWidget.tsx  # Crypto market tracker (Binance + CoinGecko)
│   ├── ScheduleWidget.tsx# Flight/Duty status tracker
│   ├── TodoWidget.tsx    # Firebase-backed task list
│   └── WidgetContainer.tsx # Common widget wrapper (window chrome)
├── services/             # API Integration Layer
│   ├── calendarService.ts# Google Calendar API & Auth helpers
│   ├── firebase.ts       # Firebase App & Firestore init
│   ├── openaiService.ts  # GPT-4o integration
│   ├── todoService.ts    # Firestore CRUD operations
│   └── weatherService.ts # OpenMeteo fetcher
├── flights/              # Static Data
│   └── *.json            # Flight schedule data files
├── App.tsx               # Root component (Layout, Auth, Global State)
├── types.ts              # TypeScript interfaces
├── config.ts             # Environment configuration
├── tailwind.config.js    # Design system (Nord palette)
└── vite.config.ts        # Build configuration
```

## 3. Authentication Architecture

The application uses a **Hybrid Authentication Flow** combining Google OAuth2 for calendar access and Firebase Auth for user identity and database security.

### The Flow

1.  **Trigger**: User clicks "Sign in with Google".
2.  **Google OAuth**: `App.tsx` initializes `google.accounts.oauth2.initTokenClient`.
    - **Scope**: `openid email profile https://www.googleapis.com/auth/calendar`
    - **Response**: Returns an `access_token` from Google.
3.  **Firebase Sign-In**:
    - The app creates a `GoogleAuthProvider.credential` using the Google `access_token`.
    - It calls `signInWithCredential(auth, credential)` to authenticate with Firebase.
    - **Why?** This allows the app to use Firebase Security Rules for Firestore (Todos) while keeping the Google Token for Calendar API calls.
4.  **Session Management**:
    - **Google Token**: Stored in `localStorage` (`nord_calendar_token`). Auto-refreshes 5 minutes before expiry using a stored `refresh_token`.
    - **Firebase Session**: Managed automatically by the Firebase SDK.

### Token Refresh Logic (`App.tsx` & `calendarService.ts`)

- The app requests "offline access" to get a `refresh_token`.
- A background interval checks token expiry every minute.
- If expired/expiring, `refreshAccessToken()` hits `https://oauth2.googleapis.com/token` to get a fresh access token without user intervention.

## 4. Data Architecture

### Global State (`App.tsx`)

- **`user`**: Current authenticated user profile (Name, Email, Picture).
- **`layout`**: Grid configuration for widgets (Column/Order/Height).
- **`weather`**: Current temperature and weather code.
- **`currentTime`**: Ticks every second for clock display.

### Remote Data Sources

| Feature      | Source                  | Auth Method         | Update Frequency        |
| :----------- | :---------------------- | :------------------ | :---------------------- |
| **Calendar** | Google Calendar API     | OAuth2 Access Token | On Load / Manual        |
| **Todos**    | Firebase Firestore      | Firebase Auth       | Real-time (Snapshot)    |
| **Weather**  | Open-Meteo API          | Public (No Key)     | On Load                 |
| **Crypto**   | Binance API + CoinGecko | Public / API Key    | 15s (Binance), 10m (CG) |
| **Bible**    | OpenAI API (GPT-4o)     | API Key             | On User Request         |
| **Flights**  | Local JSON Files        | Static Build        | N/A                     |

## 5. Component Deep Dive

### `App.tsx` (The Controller)

- **Responsibility**: Orchestrates the entire app. It handles the initial auth check, loads the layout, fetches weather, and renders the 3-column grid.
- **Key Logic**:
  - `handleLogin()`: Manages the complex OAuth handshake.
  - `renderWidgetContent()`: Factory function that maps `WidgetType` to actual React components.

### `ScheduleWidget.tsx` (The Status Tracker)

- **Purpose**: Tracks the user's location and duty status based on flight data.
- **Logic (`getCurrentStatus`)**:
  - Parses all JSON files in `flights/`.
  - Compares current time against flight/event windows.
  - Determines state: `HOME`, `AWAY` (at destination), `FLYING` (in air), or `STANDBY`.
  - Calculates "Time Until" next event or return home.
- **Visuals**:
  - **Widget**: Simple status text + Icon (Cat/Plane/Briefcase).
  - **Modal**: A custom-built Monthly Gantt chart visualizing trips as colored blocks.

### `CalendarWidget.tsx` (The Planner)

- **Modes**:
  - `AGENDA`: Shows today's events list.
  - `MONTH`: Full monthly calendar grid.
- **Features**:
  - **CRUD**: Create, Read, Update, Delete events directly from the UI.
  - **Meeting Links**: Auto-detects Zoom/Meet/Teams links and shows a "Join" button.
  - **Styling**: Maps Google Calendar `colorId` to Nord theme colors (e.g., Tasks = Green, Events = Blue).

### `TodoWidget.tsx` (The Task Manager)

- **Backend**: Firestore collection `users/{email}`.
- **Data Structure**: `{ todos: [{ id, text, completed }] }`.
- **Sync**: Uses `onSnapshot` for instant updates across devices.
- **Safety**: Only writes to DB after initial load to prevent overwriting data with empty state.

### `CryptoWidget.tsx` (The Market Watch)

- **Hybrid Fetching**:
  - **Binance**: Fetches `BTC`, `ETH`, `SOL` prices (fast updates).
  - **CoinGecko**: Fetches "Market Dominance", "Milady Cult Coin", and NFT floor prices (slower updates to avoid rate limits).
- **Display**: Shows Price + 24h % Change with color coding (Green/Red).

### `BibleWidget.tsx` (The Reflector)

- **Integration**: Sends user's "feeling" to OpenAI.
- **Prompting**: System prompt instructs GPT to return a JSON object with `{ reference, text }` focusing on comfort and wisdom.

## 6. Services Layer Details

### `services/calendarService.ts`

- **`listEvents`**: Fetches events for a time range. Handles `conferenceData` and description parsing to find video links.
- **`exchangeCodeForToken`**: Swaps the initial auth code for long-lived tokens.
- **`createEvent/updateEvent`**: Supports adding Google Meet links via `conferenceDataVersion=1`.

### `services/todoService.ts`

- **`subscribeTodos`**: Sets up the Firestore listener. Handles creating the user document if it doesn't exist.
- **`saveTodos`**: Overwrites the `todos` array in the user document (simple but effective for small lists).

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

---

_Generated by Antigravity Agent_
