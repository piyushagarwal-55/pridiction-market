# 🚀 Git Setup & Push Instructions

Quick guide to push this project to your new repository.

---

## 📝 Step-by-Step Git Commands

### 1. Check Current Git Status

```bash
cd C:\Users\LENOVO\Desktop\DegenHouse
git status
```

### 2. Add All Files

```bash
# Add all files (including the new env files we created)
git add .

# Check what will be committed
git status
```

### 3. Commit Everything

```bash
git commit -m "Initial commit: Complete DegenHouse project with setup guide and env files"
```

### 4. Change Remote to New Repository

```bash
# Remove old remote (if exists)
git remote remove origin

# Add new remote
git remote add origin https://github.com/piyushagarwal-55/pridiction-market.git

# Verify remote
git remote -v
```

### 5. Push to New Repository

```bash
# Push to main branch
git branch -M main
git push -u origin main --force
```

**Note**: We use `--force` because we're starting fresh with a new repository.

---

## 🔄 Alternative: Start from Scratch

If you want a completely fresh Git history:

```bash
# 1. Remove existing .git folder
Remove-Item -Recurse -Force .git

# 2. Initialize new repository
git init

# 3. Add all files
git add .

# 4. First commit
git commit -m "first commit: Complete DegenHouse prediction market platform"

# 5. Set main branch
git branch -M main

# 6. Add remote
git remote add origin https://github.com/piyushagarwal-55/pridiction-market.git

# 7. Push
git push -u origin main
```

---

## 📋 What's Being Committed

✅ **Included in this push:**
- Complete frontend (Next.js 15)
- Complete backend (FastAPI) 
- Smart contracts (Solidity)
- All dependencies (package.json)
- Environment files (`.env.production`, `.env.backend`)
- Setup documentation (SETUP_GUIDE.md)
- Git push instructions (this file)

✅ **Safe to commit:**
- `.env.production` - Contains testnet addresses (public)
- `.env.backend` - Example configuration (public)
- All contract addresses are on testnet (not sensitive)

❌ **Not committed (gitignored):**
- `node_modules/`
- `.next/` build files
- Python `__pycache__/`
- Local `.env.local` files
- Personal wallet private keys

---

## 🎯 After Pushing

### For Your Teammate:

Send them this message:

```
Hi! I've pushed the complete DegenHouse project to:
https://github.com/piyushagarwal-55/pridiction-market

To get started:
1. Clone the repo: git clone https://github.com/piyushagarwal-55/pridiction-market.git
2. Follow SETUP_GUIDE.md - it has everything!
3. The prediction market is fully working on Monad Testnet
4. All env files are included - just copy .env.production to apps/frontend/.env.local

Let me know if you need help! 🚀
```

### Update README.md

The repository already has a comprehensive README.md. You might want to add a quick start section at the top:

Add this to the beginning of README.md:

```markdown
## ⚡ Quick Start

**New to the project?** Follow these 3 steps:

1. **Setup**: Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete instructions
2. **Copy env**: `cp .env.production apps/frontend/.env.local`
3. **Run**: `cd apps/frontend && npm install && npm run dev`

🎉 **Visit**: http://localhost:3000/prediction (fully working!)

---
```

---

## 🔑 Important Notes

### Environment Variables
- All included env files use **testnet** addresses (safe to commit)
- For production deployment:
  - Get new WalletConnect Project ID
  - Deploy contracts to mainnet
  - Update contract addresses
  - Add to `.env.local` (NOT committed)

### Security
- Never commit mainnet private keys
- Never commit production database credentials
- Never commit API keys for production services

### Network
Current setup uses **Monad Testnet**:
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz
- Free testnet tokens available

---

## 🤝 Team Collaboration

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/casino-integration

# Work on feature
git add .
git commit -m "Add casino smart contract"

# Push feature
git push origin feature/casino-integration

# Create PR on GitHub
```

### Keeping Updated
```bash
# Get latest changes
git pull origin main

# If conflicts, resolve and:
git add .
git commit -m "Merge latest changes"
git push
```

---

## ✅ Verification Checklist

Before pushing, verify:
- [ ] All files added (`git status` shows nothing untracked)
- [ ] No sensitive data in commit (check `git diff`)
- [ ] SETUP_GUIDE.md is complete
- [ ] .env.production has correct testnet addresses
- [ ] No node_modules in commit (should be gitignored)
- [ ] Remote URL is correct (`git remote -v`)

---

## 🎉 You're All Set!

After pushing, your teammate can clone and run the project in minutes!

```bash
# They run:
git clone https://github.com/piyushagarwal-55/pridiction-market.git
cd pridiction-market
# Follow SETUP_GUIDE.md
```

Happy coding! 🚀
