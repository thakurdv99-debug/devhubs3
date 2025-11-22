# Production Deployment Checklist

This document provides a comprehensive checklist for deploying the DevHubs application to production.

## Pre-Deployment Checklist

### Environment Variables

#### Frontend (.env)
- [ ] `VITE_API_URL` - Production API URL (e.g., https://api.devhubs.in)
- [ ] `VITE_SOCKET_SERVER` - Production Socket server URL
- [ ] `VITE_FIREBASE_API_KEY` - Firebase API key
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- [ ] `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- [ ] `VITE_FIREBASE_APP_ID` - Firebase app ID
- [ ] `VITE_RAZORPAY_KEY_ID` - Razorpay key ID
- [ ] `VITE_MOCK_RAZORPAY=false` - Must be false in production
- [ ] `VITE_SENTRY_DSN` - (Optional) Sentry DSN for error tracking
- [ ] `VITE_SENTRY_ENVIRONMENT=production` - Sentry environment

#### Backend (.env)
- [ ] `NODE_ENV=production` - Must be set to production
- [ ] `PORT` - Server port (default: 5000)
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Strong JWT secret (minimum 32 characters)
- [ ] `FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `FIREBASE_PRIVATE_KEY` - Firebase private key
- [ ] `FIREBASE_CLIENT_EMAIL` - Firebase client email
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- [ ] `RAZORPAY_KEY_ID` - Razorpay key ID
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay key secret
- [ ] `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- [ ] `CLIENT_URL` - Frontend URL
- [ ] `MOCK_PAYMENTS=false` - Must be false in production
- [ ] `SENTRY_DSN` - (Optional) Sentry DSN for error tracking
- [ ] `SENTRY_ENVIRONMENT=production` - Sentry environment

### Security Checklist

- [ ] All API keys and secrets are stored securely (not in code)
- [ ] JWT_SECRET is strong and unique (minimum 32 characters)
- [ ] CORS is configured with production domains only
- [ ] Rate limiting is enabled (already configured)
- [ ] Helmet security headers are enabled (already configured)
- [ ] File upload size limits are set appropriately
- [ ] Database connection string uses SSL/TLS
- [ ] All console.log statements removed (already done)
- [ ] Error messages don't expose internal details (already done)

### Build Checklist

#### Frontend
- [ ] Run `npm run build` successfully
- [ ] Verify no console.log statements in production build
- [ ] Check bundle sizes are reasonable
- [ ] Test production build locally with `npm run preview`
- [ ] Verify all environment variables are set
- [ ] Test error boundaries work correctly

#### Backend
- [ ] Run `npm install --production` (no dev dependencies)
- [ ] Test server starts successfully
- [ ] Verify database connection works
- [ ] Test health check endpoint: `/api/health`
- [ ] Verify rate limiting works
- [ ] Test CORS with production frontend URL

### Testing Checklist

- [ ] Authentication flow (login/signup)
- [ ] Payment flows (subscription, bid fee, bonus pool)
- [ ] File uploads work correctly
- [ ] Real-time chat functionality
- [ ] Project creation and management
- [ ] Bidding system
- [ ] Error handling and error boundaries

### Monitoring Setup

- [ ] Sentry error tracking configured (optional but recommended)
- [ ] Health check endpoint monitored
- [ ] Database connection monitoring
- [ ] Server uptime monitoring
- [ ] Error rate monitoring

## Deployment Steps

### 1. Frontend Deployment (Vercel/Netlify)

```bash
cd devhub2/client
npm install --legacy-peer-deps
npm run build
```

**Vercel Configuration:**
- Framework: Vite
- Build Command: `npm run build:prod`
- Install Command: `npm install --legacy-peer-deps`
- Output Directory: `dist`

**Environment Variables:**
Set all `VITE_*` variables in your hosting platform's environment settings.

### 2. Backend Deployment (Railway/Render/Heroku)

```bash
cd devhub2/Server
npm install --production
npm start
```

**Railway Configuration:**
- Build Command: (auto-detected)
- Start Command: `npm start`
- Health Check Path: `/api/health`

**Environment Variables:**
Set all backend environment variables in your hosting platform.

### 3. Post-Deployment Verification

- [ ] Frontend loads correctly
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] Database operations work
- [ ] File uploads work
- [ ] Payments work (test with small amount)
- [ ] Real-time features work
- [ ] Error tracking is working (if Sentry configured)

## Rollback Plan

If issues occur after deployment:

1. **Frontend:** Revert to previous deployment in Vercel/Netlify
2. **Backend:** Revert to previous deployment or restart with previous environment variables
3. **Database:** Restore from backup if data corruption occurred

## Monitoring and Maintenance

### Daily Checks
- [ ] Check error logs in Sentry (if configured)
- [ ] Monitor server health endpoint
- [ ] Check database connection status

### Weekly Checks
- [ ] Review error rates
- [ ] Check payment transaction logs
- [ ] Review security logs
- [ ] Check disk space usage

### Monthly Checks
- [ ] Update dependencies (security patches)
- [ ] Review and rotate secrets
- [ ] Performance optimization review
- [ ] Security audit

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` includes your frontend URL
   - Check that `NODE_ENV=production` is set

2. **Database Connection Failures**
   - Verify `MONGODB_URI` is correct
   - Check database network access
   - Verify SSL/TLS settings

3. **Payment Gateway Issues**
   - Verify Razorpay keys are correct
   - Check `MOCK_PAYMENTS=false` in production
   - Verify webhook URLs are configured

4. **Build Failures**
   - Check all environment variables are set
   - Verify Node.js version matches requirements
   - Check for missing dependencies

## Support Contacts

- Technical Issues: [Your support email]
- Payment Issues: [Payment support contact]
- Security Issues: [Security contact]

---

**Last Updated:** [Current Date]
**Version:** 1.0.0

