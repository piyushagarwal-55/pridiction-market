# 🚀 Farcaster Mini App Deployment Guide - Bet Bazzar

## 📋 What You Need to Deploy

I need the following information from you to deploy your Bet Bazzar Mini App on Farcaster:

---

## ✅ REQUIRED INFORMATION

### 1. **Deployment URL** (Most Important!)
Where will you deploy the mini app?

**Options:**
- [ ] **Vercel** (Recommended - Free, Easy)
- [ ] **Railway** (Your current backend host)
- [ ] **Netlify**
- [ ] **Your own domain**

**I need:**
```
Production URL: https://_________________.com
```

**Example:**
```
https://bet-bazzar-miniapp.vercel.app
```

---

### 2. **Neynar API Key** (Already Have ✅)
```
NEYNAR_API_KEY=A05C9F7E-86A1-4B1C-A48A-012E761110C4
```
✅ You already have this!

---

### 3. **Upstash Redis** (For Notifications - Optional)
Only needed if you want to send notifications to users.

**Get it here:** https://upstash.com/

**I need:**
```
UPSTASH_REDIS_REST_URL=https://_________________.upstash.io
UPSTASH_REDIS_REST_TOKEN=________________
```

**Skip this if:** You don't need notifications (can add later)

---

### 4. **App Branding Assets**

I need to create/customize these images:

#### **Icon** (200x200px)
- Square app icon
- Shows in Farcaster app store
- **Current:** `monad-miniapp-template/public/images/icon.png`
- **Need:** Bet Bazzar logo/icon

#### **Feed Image** (3:2 ratio, e.g., 1200x800px)
- Shows when app is shared in feed
- **Current:** `monad-miniapp-template/public/images/feed.png`
- **Need:** Bet Bazzar preview image

#### **Splash Screen** (200x200px)
- Shows when app is loading
- **Current:** `monad-miniapp-template/public/images/splash.png`
- **Need:** Bet Bazzar splash logo

**Options:**
- [ ] I'll create these images for you (using your brand colors)
- [ ] You'll provide the images
- [ ] Use placeholder images for now

---

### 5. **App Details**

**App Name:**
```
Default: "Bet Bazzar"
Custom: _________________ (if different)
```

**App Description:**
```
Default: "Blockchain prediction markets and betting on Monad"
Custom: _________________ (if different)
```

**Button Text:**
```
Default: "Launch Bet Bazzar"
Custom: _________________ (if different)
```

**App Category:**
```
Options:
- [ ] gaming
- [ ] social
- [ ] finance (Recommended for betting)
- [ ] developer-tools
- [ ] other

Selected: _________________
```

**Tags** (for search):
```
Default: ["monad", "betting", "prediction-markets", "blockchain"]
Custom: _________________ (if different)
```

---

### 6. **Account Association** (For Publishing)

To publish on Farcaster, you need to associate the app with your Farcaster account.

**I need:**
```
Your Farcaster Username: @_________________
Your Farcaster FID: _________________
```

**How to find your FID:**
1. Go to: https://warpcast.com/~/settings
2. Look for "FID" in your profile
3. Or use: https://fid.warpcast.com/

**Note:** We'll generate the account association signature later during deployment.

---

## 🎯 WHAT I'LL BUILD FOR YOU

Once you provide the above, I will:

### Phase 1: Customize Mini App Template
- [ ] Update branding (name, colors, images)
- [ ] Integrate with your Bet Bazzar smart contracts
- [ ] Add prediction market browsing
- [ ] Add betting functionality
- [ ] Connect to your backend API
- [ ] Style to match your dark glass/gold theme

### Phase 2: Configure for Deployment
- [ ] Set up environment variables
- [ ] Configure `farcaster.json` manifest
- [ ] Set up proper metadata
- [ ] Test locally with ngrok/cloudflared

### Phase 3: Deploy
- [ ] Deploy to your chosen platform
- [ ] Generate account association signature
- [ ] Test in Warpcast embed tool
- [ ] Submit to Farcaster directory

### Phase 4: Features
- [ ] Browse all prediction markets
- [ ] View market details
- [ ] Place bets with Warpcast wallet
- [ ] View bet history
- [ ] Share markets to feed
- [ ] Notifications (if Redis configured)

---

## 📝 QUICK DECISION CHECKLIST

To get started quickly, just answer these:

### Minimum Required (Can deploy in 30 minutes):
1. **Where to deploy?** 
   - [ ] Vercel (I'll set it up)
   - [ ] Railway (use existing)
   - [ ] Other: _________________

2. **Use placeholder images for now?**
   - [ ] Yes (deploy fast, update later)
   - [ ] No (I'll provide images first)

3. **Need notifications?**
   - [ ] No (skip Redis for now)
   - [ ] Yes (I'll set up Upstash)

4. **Your Farcaster username:**
   ```
   @_________________
   ```

### That's it! With just these 4 answers, I can deploy a working mini app!

---

## 🚀 DEPLOYMENT OPTIONS

### Option A: Quick Deploy (Recommended)
**Time:** 30 minutes
**What you get:** Working mini app with basic features

**You provide:**
- Deployment platform choice
- Farcaster username
- OK to use placeholder images

**I'll do:**
- Customize template
- Deploy to platform
- Give you URL to test

### Option B: Full Custom Deploy
**Time:** 1-2 hours
**What you get:** Fully branded mini app with all features

**You provide:**
- All information above
- Custom images
- Redis credentials (optional)

**I'll do:**
- Full customization
- Complete integration
- Production-ready deployment

### Option C: Manual Deploy (You do it)
**Time:** Your pace
**What you get:** Full control

**I'll provide:**
- Step-by-step instructions
- All code changes needed
- Deployment commands
- Testing guide

---

## 💡 MY RECOMMENDATION

### For Hackathon Demo:
**Go with Option A (Quick Deploy)**
- Deploy to Vercel (free, fast)
- Use placeholder images
- Skip notifications
- Focus on core betting features
- Can polish later

### For Production Launch:
**Go with Option B (Full Custom)**
- Custom branding
- All features enabled
- Proper images
- Notifications set up
- Professional polish

---

## 📊 WHAT USERS WILL GET

Once deployed, users can:

1. **Find your app** in Farcaster app directory
2. **Launch** from any cast or directly
3. **Browse** all prediction markets
4. **Place bets** using Warpcast wallet (Monad Testnet)
5. **Share** markets to their feed
6. **Track** their bets and winnings
7. **Get notifications** (if enabled)

---

## 🎬 NEXT STEPS

### Right Now:
1. **Answer the Quick Decision Checklist above**
2. **Tell me which deployment option you want**
3. **I'll start building immediately**

### Example Response:
```
Option A - Quick Deploy
- Deploy to: Vercel
- Farcaster: @yourname
- Use placeholder images: Yes
- Skip notifications: Yes for now
```

---

## ❓ COMMON QUESTIONS

**Q: Can I test before deploying?**
A: Yes! We'll test locally with ngrok first.

**Q: How much does it cost?**
A: Vercel is free. Upstash has free tier. No cost to deploy!

**Q: Can I update after deploying?**
A: Yes! You can update anytime.

**Q: Will this replace the Frames we built?**
A: No! They work together:
- Frames = Share in feed (viral)
- Mini App = Full experience (engagement)

**Q: How long to deploy?**
A: Quick deploy: 30 min. Full custom: 1-2 hours.

**Q: Do I need a domain?**
A: No! Vercel gives you a free subdomain.

---

## 🎯 READY TO START?

Just tell me:
1. Which option (A, B, or C)
2. Your Farcaster username
3. Where to deploy

And I'll get started immediately! 🚀

