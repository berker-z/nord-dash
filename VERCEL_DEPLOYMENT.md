# Vercel Deployment Guide

## Prerequisites

- GitHub repository (already set up: `berker-z/nord-dash`)
- Vercel account (sign up at vercel.com with GitHub)

## Deployment Steps

### 1. Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select `berker-z/nord-dash` from your GitHub repos
4. Click "Import"

### 2. Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Add Environment Variables

Click "Environment Variables" and add all from your `.env`:

```
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_CLIENT_SECRET=your_client_secret
VITE_ALLOWED_EMAILS=email1@example.com,email2@example.com
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENAI_API_KEY=your_openai_key
COINGECKO_API_KEY=your_coingecko_key
```

### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete (~1-2 minutes)
3. You'll get a URL like `nord-dash.vercel.app`

### 5. Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://nord-dash.vercel.app
   https://your-custom-domain.com (if using custom domain)
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://nord-dash.vercel.app
   https://your-custom-domain.com (if using custom domain)
   ```
6. Save changes

### 6. (Optional) Custom Domain

1. In Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Google OAuth origins with new domain

## Notes

- Vercel auto-deploys on every `git push` to master
- Preview deployments created for PRs
- Free tier includes: 100GB bandwidth, unlimited sites
- Environment variables are encrypted at rest
