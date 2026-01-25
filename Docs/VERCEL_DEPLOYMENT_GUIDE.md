# 🚀 Vercel Deployment Guide - Bet Bazzar Frontend

## Overview
Deploy your Bet Bazzar frontend (Next.js app) to Vercel in under 10 minutes.

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free) - Sign up at https://vercel.com
- [ ] Your code pushed to GitHub
- [ ] Backend deployed on Railway (we'll do this next)

---

## 🎯 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# If not already done
cd C:\Users\LENOVO\Desktop\DegenHouse

# Initialize git (if needed)
git init
git add .
git commit -m "Ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/bet-bazzar.git
git branch -M main
git push -u origin main
```

---

### Step 2: Connect to Vercel

1. **Go to Vercel:**
   - Visit: https://vercel.com/
   - Click "Sign Up" or "Login"
   - Choose "Continue with GitHub"

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   ```
   Framework Preset: Next.js
   Root Directory: apps/frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

---

### Step 3: Set Environment Variables

In Vercel dashboard, go to "Settings" → "Environment Variables" and add:

```bash
# Backend API (Update after Railway deployment)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Database
DATABASE_URL=postgresql://postgres:Piyush%402005%40@db.vbfixzygguccqtxfgsfl.supabase.co:5432/postgres

# Blockchain - Monad Testnet
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CRONOS_RPC=https://testnet-rpc.monad.xyz

# Smart Contracts
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
NEXT_PUBLIC_CASINO_ADDRESS=0x9d95C1fd002A6d4732F081Fa7ccd7dF9dA0153EF
NEXT_PUBLIC_USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS=0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA
NEXT_PUBLIC_BOT_SETTINGS_ADDRESS=0xEBE6E13c31b23347F69c1b31fAdB0335063E224b

# Wallet Connect
NEXT_PUBLIC_REOWN_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1

# Farcaster
NEYNAR_API_KEY=A05C9F7E-86A1-4B1C-A48A-012E761110C4
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_UPDATES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

**Important:** 
- Replace `https://your-backend.railway.app` with actual Railway URL (after backend deployment)
- Replace `https://your-app.vercel.app` with your actual Vercel URL (shown after first deployment)

---

### Step 4: Deploy

1. **Click "Deploy"**
   - Vercel will build and deploy automatically
   - Takes 2-5 minutes

2. **Get Your URL:**
   - After deployment, you'll get a URL like:
   ```
   https://bet-bazzar.vercel.app
   ```

3. **Update Environment Variable:**
   - Go back to Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
   - Click "Redeploy" to apply changes

---

## ✅ Verification

### Test Your Deployment:

1. **Visit your Vercel URL:**
   ```
   https://your-app.vercel.app
   ```

2. **Check these pages:**
   - [ ] Home page loads
   - [ ] `/prediction` page works
   - [ ] `/casino` page works
   - [ ] `/bot/settings` page works
   - [ ] Wallet connect button appears

3. **Test Farcaster Frame:**
   ```
   https://your-app.vercel.app/api/frames/market/bet-bazzar-launch/image
   ```
   Should show a beautiful market preview image

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Solution: Check package.json dependencies
# Ensure all imports match installed packages
```

**Error: "Prisma generate failed"**
```bash
# Solution: Prisma schema path issue
# Verify: apps/frontend/lib/db/prisma/schema.prisma exists
```

### Environment Variables Not Working

**Symptoms:** API calls fail, wallet doesn't connect
```bash
# Solution:
# 1. Check variable names start with NEXT_PUBLIC_ (for client-side)
# 2. Redeploy after adding variables
# 3. Clear browser cache
```

### API Connection Fails

**Error: "Failed to fetch" or CORS errors**
```bash
# Solution:
# 1. Verify NEXT_PUBLIC_API_URL is correct
# 2. Ensure backend is deployed and running
# 3. Check backend CORS settings allow your Vercel domain
```

---

## 🎨 Custom Domain (Optional)

### Add Your Own Domain:

1. **In Vercel Dashboard:**
   - Go to "Settings" → "Domains"
   - Click "Add Domain"
   - Enter your domain (e.g., `betbazzar.com`)

2. **Update DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers

3. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://betbazzar.com
   ```

4. **Redeploy**

---

## 🔄 Continuous Deployment

### Automatic Deployments:

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel deploys automatically!
```

### Preview Deployments:

- Every branch gets a preview URL
- Perfect for testing before merging
- Example: `https://bet-bazzar-git-feature-branch.vercel.app`

---

## 📊 Monitoring

### Check Deployment Status:

1. **Vercel Dashboard:**
   - View deployment logs
   - See build times
   - Monitor errors

2. **Analytics (Optional):**
   - Enable Vercel Analytics
   - Track page views
   - Monitor performance

---

## 💡 Pro Tips

### Speed Up Builds:
```json
// vercel.json (create in apps/frontend/)
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps"
}
```

### Environment-Specific Variables:
- Production: Set in "Production" tab
- Preview: Set in "Preview" tab
- Development: Use `.env.local`

### Caching:
- Vercel automatically caches builds
- Faster subsequent deployments
- Clear cache if needed in settings

---

## 🎯 Next Steps

After frontend is deployed:

1. ✅ Note your Vercel URL
2. 🚀 Deploy backend to Railway (next guide)
3. 🔗 Update `NEXT_PUBLIC_API_URL` with Railway URL
4. 🔄 Redeploy frontend
5. 🎉 Test everything works!

---

## 📝 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Root directory set to `apps/frontend`
- [ ] All environment variables added
- [ ] First deployment successful
- [ ] Vercel URL noted
- [ ] `NEXT_PUBLIC_APP_URL` updated with actual URL
- [ ] Redeployed with correct URL
- [ ] All pages load correctly
- [ ] Wallet connect works
- [ ] Frame image generates
- [ ] Ready for backend deployment!

---

## 🆘 Need Help?

### Common Issues:

**Q: Build takes too long**
A: First build is slower. Subsequent builds are faster (cached).

**Q: Environment variables not updating**
A: Must redeploy after changing variables.

**Q: Getting 404 errors**
A: Check root directory is set to `apps/frontend`.

**Q: Prisma errors**
A: Ensure DATABASE_URL is set and schema path is correct.

---

## 🎉 Success!

Your frontend is now live at:
```
https://your-app.vercel.app
```

Next: Deploy backend to Railway! →

