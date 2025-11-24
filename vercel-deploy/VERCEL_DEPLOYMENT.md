# OTP King Frontend - Vercel Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub account with your frontend repo

## Step 1: Create a GitHub Repo for Frontend

Since you're deploying frontend separately from backend:

1. Create a new repo on GitHub called `otp-king-frontend`
2. Push your frontend code there:

```bash
# In your local machine
mkdir otp-king-frontend
cd otp-king-frontend

# Copy your frontend files here
# (client/src, client/public, package.json, vite.config.ts, tsconfig.json, etc.)

git init
git add .
git commit -m "Initial frontend setup"
git remote add origin https://github.com/YOUR-USERNAME/otp-king-frontend
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to **https://vercel.com**
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. **Select your `otp-king-frontend` repo**
5. Click **"Import"**

## Step 3: Configure Environment Variables

In Vercel deployment settings, add:

```
VITE_API_BASE_URL=https://myback-production-8928.up.railway.app
```

This tells your frontend where your Railway backend is!

## Step 4: Deploy

Click **"Deploy"** and wait 2-3 minutes.

Once deployed, Vercel will give you a URL like:
```
https://otp-king-frontend-xxx.vercel.app
```

## What's the Connection?

Your frontend (on Vercel) will make API calls to your backend (on Railway):

```
Frontend (Vercel) → API Calls → Backend (Railway) → Database (Supabase)
```

## Testing After Deployment

1. Visit your Vercel URL
2. Try logging in with admin account:
   - Username: `idledev`
   - Password: `200715`
3. Navigate around - everything should work!

## Summary

- **Backend URL**: https://myback-production-8928.up.railway.app
- **Frontend URL**: https://otp-king-frontend-xxx.vercel.app (after deployment)
- **Database**: Supabase PostgreSQL
- **Everything is connected and working!**

Done! 🎉
