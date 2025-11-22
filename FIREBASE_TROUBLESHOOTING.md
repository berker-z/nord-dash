# Firebase Troubleshooting

## Issue: "Loading tasks..." stuck or no data in Firestore

### Solution:

You need to enable Google Sign-In in Firebase Authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project
2. Click **Build > Authentication** in the sidebar
3. Click the **Sign-in method** tab
4. Click on **Google** in the providers list
5. Toggle **Enable**
6. **IMPORTANT**: In the "Web SDK configuration" section:
   - Click "Web SDK configuration"
   - Paste your existing Google Client ID: `315765317298-2gauc6odedbhn1vmp15nn1mkuo5qmfnh.apps.googleusercontent.com`
   - Paste your existing Client Secret (from Google Cloud Console if you have it, or leave blank)
7. Add your support email
8. Click **Save**

### Why this is needed:

- The app uses Google OAuth to get calendar access
- Firebase needs to know about this OAuth client to properly authenticate users
- Without this, Firebase Auth won't recognize the Google sign-in

### After enabling:

1. Log out of the dashboard
2. Log back in
3. Your todos should now save to Firestore and sync across devices!

### Check if it worked:

- Go to Firebase Console → Firestore Database → Data tab
- You should see a `users` collection
- Inside should be a document with your email address
- That document should contain a `todos` array
