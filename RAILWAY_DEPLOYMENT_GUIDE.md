# 🚂 Railway Deployment Guide - Bet Bazzar Backend

## Overview
Deploy your Bet Bazzar backend (FastAPI + Python) to Railway in under 10 minutes.

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Railway account (free) - Sign up at https://railway.app
- [ ] Your code pushed to GitHub
- [ ] Frontend deployed on Vercel (or note the URL)

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Railway Account

1. **Go to Railway:**
   - Visit: https://railway.app/
   - Click "Login" → "Login with GitHub"
   - Authorize Railway

2. **Start Free Trial:**
   - Get $5 free credit/month
   - No credit card required
   - Enough for development and testing

---

### Step 2: Create New Project

1. **Click "New Project"**

2. **Choose "Deploy from GitHub repo"**

3. **Select Repository:**
   - Choose your `bet-bazzar` repository
   - Click "Deploy Now"

4. **Configure Service:**
   ```
   Service Name: bet-bazzar-backend
   Root Directory: apps/backend
   ```

---

### Step 3: Add PostgreSQL Database

1. **In your project, click "New"**

2. **Select "Database" → "Add PostgreSQL"**

3. **Railway will:**
   - Create a PostgreSQL instance
   - Generate `DATABASE_URL` automatically
   - Link it to your backend service

---

### Step 4: Configure Backend Service

1. **Click on your backend service**

2. **Go to "Settings" tab:**
   ```
   Root Directory: apps/backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Go to "Variables" tab and add:**

```bash
# Database (automatically provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS - Add your Vercel URL
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# Environment
ENVIRONMENT=production
DEBUG=false

# Gemini AI (for bot)
GEMINI_API_KEY=AIzaSyDFS8umhNSmp38Hw4Zk2gDAG1c-l93vuu0

# Bot Configuration
BOT_CHECK_INTERVAL=60
BOT_MIN_CONFIDENCE=0.7
BOT_MAX_BET_AMOUNT=100

# Optional: Redis (if using)
# REDIS_URL=redis://...
```

**Important:**
- Replace `https://your-app.vercel.app` with your actual Vercel URL
- `DATABASE_URL` is automatically set by Railway when you add PostgreSQL
- `PORT` is automatically set by Railway

---

### Step 5: Deploy

1. **Railway will automatically deploy**
   - Watch the build logs
   - Takes 2-5 minutes

2. **Get Your Backend URL:**
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - You'll get a URL like:
   ```
   https://bet-bazzar-backend-production.up.railway.app
   ```

3. **Note this URL** - you'll need it for frontend!

---

### Step 6: Update Frontend

1. **Go to Vercel Dashboard**

2. **Update Environment Variable:**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

3. **Redeploy Frontend**

---

### Step 7: Update Backend CORS

1. **In Railway, update `ALLOWED_ORIGINS`:**
   ```bash
   ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app,http://localhost:3000
   ```

2. **Railway will auto-redeploy**

---

## ✅ Verification

### Test Your Backend:

1. **Health Check:**
   ```bash
   curl https://your-backend.railway.app/health
   ```
   Expected: `{"status":"healthy"}`

2. **Root Endpoint:**
   ```bash
   curl https://your-backend.railway.app/
   ```
   Expected:
   ```json
   {
     "message": "Chainlink Sportsbook Backend",
     "x402": "ready",
     "chainlink": "ready",
     "cronos": "ready"
   }
   ```

3. **API Docs:**
   ```
   https://your-backend.railway.app/docs
   ```
   Should show FastAPI Swagger UI

4. **Test Prediction Markets:**
   ```bash
   curl https://your-backend.railway.app/api/v1/predictions/markets
   ```

5. **Test Bot Status:**
   ```bash
   curl https://your-backend.railway.app/api/v1/bot/status
   ```

---

## 🔧 Troubleshooting

### Build Fails

**Error: "requirements.txt not found"**
```bash
# Solution: Check Root Directory setting
# Should be: apps/backend
```

**Error: "Module not found"**
```bash
# Solution: Add missing package to requirements.txt
# Then push to GitHub (Railway auto-redeploys)
```

### Service Won't Start

**Error: "Port already in use"**
```bash
# Solution: Use Railway's $PORT variable
# Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Error: "Database connection failed"**
```bash
# Solution: 
# 1. Ensure PostgreSQL service is running
# 2. Check DATABASE_URL variable is set
# 3. Verify database is linked to backend service
```

### CORS Errors

**Error: "CORS policy blocked"**
```bash
# Solution: Update ALLOWED_ORIGINS
# Include your Vercel URL without trailing slash
# Example: https://bet-bazzar.vercel.app
```

### Bot Not Starting

**Error: "No module named 'google'"**
```bash
# Solution: Add to requirements.txt:
google-generativeai==0.8.3

# Or use the new package:
google-genai==0.1.0
```

---

## 📊 Database Management

### Access Database:

1. **In Railway Dashboard:**
   - Click on PostgreSQL service
   - Go to "Data" tab
   - View tables and data

2. **Connect with psql:**
   ```bash
   # Get DATABASE_URL from Railway
   psql "postgresql://..."
   ```

3. **Run Migrations:**
   ```bash
   # From Railway CLI
   railway run python -c "from app.db import init_db; init_db()"
   ```

---

## 💰 Cost Management

### Free Tier:
- $5 credit/month
- ~500 hours of usage
- Enough for development

### Monitor Usage:
1. Go to "Usage" tab
2. Check credit consumption
3. Set up alerts

### Optimize Costs:
- Use sleep mode for dev environments
- Scale down when not in use
- Monitor logs for errors

---

## 🔄 Continuous Deployment

### Automatic Deployments:

Railway automatically deploys when you push to GitHub:

```bash
# Make changes to backend
cd apps/backend
# Edit files...

# Commit and push
git add .
git commit -m "Update API endpoint"
git push

# Railway deploys automatically!
```

### Manual Redeploy:
- Click "Deploy" button in Railway dashboard
- Useful for testing without code changes

---

## 📝 Environment Variables Reference

### Required:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-set by Railway
ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
ENVIRONMENT=production
```

### Optional:
```bash
DEBUG=false
GEMINI_API_KEY=your-key
BOT_CHECK_INTERVAL=60
BOT_MIN_CONFIDENCE=0.7
BOT_MAX_BET_AMOUNT=100
REDIS_URL=redis://...  # If using Redis
```

### Auto-Provided by Railway:
```bash
PORT  # Don't set manually!
RAILWAY_ENVIRONMENT
RAILWAY_PROJECT_ID
RAILWAY_SERVICE_ID
```

---

## 🎨 Custom Domain (Optional)

### Add Your Own Domain:

1. **In Railway Dashboard:**
   - Go to "Settings" → "Networking"
   - Click "Custom Domain"
   - Enter your domain (e.g., `api.betbazzar.com`)

2. **Update DNS:**
   - Add CNAME record pointing to Railway domain
   - Wait for DNS propagation (5-30 minutes)

3. **Update Frontend:**
   ```bash
   NEXT_PUBLIC_API_URL=https://api.betbazzar.com
   ```

---

## 📊 Monitoring & Logs

### View Logs:

1. **In Railway Dashboard:**
   - Click on service
   - Go to "Deployments" tab
   - Click on latest deployment
   - View build and runtime logs

2. **Filter Logs:**
   - Search for errors
   - Filter by time
   - Download logs

### Common Log Messages:

**Success:**
```
🚀 Sportsbook Backend starting...
INFO: Application startup complete
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Errors to Watch:**
```
ERROR: Database connection failed
ERROR: Module not found
ERROR: Port already in use
```

---

## 🔐 Security Best Practices

### Environment Variables:
- ✅ Never commit `.env` files
- ✅ Use Railway's variable management
- ✅ Rotate API keys regularly

### CORS:
- ✅ Only allow specific domains
- ✅ Don't use `*` in production
- ✅ Update when adding new frontends

### Database:
- ✅ Use Railway's managed PostgreSQL
- ✅ Enable backups
- ✅ Don't expose DATABASE_URL publicly

---

## 🎯 Next Steps

After backend is deployed:

1. ✅ Note your Railway URL
2. 🔗 Update frontend `NEXT_PUBLIC_API_URL`
3. 🔄 Redeploy frontend on Vercel
4. 🧪 Test all API endpoints
5. 🎉 Your app is live!

---

## 📝 Deployment Checklist

- [ ] Railway account created
- [ ] Project created from GitHub
- [ ] Root directory set to `apps/backend`
- [ ] PostgreSQL database added
- [ ] All environment variables set
- [ ] `ALLOWED_ORIGINS` includes Vercel URL
- [ ] Build successful
- [ ] Service running
- [ ] Domain generated
- [ ] Health check passes
- [ ] API docs accessible
- [ ] Frontend updated with Railway URL
- [ ] CORS working
- [ ] All endpoints tested
- [ ] Bot service running (if enabled)

---

## 🆘 Need Help?

### Railway Support:
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app/
- Status: https://status.railway.app/

### Common Issues:

**Q: Build is slow**
A: First build takes longer. Subsequent builds are cached.

**Q: Service keeps crashing**
A: Check logs for errors. Verify all dependencies are installed.

**Q: Database connection fails**
A: Ensure PostgreSQL service is running and DATABASE_URL is set.

**Q: Out of credits**
A: Upgrade to paid plan or optimize usage.

---

## 🎉 Success!

Your backend is now live at:
```
https://your-backend.railway.app
```

API Documentation:
```
https://your-backend.railway.app/docs
```

Your full stack is deployed! 🚀

