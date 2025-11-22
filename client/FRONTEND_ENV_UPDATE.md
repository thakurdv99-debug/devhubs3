# Frontend Environment Variables Update Guide

## 🚀 Quick Update Instructions

To update your frontend `.env` file with your backend public URL:

### **Step 1: Update Backend URLs**

Open `devhub2/client/.env` and update these variables:

```env
# Replace with your actual backend public URL
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_SERVER=https://your-backend-url.com

# These will automatically use VITE_API_URL if not set separately
VITE_ACCOUNT_CREATION_API=https://your-backend-url.com/api/user
VITE_LOGIN_API=https://your-backend-url.com/api/login
VITE_GITHUB_LOGIN_API=https://your-backend-url.com/api/github/login
```

### **Step 2: Example URLs**

**If your backend is on Railway:**
```env
VITE_API_URL=https://your-app-name.railway.app
VITE_SOCKET_SERVER=https://your-app-name.railway.app
```

**If your backend is on Render:**
```env
VITE_API_URL=https://your-app-name.onrender.com
VITE_SOCKET_SERVER=https://your-app-name.onrender.com
```

**If you have a custom domain:**
```env
VITE_API_URL=https://api.devhubs.in
VITE_SOCKET_SERVER=https://api.devhubs.in
```

### **Step 3: Complete .env File Template**

```env
# Backend API Configuration
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_SERVER=https://your-backend-url.com
VITE_ACCOUNT_CREATION_API=https://your-backend-url.com/api/user
VITE_LOGIN_API=https://your-backend-url.com/api/login
VITE_GITHUB_LOGIN_API=https://your-backend-url.com/api/github/login

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDv0D4PmCm2xztSIPWV3t_uuoExUXwH6LU
VITE_FIREBASE_AUTH_DOMAIN=devhubs-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=devhubs-project
VITE_FIREBASE_STORAGE_BUCKET=devhubs-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=659320333811
VITE_FIREBASE_APP_ID=1:659320333811:web:32bf805c2ef8d1ac701e86

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_RaQNtzh9mgnPza
VITE_RAZORPAY_MODE=production
VITE_MOCK_RAZORPAY=false
```

### **Step 4: For Vercel Deployment**

If deploying to Vercel, add these environment variables in Vercel Dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each `VITE_*` variable
4. Make sure to set them for **Production** environment
5. Redeploy after adding variables

### **Step 5: Verify Configuration**

After updating, restart your dev server:

```bash
cd devhub2/client
npm run dev
```

Check the browser console - you should see API configuration logs in development mode.

## ⚠️ Important Notes

1. **No trailing slashes** - Don't add `/` at the end of URLs
   - ✅ Correct: `https://api.devhubs.in`
   - ❌ Wrong: `https://api.devhubs.in/`

2. **Use HTTPS in production** - Always use `https://` for production URLs

3. **CORS Configuration** - Make sure your backend has your frontend URL in `ALLOWED_ORIGINS`

4. **Socket Server** - Should be the same URL as your API URL (same backend)

5. **Environment Variables** - In Vercel/Netlify, you need to set these in the platform's dashboard, not just in `.env`

## 🔍 Troubleshooting

### Frontend can't connect to backend

1. Check backend URL is correct (no typos)
2. Verify backend is running and accessible
3. Check CORS settings in backend
4. Verify backend has your frontend URL in `ALLOWED_ORIGINS`

### Socket connection fails

1. Ensure `VITE_SOCKET_SERVER` matches your backend URL
2. Check backend Socket.io is configured correctly
3. Verify WebSocket support on your hosting platform

### Build errors

1. Make sure all `VITE_*` variables are set
2. Check for typos in variable names
3. Restart dev server after changing `.env`

