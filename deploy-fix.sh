#!/bin/bash

# Fix Vercel deployment - Update adapter imports

echo "🔧 Fixing Reown adapter imports for Vercel deployment..."

# Add only the changed files
git add apps/frontend/lib/config/appkit.ts
git add apps/frontend/app/providers.tsx

# Commit
git commit -m "fix: Update Reown adapter from wagmi to ethers for Vercel deployment"

# Push
git push

echo "✅ Changes pushed! Vercel will auto-deploy."
echo "🔗 Check your Vercel dashboard for deployment status."
