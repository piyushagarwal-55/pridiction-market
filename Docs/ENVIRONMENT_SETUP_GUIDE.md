# Environment Variables Setup Guide

Complete step-by-step guide to get all required credentials and setup your environment.

---

## 1. WalletConnect/Reown Project ID

### Steps:
1. Go to https://cloud.reown.com/ (or https://cloud.walletconnect.com/)
2. Click "Sign Up" or "Login"
   - You can use GitHub, Google, or Email
3. Once logged in, click "Create New Project"
4. Fill in project details:
   - **Project Name**: DegenHouse (or your preferred name)
   - **Description**: Prediction market platform
5. Click "Create"
6. You'll see your **Project ID** (32 characters, looks like: `a1b2c3d4e5f6789012345678901234ab`)
7. Copy this Project ID

### Update in `.env.local`:
```env
NEXT_PUBLIC_REOWN_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<paste-your-project-id-here>
```

---

## 2. Supabase Database Setup

### A. Create Supabase Project:
1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up/Login (GitHub recommended)
4. Click "New Project"
5. Fill in details:
   - **Name**: DegenHouse
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete
https://-
### B. Get Database Connection String:
1. In your Supabase dashboard, click "Project Settings" (gear icon)
2. Go to "Database" section
3. Scroll down to "Connection string"
4. Select "URI" tab
5. Copy the connection string (looks like):
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you created in step A.5

### C. Configure Connection Pooling (Recommended):
Use the **Transaction Mode** connection string for Prisma:
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### D. Update Environment Files:

**Frontend: `apps/frontend/.env.local`**
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Backend: `apps/backend/.env`**
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### E. Run Database Migrations:

**Frontend (Next.js):**
```powershell
cd C:\Users\LENOVO\Desktop\DegenHouse\apps\frontend
npx prisma migrate dev --name init
npx prisma generate
```

**Backend (if needed):**
```powershell
cd C:\Users\LENOVO\Desktop\DegenHouse\apps\backend
npx prisma migrate dev --name init
```

---

## 3. Redis Setup (Upstash - Free)

### Steps:
1. Go to https://upstash.com/
2. Sign up with GitHub or Email
3. Click "Create Database"
4. Fill in:
   - **Name**: DegenHouse-Redis
   - **Type**: Regional
   - **Region**: Choose closest to you
   - **TLS**: Enabled (recommended)
5. Click "Create"
6. In the database dashboard, copy the "REST URL" or "Redis URL"
   - Should look like: `redis://default:xxxxx@your-region.upstash.io:6379`
   - Or REST URL: `https://your-region.upstash.io`

### Update in `apps/backend/.env`:
```env
REDIS_URL=redis://default:xxxxx@your-region.upstash.io:6379
```

---

## 4. Cronos Blockchain RPC

### Free Public RPCs (No signup needed):
```env
# Testnet
CRONOS_RPC_URL=https://evm-t3.cronos.org
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org

# Mainnet (when ready for production)
CRONOS_RPC_URL=https://evm.cronos.org
NEXT_PUBLIC_CRONOS_RPC=https://evm.cronos.org
```

### Or Get Dedicated RPC (Recommended for production):
1. Go to https://www.ankr.com/rpc/
2. Sign up for free account
3. Create Cronos RPC endpoint
4. Copy your dedicated URL

---

## 5. Secret Keys & Security

### Backend Secret Key:
Generate a secure random string:

**Using Python:**
```powershell
C:/Users/LENOVO/Desktop/DegenHouse/.venv/Scripts/python.exe -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and add to `apps/backend/.env`:
```env
SECRET_KEY=<paste-generated-key-here>
```

### JWT Secret (if needed):
```powershell
C:/Users/LENOVO/Desktop/DegenHouse/.venv/Scripts/python.exe -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 6. Smart Contract Deployment

### A. Get Cronos Testnet CRO:
1. Go to https://cronos.org/faucet
2. Connect your wallet (MetaMask)
3. Switch to Cronos Testnet
4. Request test CRO tokens

### B. Deploy Contracts:
```powershell
cd C:\Users\LENOVO\Desktop\DegenHouse\packages
npx hardhat run scripts/deploy.ts --network cronos-testnet
```

### C. Update Contract Addresses:
After deployment, you'll see output like:
```
MarketManager deployed to: 0xABC123...
PredictionMarket deployed to: 0xDEF456...
```

Update in `apps/frontend/.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xDEF456...  # PredictionMarket address
NEXT_PUBLIC_MARKET_MANAGER_ADDRESS=0xABC123...  # MarketManager address
```

---

## 7. Gnosis Safe (Multi-sig Wallet)

### For Development:
Use a regular wallet address initially:
```env
NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS=0xYourWalletAddress
```

### For Production:
1. Go to https://app.safe.global/
2. Connect wallet
3. Click "Create new Safe"
4. Select Cronos network
5. Add owners and set threshold
6. Deploy Safe
7. Copy the Safe address

---

## Final Environment Files

### `apps/frontend/.env.local` (Complete)
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database URL (Supabase)
DATABASE_URL=postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Network
NEXT_PUBLIC_CRONOS_NETWORK=testnet

# Smart Contracts (update after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_USDT_ADDRESS=0xF0F161fDA2712DB8b566946122a5af183995e2eD
NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS=0x0000000000000000000000000000000000000000

# WalletConnect/Reown (from step 1)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_actual_project_id_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here

# Blockchain RPC
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org

# Optional Features
NEXT_PUBLIC_ENABLE_LIVE_UPDATES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### `apps/backend/.env` (Complete)
```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Redis (Upstash)
REDIS_URL=redis://default:xxxxx@your-region.upstash.io:6379

# Security (from step 5)
SECRET_KEY=your_generated_secret_key_here

# Blockchain
CRONOS_RPC_URL=https://evm-t3.cronos.org
CRONOS_NETWORK=testnet

# Smart Contracts (update after deployment)
PREDICTION_MARKET_ADDRESS=0x0000000000000000000000000000000000000000
GNOSIS_SAFE_ADDRESS=0x0000000000000000000000000000000000000000

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

---

## Order of Setup

1. ✅ **WalletConnect Project ID** (5 minutes)
2. ✅ **Supabase Database** (10 minutes)
3. ✅ **Redis (Upstash)** (5 minutes)
4. ✅ **Generate Secret Keys** (1 minute)
5. ⏳ **Deploy Smart Contracts** (requires test CRO)
6. ⏳ **Update Contract Addresses**
7. ⏳ **Run Database Migrations**
8. ⏳ **Restart Servers**

---

## Quick Commands After Setup

### Restart Frontend:
```powershell
# Stop current server (Ctrl+C in terminal)
cd C:\Users\LENOVO\Desktop\DegenHouse\apps\frontend
npm run dev
```

### Restart Backend:
```powershell
# Stop current server (Ctrl+C in terminal)
cd C:\Users\LENOVO\Desktop\DegenHouse\apps\backend
C:/Users/LENOVO/Desktop/DegenHouse/.venv/Scripts/python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Troubleshooting

### Database Connection Issues:
- Verify password is correct in connection string
- Check Supabase project is active (green status)
- Ensure you're using the pooler connection string with `?pgbouncer=true`

### WalletConnect 403 Error:
- Verify Project ID is correct (32 characters)
- Ensure no extra spaces in .env.local
- Restart Next.js server after changing .env.local

### Redis Connection Failed:
- Check Upstash dashboard shows database as active
- Verify Redis URL includes password
- Check firewall isn't blocking connection

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- WalletConnect Docs: https://docs.reown.com/
- Upstash Redis Docs: https://upstash.com/docs/redis
- Cronos Docs: https://docs.cronos.org/

