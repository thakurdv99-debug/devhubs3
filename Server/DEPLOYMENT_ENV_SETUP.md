# Deployment Environment Variables Setup Guide

## 🚨 Critical: Required Environment Variables

Your backend deployment **requires** the following environment variables to start:

### **Required Variables (Must Have)**

1. **`JWT_SECRET`**
   - Description: Secret key for JWT token signing
   - Minimum length: 32 characters
   - Example: `your_super_secret_jwt_key_minimum_32_characters_long`
   - **⚠️ Generate a strong random string for production**

2. **`MONGODB_URI`**
   - Description: MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/devhubs?retryWrites=true&w=majority`

## 📋 How to Set Environment Variables by Platform

### **Railway**
1. Go to your project dashboard
2. Click on your backend service
3. Go to the **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - Key: `JWT_SECRET`
   - Value: `your_secret_here`
6. Repeat for `MONGODB_URI` and other variables
7. **Redeploy** after adding variables

### **Render**
1. Go to your service dashboard
2. Click on **Environment** in the left sidebar
3. Click **Add Environment Variable**
4. Add each variable:
   - Key: `JWT_SECRET`
   - Value: `your_secret_here`
5. Repeat for all required variables
6. **Redeploy** after adding variables

### **Heroku**
```bash
heroku config:set JWT_SECRET=your_secret_here
heroku config:set MONGODB_URI=your_mongodb_uri_here
```

Or via Dashboard:
1. Go to your app settings
2. Click **Reveal Config Vars**
3. Add each variable
4. Save and restart

### **Docker / Docker Compose**
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - JWT_SECRET=your_secret_here
      - MONGODB_URI=your_mongodb_uri_here
      - NODE_ENV=production
```

Or using `-e` flags:
```bash
docker run -e JWT_SECRET=your_secret -e MONGODB_URI=your_uri your-image
```

### **Vercel / Netlify (Serverless)**
1. Go to project settings
2. Navigate to **Environment Variables**
3. Add each variable for **Production** environment
4. Redeploy

## 🔐 Complete Environment Variables List

See `.env.example` file for the complete list of all environment variables.

### **Minimum Required for Startup:**
- `JWT_SECRET` ✅
- `MONGODB_URI` ✅

### **Recommended for Full Functionality:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ALLOWED_ORIGINS`
- `CLIENT_URL`

## ✅ Verification

After setting environment variables:

1. **Check deployment logs** - Should not show "Missing required environment variables" error
2. **Test health endpoint** - `GET /api/health` should return `{ status: 'ok' }`
3. **Check server logs** - Should show successful database connection

## 🆘 Troubleshooting

### Error: "Missing required environment variables: JWT_SECRET, MONGODB_URI"

**Solution:**
1. Verify variables are set in your deployment platform
2. Check variable names match exactly (case-sensitive)
3. Ensure no extra spaces in variable values
4. Restart/redeploy after adding variables
5. Check deployment logs for any other errors

### Variables Not Loading

**Common Issues:**
- Variables set in wrong environment (e.g., only in development, not production)
- Variable names have typos
- Values contain special characters that need escaping
- Platform requires restart after adding variables

### Generate Strong JWT_SECRET

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## 📝 Quick Setup Checklist

- [ ] Set `JWT_SECRET` (minimum 32 characters)
- [ ] Set `MONGODB_URI` (valid MongoDB connection string)
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT` (if different from default 5001)
- [ ] Set Firebase credentials (if using Firebase features)
- [ ] Set GitHub OAuth credentials (if using GitHub login)
- [ ] Set Razorpay credentials (if using payments)
- [ ] Set `ALLOWED_ORIGINS` (comma-separated list of frontend URLs)
- [ ] Redeploy after setting all variables
- [ ] Verify deployment logs show no errors
- [ ] Test health endpoint

## 🔗 Related Documentation

- See `PRODUCTION_DEPLOYMENT.md` for full deployment guide
- See `.env.example` for all available environment variables
- See `SETUP_GUIDE.md` for local development setup

