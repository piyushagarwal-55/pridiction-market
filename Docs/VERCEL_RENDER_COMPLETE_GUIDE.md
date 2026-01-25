# 🚀 Complete Deployment Guide - Vercel + Render

## Overview
Deploy your full-stack Bet Bazzar application in under 20 minutes:
- **Frontend (Next.js)** → Vercel
- **Backend (FastAPI)** → Render
- **Database** → Supabase (already configured)

---

## 📋 Prerequisites Checklist

- [ ] GitHub account with code pushed
- [ ] Vercel account - https://vercel.com
- [ ] Render account - https://render.com
- [ ] Supabase database (already configured ✅)
- [ ] WalletConnect Project ID (already have ✅)
- [ ] All smart contracts deployed to Monad Testnet (already done ✅)

---

## 🎯 Deployment Strategy

### Architecture:
```
Frontend (Next.js)
    ↓
Vercel Edge Network
    ↓
Backend (FastAPI) on Render
    ↓
Supabase PostgreSQL
    ↓
Monad Testnet Smart Contracts
```

### Why This Stack:
- **Vercel:** Best Next.js hosting, global CDN, automatic HTTPS
- **Render:** Python-optimized, free tier, auto-deployments
- **Supabase:** Managed PostgreSQL, connection pooling
- **Monad:** Already deployed contracts

---

## 🎬 Step-by-Step Deployment

## PART 1: Deploy Backend to Render (10 mins)

### Step 1: Create Render Web Service

1. **Login to Render:**
   - Go to https://render.com
   - Sign up with GitHub
   - Authorize repository access

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Select your `DegenHouse` repository
   - Click "Connect"

3. **Configure Service:**
   ```yaml
   Name: bet-bazzar-backend
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: apps/backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   Instance Type: Free
   ```

### Step 2: Add Environment Variables

Click "Advanced" and add these variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:Piyush%402005%40@db.vbfixzygguccqtxfgsfl.supabase.co:5432/postgres

# CORS (will update after Vercel deployment)
ALLOWED_ORIGINS=http://localhost:3000

# Python Version
PYTHON_VERSION=3.11.0
```

### Step 3: Deploy Backend

1. Click "Create Web Service"
2. Wait 2-3 minutes for build and deployment
3. **Copy your backend URL:** `https://bet-bazzar-backend.onrender.com`
4. **Test it:**
   ```bash
   curl https://bet-bazzar-backend.onrender.com/health
   # Should return: {"status": "ok"}
   ```

✅ **Backend is now live!**

---

## PART 2: Deploy Frontend to Vercel (10 mins)

### Step 1: Prepare Frontend Environment

Update `apps/frontend/.env.local` with your Render backend URL:

```env
# Backend API URL - YOUR RENDER URL
NEXT_PUBLIC_API_URL=https://bet-bazzar-backend.onrender.com

# Database
DATABASE_URL=postgresql://postgres:Piyush%402005%40@db.vbfixzygguccqtxfgsfl.supabase.co:5432/postgres

# Blockchain (already configured)
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME="Monad Testnet"
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CRONOS_RPC=https://testnet-rpc.monad.xyz

# Smart Contracts (already deployed)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
NEXT_PUBLIC_CASINO_ADDRESS=0x9d95C1fd002A6d4732F081Fa7ccd7dF9dA0153EF
NEXT_PUBLIC_USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS=0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA
NEXT_PUBLIC_BOT_SETTINGS_ADDRESS=0xEBE6E13c31b23347F69c1b31fAdB0335063E224b

# WalletConnect
NEXT_PUBLIC_REOWN_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_UPDATES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Farcaster
NEYNAR_API_KEY=A05C9F7E-86A1-4B1C-A48A-012E761110C4
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Note:** We'll update `NEXT_PUBLIC_APP_URL` after deployment!

### Step 2: Commit Changes

```bash
cd C:\Users\LENOVO\Desktop\DegenHouse
git add apps/frontend/.env.local
git commit -m "Configure for Vercel + Render deployment"
git push origin main
```

### Step 3: Deploy to Vercel

1. **Login to Vercel:**
   - Go to https://vercel.com
   - Click "Sign Up" with GitHub
   - Authorize Vercel

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select your `DegenHouse` repository
   - Click "Import"

3. **Configure Project:**
   ```yaml
   Framework Preset: Next.js (auto-detected)
   Root Directory: apps/frontend
   Build Command: npm run build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: npm install (auto-detected)
   ```

4. **Add Environment Variables:**
   
   Click "Environment Variables" and add ALL variables from your `.env.local` file:

   ```
   NEXT_PUBLIC_API_URL=https://bet-bazzar-backend.onrender.com
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_CHAIN_ID=10143
   NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
   NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
   NEXT_PUBLIC_CRONOS_RPC=https://testnet-rpc.monad.xyz
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
   NEXT_PUBLIC_CASINO_ADDRESS=0x9d95C1fd002A6d4732F081Fa7ccd7dF9dA0153EF
   NEXT_PUBLIC_USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
   NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS=0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA
   NEXT_PUBLIC_BOT_SETTINGS_ADDRESS=0xEBE6E13c31b23347F69c1b31fAdB0335063E224b
   NEXT_PUBLIC_REOWN_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
   NEXT_PUBLIC_ENABLE_LIVE_UPDATES=true
   NEXT_PUBLIC_ENABLE_ANALYTICS=false
   NEYNAR_API_KEY=A05C9F7E-86A1-4B1C-A48A-012E761110C4
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - **Copy your Vercel URL:** `https://bet-bazzar.vercel.app`

✅ **Frontend is now live!**

---

## PART 3: Connect Frontend ↔ Backend

### Step 1: Update Backend CORS

1. **Go to Render Dashboard:**
   - Navigate to your backend service
   - Click "Environment"
   - Find `ALLOWED_ORIGINS`

2. **Update CORS to include Vercel URL:**
   ```bash
   ALLOWED_ORIGINS=https://bet-bazzar.vercel.app,https://bet-bazzar-backend.onrender.com,http://localhost:3000
   ```

3. **Save Changes** (Render auto-deploys)

### Step 2: Update Frontend APP_URL

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Click "Settings" → "Environment Variables"
   - Find `NEXT_PUBLIC_APP_URL`

2. **Update with your Vercel URL:**
   ```
   NEXT_PUBLIC_APP_URL=https://bet-bazzar.vercel.app
   ```

3. **Redeploy:**
   - Go to "Deployments"
   - Click "..." → "Redeploy"

✅ **Frontend and Backend are now connected!**

---

## 🧪 Testing Your Deployment

### Test 1: Frontend Loads
```bash
# Visit your Vercel URL
https://bet-bazzar.vercel.app

# Should see: Your app homepage
```

### Test 2: Backend API Works
```bash
# Test backend directly
curl https://bet-bazzar-backend.onrender.com/api/v1/markets

# Should return: JSON array of markets
```

### Test 3: Frontend → Backend Connection
```bash
# In browser console on your Vercel site:
fetch('https://bet-bazzar-backend.onrender.com/api/v1/markets')
  .then(r => r.json())
  .then(console.log)

# Should return: Markets data (no CORS errors)
```

### Test 4: Wallet Connection
1. Visit your Vercel URL
2. Click "Connect Wallet"
3. Connect with MetaMask
4. Switch to Monad Testnet
5. Should connect successfully

### Test 5: Place a Bet
1. Navigate to a market
2. Select YES or NO
3. Enter amount
4. Confirm transaction
5. Transaction should succeed

---

## 📊 Monitoring & Maintenance

### View Frontend Logs:
1. Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click latest deployment → "Functions" → View logs

### View Backend Logs:
1. Render Dashboard → Your Service
2. Click "Logs" tab
3. See real-time FastAPI logs

### Monitor Database:
1. Supabase Dashboard
2. Click "Database"
3. View active connections and queries

---

## ⚡ Performance Optimization

### Frontend (Vercel):
- ✅ Automatic edge caching
- ✅ Image optimization
- ✅ Static generation where possible
- ✅ Global CDN

### Backend (Render):
- ⚠️ Free tier sleeps after 15 min inactivity
- ⚠️ First request after sleep: 30-60s
- ✅ Subsequent requests: Fast

### Solutions for Backend Cold Starts:
1. **Upgrade to Render Paid Plan** ($7/mo) - Always on
2. **Use Cron Job** to keep alive:
   - Setup at [cron-job.org](https://cron-job.org)
   - Ping: `https://bet-bazzar-backend.onrender.com/health`
   - Every 14 minutes
3. **Accept the trade-off** for free hosting

---

## 🔄 Continuous Deployment

Both services auto-deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys frontend
# Render automatically deploys backend
```

### Monitor Deployments:
- **Vercel:** Dashboard → Deployments (see build logs)
- **Render:** Dashboard → Events (see deployment history)

---

## 🛠️ Common Issues & Solutions

### Issue 1: CORS Errors
**Error:** `Access to fetch... has been blocked by CORS`

**Solution:**
```bash
# Update Render ALLOWED_ORIGINS to include:
ALLOWED_ORIGINS=https://bet-bazzar.vercel.app,https://bet-bazzar-backend.onrender.com
```

---

### Issue 2: Backend Cold Start (First Request Slow)
**Error:** Request times out or takes 60+ seconds

**Solution:**
- First request after 15 min sleep is slow (expected)
- Use [cron-job.org](https://cron-job.org) to ping every 14 min
- Or upgrade to Render paid plan ($7/mo)

---

### Issue 3: Environment Variables Not Working
**Error:** `undefined` or missing config

**Solution:**
1. Verify all env vars are set in Vercel Dashboard
2. Ensure `NEXT_PUBLIC_` prefix for client-side vars
3. Redeploy after adding env vars

---

### Issue 4: Database Connection Fails
**Error:** `could not connect to database`

**Solution:**
1. Check Supabase is running
2. Verify `DATABASE_URL` is correct
3. Ensure password is URL-encoded:
   - `@` → `%40`
   - `#` → `%23`

---

### Issue 5: Wallet Connection Issues
**Error:** Cannot connect wallet or wrong network

**Solution:**
1. Verify `NEXT_PUBLIC_REOWN_PROJECT_ID` is set
2. Check `NEXT_PUBLIC_CHAIN_ID=10143`
3. Ensure `NEXT_PUBLIC_RPC_URL` is correct
4. Add Monad Testnet to MetaMask manually if needed

---

## 💰 Cost Breakdown

### Current Setup (Free):
| Service | Cost | Limits |
|---------|------|--------|
| Vercel | $0/mo | 100 GB bandwidth, unlimited sites |
| Render | $0/mo | 750 hrs/mo, sleeps after 15 min |
| Supabase | $0/mo | 500 MB database, 2 GB bandwidth |
| **Total** | **$0/mo** | Perfect for development & demos |

### Production Setup (Recommended):
| Service | Cost | Benefits |
|---------|------|----------|
| Vercel Pro | $20/mo | More bandwidth, team features |
| Render Starter | $7/mo | Always on, no cold starts |
| Supabase Pro | $25/mo | 8 GB database, daily backups |
| **Total** | **$52/mo** | Production-ready, reliable |

---

## 🎯 Post-Deployment Checklist

- [ ] Frontend accessible at Vercel URL
- [ ] Backend API responding at Render URL
- [ ] CORS configured correctly
- [ ] All environment variables set
- [ ] Wallet connection works
- [ ] Can place bets successfully
- [ ] Database queries working
- [ ] Real-time updates functioning
- [ ] Farcaster integration working (if enabled)

---

## 🚀 You're Live!

**Your deployed app:**
- Frontend: `https://bet-bazzar.vercel.app`
- Backend: `https://bet-bazzar-backend.onrender.com`
- Database: Supabase (connected)
- Smart Contracts: Monad Testnet (deployed)

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **FastAPI Deployment:** https://fastapi.tiangolo.com/deployment/

---

## 🆘 Need Help?

1. **Check Logs:**
   - Vercel: Dashboard → Deployments → View Function Logs
   - Render: Dashboard → Logs

2. **Test Endpoints:**
   ```bash
   # Backend health
   curl https://bet-bazzar-backend.onrender.com/health
   
   # Markets API
   curl https://bet-bazzar-backend.onrender.com/api/v1/markets
   ```

3. **Community Support:**
   - Vercel: https://github.com/vercel/vercel/discussions
   - Render: https://community.render.com

---

**Congratulations! Your full-stack Bet Bazzar is now live! 🎉**

Share your app and start taking bets on Monad Testnet!
