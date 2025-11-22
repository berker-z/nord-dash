# Firebase Setup Guide

To migrate from local storage to server-side storage, we will use **Firebase**. This will allow:

- Per-user data storage (Todos, Settings, etc.)
- Data synchronization across devices
- Secure authentication

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and give it a name (e.g., `nord-dashboard`).
3. Disable Google Analytics (not needed for this).
4. Click **"Create project"**.

## Step 2: Enable Authentication

1. In your new project, go to **Build > Authentication** in the sidebar.
2. Click **"Get started"**.
3. Select **Google** as a Sign-in provider.
4. Enable it and select your support email.
5. **Important**: In the "Web SDK configuration" section:
   - Use your **existing Google Client ID** from your `.env` file (`VITE_GOOGLE_CLIENT_ID`)
   - This ensures calendar access works properly
6. Click **Save**.

## Step 3: Enable Firestore Database

1. Go to **Build > Firestore Database** in the sidebar.
2. Click **"Create database"**.
3. Choose a location (e.g., `eur3` for Europe or `nam5` for US).
4. Start in **Production mode**.
5. Click **Create**.

## Step 4: Get Configuration

1. Click the **Gear icon** (Project settings) next to "Project Overview".
2. Scroll down to "Your apps" and click the **Web icon (`</>`)**.
3. Register the app (e.g., `Nord Dashboard Web`).
4. You will see a `firebaseConfig` object. **Copy the values**.

## Step 5: Update Environment Variables

Create or update your `.env` file with the following values from the config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 6: Install Firebase SDK

Run the following command in your terminal:

```bash
npm install firebase
```

## Step 7: Deploy Security Rules

To ensure that users can only access their own data, you need to deploy Firestore security rules:

1. Go to **Build > Firestore Database** in the Firebase Console.
2. Click the **Rules** tab.
3. Replace the existing rules with the contents of `firestore.rules` from this project:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userEmail} {
      allow read, write: if request.auth != null && request.auth.token.email == userEmail;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**.

This ensures that:

- Each user can **only** read and write their own document (identified by their email)
- No one can access other users' data
- Unauthenticated users have no access

Once you have done these steps, the Firebase integration is complete!
