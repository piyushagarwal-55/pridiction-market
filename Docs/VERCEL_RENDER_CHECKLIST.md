# ✅ Vercel + Render Deployment Checklist

**Goal:** Deploy your full-stack Bet Bazzar app in 20 minutes

---

## 🎯 Quick Links
- **Vercel:** https://vercel.com
- **Render:** https://render.com
- **Full Guide:** [VERCEL_RENDER_COMPLETE_GUIDE.md](./VERCEL_RENDER_COMPLETE_GUIDE.md)

---

## PHASE 1: Backend Deployment (Render) ⏱️ 10 mins

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Created Render account
- [ ] Backend working locally: `cd apps/backend && uvicorn main:app --reload`

### Render Setup
- [ ] Created new Web Service on Render
- [ ] Connected GitHub repository
- [ ] Configured service:
  ```
  Root Directory: apps/backend
  Build: pip install -r requirements.txt
  Start: uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

### Environment Variables (Render)
- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `ALLOWED_ORIGINS` - Set to `http://localhost:3000` (update later)
- [ ] `PYTHON_VERSION` - Set to `3.11.0`

### Verification
- [ ] Deployment succeeded (green checkmark)
- [ ] Copied backend URL: `https://________.onrender.com`
- [ ] Tested: `curl https://your-backend.onrender.com/health`
- [ ] Health check returns `{"status": "ok"}`

---

## PHASE 2: Frontend Deployment (Vercel) ⏱️ 10 mins

### Pre-Deployment
- [ ] Updated `.env.local` with Render backend URL:
  ```env
  NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
  ```
- [ ] Committed changes to GitHub
- [ ] Created Vercel account

### Vercel Setup
- [ ] Imported project from GitHub
- [ ] Selected repository: `DegenHouse`
- [ ] Configured:
  ```
  Framework: Next.js
  Root Directory: apps/frontend
  ```

### Environment Variables (Vercel)
Copy ALL from `.env.local`:
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_CHAIN_ID`
- [ ] `NEXT_PUBLIC_CHAIN_NAME`
- [ ] `NEXT_PUBLIC_RPC_URL`
- [ ] `NEXT_PUBLIC_CRONOS_RPC`
- [ ] `NEXT_PUBLIC_CONTRACT_ADDRESS`
- [ ] `NEXT_PUBLIC_CASINO_ADDRESS`
- [ ] `NEXT_PUBLIC_USDT_ADDRESS`
- [ ] `NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS`
- [ ] `NEXT_PUBLIC_BOT_SETTINGS_ADDRESS`
- [ ] `NEXT_PUBLIC_REOWN_PROJECT_ID`
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- [ ] `NEXT_PUBLIC_ENABLE_LIVE_UPDATES`
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS`
- [ ] `NEYNAR_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (use Vercel URL after deployment)

### Verification
- [ ] Deployment succeeded
- [ ] Copied frontend URL: `https://________.vercel.app`
- [ ] Can access homepage
- [ ] No console errors

---

## PHASE 3: Connect Services

### Update Backend CORS (Render)
- [ ] Go to Render → Environment
- [ ] Update `ALLOWED_ORIGINS`:
  ```
  https://your-app.vercel.app,https://your-backend.onrender.com,http://localhost:3000
  ```
- [ ] Saved (auto-deploys)

### Update Frontend URL (Vercel)
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Update `NEXT_PUBLIC_APP_URL`:
  ```
  https://your-app.vercel.app
  ```
- [ ] Redeployed (Deployments → Redeploy)

---

## PHASE 4: Testing

### Basic Tests
- [ ] Frontend loads: Open Vercel URL
- [ ] Backend responds: `curl https://your-backend.onrender.com/api/v1/markets`
- [ ] No CORS errors in browser console
- [ ] Homepage displays correctly

### Wallet Tests
- [ ] Can click "Connect Wallet"
- [ ] MetaMask popup appears
- [ ] Can connect wallet
- [ ] Monad Testnet is available/selected

### Functional Tests
- [ ] Markets display on homepage
- [ ] Can view market details
- [ ] Can select YES/NO on a bet
- [ ] Transaction popup works
- [ ] Can place a bet (if you have testnet tokens)

---

## 🎉 Deployment Complete!

**Your URLs:**
- Frontend: `https://________.vercel.app`
- Backend: `https://________.onrender.com`

**Next Steps:**
1. Share your app with users
2. Monitor logs for errors
3. Consider paid plans for production (no cold starts)

---

## 🛠️ Quick Troubleshooting

### CORS Error?
→ Check Render `ALLOWED_ORIGINS` includes your Vercel URL

### Backend Slow?
→ First request after 15 min is slow (Render free tier)
→ Solution: Use cron-job.org to ping every 14 min

### Env Vars Not Working?
→ Redeploy after adding env vars in Vercel
→ Ensure `NEXT_PUBLIC_` prefix for client-side vars

### Wallet Won't Connect?
→ Check `NEXT_PUBLIC_REOWN_PROJECT_ID` is set
→ Verify Monad RPC URL is correct

---

## 📚 Documentation

- **Complete Guide:** [VERCEL_RENDER_COMPLETE_GUIDE.md](./VERCEL_RENDER_COMPLETE_GUIDE.md)
- **Backend Only:** [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)
- **Frontend Only:** [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

**Need Help?** Check the full guides linked above for detailed troubleshooting!
