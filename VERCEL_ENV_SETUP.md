# 🚨 URGENT: Fix Production Frontend Environment Variables in Vercel

## Problem
Your frontend at `https://www.devhubs.in` is trying to connect to `http://localhost:5001` instead of your production backend URL. This is causing CORS errors.

## Solution: Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (the one deployed to `www.devhubs.in`)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add/Update These Variables

**⚠️ CRITICAL: Set these for PRODUCTION environment**

Add or update these environment variables:

```
VITE_API_URL=https://your-backend-production-url.com
VITE_SOCKET_SERVER=https://your-backend-production-url.com
```

**Replace `https://your-backend-production-url.com` with your actual backend URL**

Examples:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Custom domain: `https://api.devhubs.in`

### Step 3: Complete List of Required Variables

Make sure ALL these are set in Vercel (for Production environment):

```env
# Backend URLs (REQUIRED - Replace with your backend URL)
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_SERVER=https://your-backend-url.com
VITE_ACCOUNT_CREATION_API=https://your-backend-url.com/api/user
VITE_LOGIN_API=https://your-backend-url.com/api/login
VITE_GITHUB_LOGIN_API=https://your-backend-url.com/api/github/login

# Firebase (Already set, but verify)
VITE_FIREBASE_API_KEY=AIzaSyDv0D4PmCm2xztSIPWV3t_uuoExUXwH6LU
VITE_FIREBASE_AUTH_DOMAIN=devhubs-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=devhubs-project
VITE_FIREBASE_STORAGE_BUCKET=devhubs-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=659320333811
VITE_FIREBASE_APP_ID=1:659320333811:web:32bf805c2ef8d1ac701e86

# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_RaQNtzh9mgnPza
VITE_RAZORPAY_MODE=production
VITE_MOCK_RAZORPAY=false
```

### Step 4: Important Settings in Vercel

1. **Environment**: Make sure to select **Production** (not Development or Preview)
2. **Apply to**: Select "Production" environment
3. **Save** each variable

### Step 5: Redeploy

After setting all variables:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. OR push a new commit to trigger a new deployment

### Step 6: Verify

After redeployment:

1. Open `https://www.devhubs.in` in browser
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. You should NOT see `localhost:5001` in any errors
5. Check **Network** tab - API calls should go to your backend URL

## 🔍 How to Find Your Backend URL

### If using Railway:
1. Go to Railway dashboard
2. Select your backend service
3. Go to **Settings** → **Networking**
4. Copy the public domain (e.g., `https://your-app.railway.app`)

### If using Render:
1. Go to Render dashboard
2. Select your backend service
3. Copy the URL from the service overview (e.g., `https://your-app.onrender.com`)

### If using custom domain:
- Use your custom domain (e.g., `https://api.devhubs.in`)

## ⚠️ Backend CORS Configuration

Also make sure your backend has `https://www.devhubs.in` in the `ALLOWED_ORIGINS` environment variable:

```env
ALLOWED_ORIGINS=https://www.devhubs.in,https://devhubs.in
```

## 🐛 Troubleshooting

### Still seeing localhost in production?

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Vercel build logs** - Make sure variables are being used
3. **Verify environment** - Make sure variables are set for "Production"
4. **Check variable names** - Must start with `VITE_` and match exactly

### CORS errors persist?

1. Verify backend `ALLOWED_ORIGINS` includes `https://www.devhubs.in`
2. Check backend is running and accessible
3. Verify backend URL is correct (no typos)

### Variables not working?

1. Make sure they start with `VITE_` prefix
2. Redeploy after adding variables (they're baked into the build)
3. Check for typos in variable names
4. Verify they're set for the correct environment (Production)

