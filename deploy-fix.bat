@echo off
REM Fix Vercel deployment - Update adapter imports

echo 🔧 Fixing Reown adapter imports for Vercel deployment...

REM Add only the changed files
git add apps/frontend/lib/config/appkit.ts
git add apps/frontend/package.json
git add apps/frontend/app/providers.tsx

REM Commit
git commit -m "fix: Update Reown adapter from wagmi to ethers for Vercel deployment"

REM Push
git push

echo ✅ Changes pushed! Vercel will auto-deploy.
echo 🔗 Check your Vercel dashboard for deployment status.

pause
