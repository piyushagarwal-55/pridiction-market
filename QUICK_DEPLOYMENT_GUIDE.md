# ⚡ Quick Deployment Guide - 15 Minutes to Live!

## 🎯 Goal
Get Bet Bazzar live on the internet in 15 minutes.

---

## 📋 What You Need

- [ ] GitHub account
- [ ] Vercel account (free) - https://vercel.com
- [ ] Railway account (free) - https://railway.app
- [ ] 15 minutes

---

## 🚀 Step-by-Step (15 Minutes)

### ⏱️ Minutes 1-3: Push to GitHub

```bash
cd C:\Users\LENOVO\Desktop\DegenHouse

# Add all files
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/bet-bazzar.git
git branch -M main
git push -u origin main
```

---

### ⏱️ Minutes 4-7: Deploy Backend (Railway)

1. **Go to Railway.app** → Login with GitHub

2. **New Project** → "Deploy from GitHub repo"

3. **Select your repo** → Deploy

4. **Add PostgreSQL:**
   - Click "New" → "Database" → "PostgreSQL"

5. **Configure Service:**
   - Click backend service
   - Settings → Root Directory: `apps/backend`
   - Variables → Add:
   ```
   ALLOWED_ORIGINS=http://localhost:3000
   ENVIRONMENT=production
   GEMINI_API_KEY=AIzaSyDFS8umhNSmp38Hw4Zk2gDAG1c-l93vuu0
   ```

6. **Generate Domain:**
   - Settings → Networking → "Generate Domain"
   - **Copy this URL!** (e.g., `https://xxx.railway.app`)

---

### ⏱️ Minutes 8-12: Deploy Frontend (Vercel)

1. **Go to Vercel.com** → Login with GitHub

2. **Add New Project** → Import your repo

3. **Configure:**
   ```
   Framework: Next.js
   Root Directory: apps/frontend
   ```

4. **Environment Variables** (click "Add"):
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
   DATABASE_URL=postgresql://postgres:Piyush%402005%40@db.vbfixzygguccqtxfgsfl.supabase.co:5432/postgres
   NEXT_PUBLIC_CHAIN_ID=10143
   NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
   NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
   NEXT_PUBLIC_CASINO_ADDRESS=0x9d95C1fd002A6d4732F081Fa7ccd7dF9dA0153EF
   NEXT_PUBLIC_USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
   NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS=0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA
   NEXT_PUBLIC_BOT_SETTINGS_ADDRESS=0xEBE6E13c31b23347F69c1b31fAdB0335063E224b
   NEXT_PUBLIC_REOWN_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
   NEYNAR_API_KEY=A05C9F7E-86A1-4B1C-A48A-012E761110C4
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. **Deploy!**
   - Wait 2-3 minutes
   - **Copy your Vercel URL!** (e.g., `https://xxx.vercel.app`)

---

### ⏱️ Minutes 13-15: Connect Everything

1. **Update Railway CORS:**
   - Go to Railway → Backend service → Variables
   - Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-vercel-url.vercel.app,http://localhost:3000
   ```

2. **Update Vercel URL:**
   - Go to Vercel → Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
   - Click "Redeploy"

3. **Test Everything:**
   - Visit your Vercel URL
   - Try connecting wallet
   - Check prediction markets
   - Test casino games

---

## ✅ Verification Checklist

Visit your Vercel URL and check:

- [ ] Home page loads
- [ ] Wallet connect button works
- [ ] Prediction markets page loads
- [ ] Casino page loads
- [ ] Bot settings page loads
- [ ] No console errors

Test backend:
```bash
curl https://your-railway-url.railway.app/health
```
Should return: `{"status":"healthy"}`

---

## 🎉 You're Live!

**Frontend:** `https://your-app.vercel.app`
**Backend:** `https://your-backend.railway.app`
**API Docs:** `https://your-backend.railway.app/docs`

---

## 🔧 Quick Fixes

### Frontend shows "Failed to fetch"
```bash
# Check NEXT_PUBLIC_API_URL is correct
# Check backend is running
# Check CORS settings in Railway
```

### Backend not responding
```bash
# Check Railway logs
# Verify DATABASE_URL is set
# Check service is running
```

### Wallet won't connect
```bash
# Check NEXT_PUBLIC_REOWN_PROJECT_ID is set
# Check NEXT_PUBLIC_CHAIN_ID is 10143
# Try different wallet
```

---

## 📝 URLs to Save

After deployment, save these:

```
Frontend: https://_________________.vercel.app
Backend: https://_________________.railway.app
API Docs: https://_________________.railway.app/docs
GitHub: https://github.com/_________________/bet-bazzar
```

---

## 🎯 Next Steps

Now that you're live:

1. **Test Farcaster Frames:**
   ```
   https://your-app.vercel.app/api/frames/market/bet-bazzar-launch/image
   ```

2. **Share on Farcaster:**
   - Go to Warpcast
   - Share your market URLs
   - Test Frame interactions

3. **Monitor:**
   - Check Vercel analytics
   - Watch Railway logs
   - Monitor user activity

4. **Iterate:**
   - Fix bugs
   - Add features
   - Push to GitHub (auto-deploys!)

---

## 💡 Pro Tips

### Auto-Deploy on Push:
```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Both Vercel and Railway deploy automatically!
```

### Preview Deployments:
- Create a branch
- Push to GitHub
- Get preview URL
- Test before merging

### Environment Variables:
- Production: Set in Vercel/Railway
- Development: Use `.env.local`
- Never commit secrets!

---

## 🆘 Need Help?

### Detailed Guides:
- Frontend: See `VERCEL_DEPLOYMENT_GUIDE.md`
- Backend: See `RAILWAY_DEPLOYMENT_GUIDE.md`

### Support:
- Vercel: https://vercel.com/support
- Railway: https://discord.gg/railway

---

## 🎊 Congratulations!

Your Bet Bazzar is now live and accessible to anyone on the internet!

Share it:
- On Farcaster (with Frames!)
- On Twitter
- With your team
- At the hackathon

**You did it! 🚀**

