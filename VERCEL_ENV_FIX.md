# URGENT: Fix Double Slash Error in Production

## Problem
The frontend is making requests to `https://devhubs4-production.up.railway.app//api/getuser` (notice the double slash `//`), causing 404 errors.

## Root Cause
The `VITE_API_URL` environment variable in Vercel likely has a trailing slash, or the frontend build needs to be redeployed with the fix.

## Immediate Fix Steps

### Step 1: Check Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (www.devhubs.in)
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL`
5. **Check if it has a trailing slash**

**Current (WRONG):**
```
VITE_API_URL=https://devhubs4-production.up.railway.app/
```

**Should be (CORRECT):**
```
VITE_API_URL=https://devhubs4-production.up.railway.app
```

### Step 2: Fix the Environment Variable

1. Click on `VITE_API_URL` to edit
2. Remove any trailing slash (`/`) at the end
3. Make sure it's set for **Production** environment
4. Save

### Step 3: Redeploy Frontend

After fixing the environment variable:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. OR push a new commit to trigger automatic deployment

### Step 4: Verify

After redeployment:

1. Open `https://www.devhubs.in` in browser
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Try to log in
5. Check the API request - it should be:
   - ✅ `https://devhubs4-production.up.railway.app/api/getuser` (single slash)
   - ❌ NOT `https://devhubs4-production.up.railway.app//api/getuser` (double slash)

## Alternative: Use Code Fix (Already Applied)

The code has been updated to normalize URLs automatically, but you still need to:

1. **Redeploy the frontend** so the new code is used
2. **Fix the Vercel environment variable** to remove trailing slash (best practice)

## All Environment Variables to Check

Make sure these are set correctly in Vercel (no trailing slashes):

```env
VITE_API_URL=https://devhubs4-production.up.railway.app
VITE_SOCKET_SERVER=https://devhubs4-production.up.railway.app
```

**NOT:**
```env
VITE_API_URL=https://devhubs4-production.up.railway.app/
VITE_SOCKET_SERVER=https://devhubs4-production.up.railway.app/
```

## Why This Happens

- Vercel environment variables might have been set with trailing slashes
- The old code didn't normalize URLs before using them
- The new code normalizes URLs, but needs a redeploy to take effect

## Quick Test

After fixing, test the backend directly:
```
https://devhubs4-production.up.railway.app/api/health
```

Should return: `{ status: 'OK' }`

