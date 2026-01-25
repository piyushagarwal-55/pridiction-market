# 🎨 Render Deployment Guide - Bet Bazzar Backend

## Overview
Deploy your Bet Bazzar backend (FastAPI + Python) to Render with automatic deployments, free SSL, and persistent URLs.

---

## 📋 Prerequisites

- [x] GitHub account with your code pushed
- [x] Render account (free) - Sign up at https://render.com
- [x] Supabase PostgreSQL database (already configured in .env)
- [x] Backend in `apps/backend` directory

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Render Account

1. **Go to Render:**
   - Visit: https://render.com
   - Click "Get Started" or "Sign Up"
   - Choose "Continue with GitHub"
   - Authorize Render to access your repositories

2. **Free Tier Benefits:**
   - Free web services (750 hours/month)
   - Automatic SSL/HTTPS
   - Custom domains
   - Automatic deployments from GitHub

---

### Step 2: Create New Web Service

1. **Click "New +"** → **"Web Service"**

2. **Connect Repository:**
   - Find and select your `DegenHouse` repository
   - Click "Connect"

3. **Configure Service:**

   ```yaml
   Name: bet-bazzar-backend
   Region: Choose closest to your users (e.g., Oregon, Frankfurt)
   Branch: main
   Root Directory: apps/backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. **Instance Type:**
   - Select **"Free"** (enough for development/testing)
   - 512 MB RAM, 0.1 CPU
   - Spins down after 15 minutes of inactivity

---

### Step 3: Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

```bash
# Database
DATABASE_URL=postgresql://postgres:Piyush%402005%40@db.vbfixzygguccqtxfgsfl.supabase.co:5432/postgres

# CORS - Add your Vercel frontend URL after deployment
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# Optional: Redis (if using caching)
# REDIS_URL=redis://...

# Python version
PYTHON_VERSION=3.11.0
```

**Important:** After deploying your frontend to Vercel, come back and update `ALLOWED_ORIGINS` with your actual Vercel URL!

---

### Step 4: Deploy

1. **Click "Create Web Service"**

2. **Monitor Deployment:**
   - Watch the build logs in real-time
   - First deployment takes ~2-3 minutes
   - You'll see: Building → Deploying → Live

3. **Get Your URL:**
   - Format: `https://bet-bazzar-backend.onrender.com`
   - Copy this URL - you'll need it for frontend!

---

## 🔧 Post-Deployment Configuration

### Step 1: Test Your Backend

```bash
# Test health endpoint
curl https://bet-bazzar-backend.onrender.com/health

# Should return: {"status": "ok"}

# Test markets endpoint
curl https://bet-bazzar-backend.onrender.com/api/v1/markets
```

### Step 2: Update Frontend .env.local

Update `apps/frontend/.env.local`:

```env
# Replace with your Render backend URL
NEXT_PUBLIC_API_URL=https://bet-bazzar-backend.onrender.com
```

### Step 3: Enable CORS for Your Frontend

Once you deploy frontend to Vercel:

1. Go to Render Dashboard → Your Service → Environment
2. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://bet-bazzar-backend.onrender.com
   ```
3. Click "Save Changes" (auto-deploys)

---

## ⚡ Understanding Render Free Tier

### Auto-Sleep Behavior:
- **Spins down** after 15 minutes of inactivity
- **Cold start** takes 30-60 seconds when accessed
- First request after sleep will be slow
- Subsequent requests are fast

### Solutions for Cold Starts:
1. **Upgrade to Paid Plan** ($7/month) - Always on
2. **Use Cron Job** to ping every 14 minutes:
   - Use [cron-job.org](https://cron-job.org) (free)
   - Ping: `https://your-backend.onrender.com/health`
   - Schedule: Every 14 minutes
3. **Accept the trade-off** for free hosting

---

## 🔄 Automatic Deployments

Render automatically deploys when you push to GitHub:

```bash
# Make changes to backend
cd apps/backend

# Commit and push
git add .
git commit -m "Update backend API"
git push origin main

# Render automatically detects and deploys!
```

**Monitor deployments:**
- Go to Render Dashboard → Your Service
- Click "Events" to see deployment history
- Click "Logs" for runtime logs

---

## 📊 Monitoring & Logs

### View Real-Time Logs:
1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab
4. See all FastAPI logs in real-time

### Useful Log Filters:
```
Error logs: Search for "ERROR" or "Exception"
API calls: Search for "GET" or "POST"
Startup: Search for "startup"
```

---

## 🛠️ Common Issues & Solutions

### Issue 1: Build Fails - Missing Dependencies
**Error:** `Could not find a version that satisfies...`

**Solution:**
```bash
# Update requirements.txt with exact versions
cd apps/backend
pip freeze > requirements.txt
git commit -am "Update dependencies"
git push
```

---

### Issue 2: App Crashes on Start
**Error:** `Application startup failed`

**Solution:**
Check Render logs for specific error. Common fixes:
- Verify `DATABASE_URL` is correct
- Check Python version compatibility
- Ensure all required env vars are set

---

### Issue 3: CORS Errors from Frontend
**Error:** `Access-Control-Allow-Origin`

**Solution:**
Update `ALLOWED_ORIGINS` in Render environment variables:
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

---

### Issue 4: Database Connection Issues
**Error:** `could not connect to server`

**Solution:**
1. Verify Supabase database is running
2. Check `DATABASE_URL` format is correct:
   ```
   postgresql://USER:PASSWORD@HOST:5432/DATABASE
   ```
3. Ensure password special characters are URL-encoded:
   - `@` → `%40`
   - `#` → `%23`
   - `!` → `%21`

---

## 🔒 Security Best Practices

1. **Never commit sensitive data:**
   - Keep `.env` files in `.gitignore`
   - Use Render environment variables

2. **Use Environment Variables:**
   - Database credentials
   - API keys
   - Secret keys

3. **Enable HTTPS Only:**
   - Render provides automatic SSL
   - No configuration needed

4. **Restrict CORS:**
   - Only allow your frontend domain
   - Don't use `*` in production

---

## 💰 Cost Breakdown

### Free Tier:
- **Cost:** $0/month
- **Limits:** 750 hours/month, auto-sleep after 15 min
- **Perfect for:** Development, testing, demos

### Starter Plan:
- **Cost:** $7/month
- **Benefits:** Always on, no cold starts
- **Perfect for:** Production apps with consistent traffic

### Pro Features:
- **Cost:** $25+/month
- **Benefits:** More resources, scaling, priority support
- **Perfect for:** High-traffic production apps

---

## 🎯 Next Steps

1. ✅ **Backend Deployed on Render**
2. 🔄 **Deploy Frontend on Vercel** (see [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md))
3. 🔗 **Connect Frontend to Backend** (update env vars)
4. 🧪 **Test Full Stack** (frontend → backend → database)
5. 🚀 **Share Your App!**

---

## 📚 Additional Resources

- **Render Docs:** https://render.com/docs
- **FastAPI Deployment:** https://fastapi.tiangolo.com/deployment/
- **Supabase Integration:** https://supabase.com/docs

---

## 🆘 Need Help?

- **Render Community:** https://community.render.com
- **Check Logs:** Render Dashboard → Your Service → Logs
- **Deployment Issues:** Review build logs for specific errors

---

**Happy Deploying! 🎉**

Your backend will be live at: `https://bet-bazzar-backend.onrender.com`
