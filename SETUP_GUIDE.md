# 🚀 DegenHouse - Quick Setup Guide

Complete setup guide for teammates to run the project locally.

---

## 📋 Prerequisites

Before you start, make sure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.10+ ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))
- **MetaMask** or compatible Web3 wallet

---

## 🎯 Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/piyushagarwal-55/pridiction-market.git
cd pridiction-market
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/frontend
npm install

# Install backend dependencies (if using backend)
cd ../backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 3. Setup Environment Variables

#### Frontend (.env.local)

Create `apps/frontend/.env.local` and copy this:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Blockchain Configuration - Monad Testnet
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME="Monad Testnet"
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CRONOS_RPC=https://testnet-rpc.monad.xyz

# Smart Contract Addresses (Already deployed!)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
NEXT_PUBLIC_USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS=0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA

# WalletConnect Project ID (Already configured!)
NEXT_PUBLIC_REOWN_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_UPDATES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Database (Optional - for Prisma)
DATABASE_URL="postgresql://postgres:Piyush%402005%40@db.vbfixzygguccqtxfgsfl.supabase.co:5432/postgres"
```

#### Backend (.env) - Optional

Create `apps/backend/.env` if using backend:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/degenhouse

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app

# Environment
ENVIRONMENT=development
DEBUG=true

# Blockchain
CRONOS_RPC_URL=https://testnet-rpc.monad.xyz
CONTRACT_ADDRESS=0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
GNOSIS_SAFE_ADDRESS=0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA
```

### 4. Run the Frontend

```bash
cd apps/frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser! 🎉

### 5. Setup Your Wallet

1. Open MetaMask
2. Add Monad Testnet network:
   - **Network Name**: Monad Testnet
   - **RPC URL**: https://testnet-rpc.monad.xyz
   - **Chain ID**: 10143
   - **Currency**: MON
   - **Block Explorer**: https://testnet.monadexplorer.com

3. Get test tokens:
   - Visit the faucet or use the built-in "Mint Test USDT" button in the app

---

## 🎮 Using the App

### Prediction Markets (✅ WORKING)

1. Go to `/prediction`
2. Connect your wallet
3. Click "Mint Test USDT" (first time only)
4. Approve USDT spending
5. Place a bet (YES/NO)
6. See your bet confirmed on-chain!

### Casino, Sports, Esports (🎨 UI Only)

Currently, these are beautiful UI mockups:
- **Casino** (`/casino`) - Visual mockup of casino games
- **Sports** (`/sports`) - Sports betting interface
- **Esports** (`/esports`) - Esports betting interface

They will be connected to blockchain soon!

---

## 🛠️ Development Commands

```bash
# Frontend development
cd apps/frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Lint code

# Backend (optional)
cd apps/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Smart Contracts
cd packages
npm run compile      # Compile contracts
npm run test         # Run tests
npm run deploy       # Deploy to network
```

---

## 📁 Project Structure

```
DegenHouse/
├── apps/
│   ├── frontend/          # Next.js 15 App (main app)
│   │   ├── app/           # Pages
│   │   │   ├── prediction/    # ✅ Working with blockchain
│   │   │   ├── casino/        # 🎨 UI mockup
│   │   │   ├── sports/        # 🎨 UI mockup
│   │   │   └── esports/       # 🎨 UI mockup
│   │   ├── lib/           # Utilities
│   │   │   ├── hooks/         # useContractBet, etc.
│   │   │   ├── blockchain/    # Viem client, validators
│   │   │   └── config/        # Constants
│   │   └── components/    # React components
│   │
│   └── backend/           # FastAPI (optional)
│       └── app/
│           ├── api/       # REST endpoints
│           ├── models/    # Database models
│           └── services/  # Business logic
│
├── packages/
│   ├── contracts/         # Smart Contracts
│   │   ├── PredictionMarket.sol   # ✅ Deployed
│   │   ├── MockUSDT.sol           # ✅ Deployed
│   │   ├── MarketManager.sol
│   │   ├── PositionToken.sol
│   │   └── Settlement.sol
│   └── scripts/           # Deployment scripts
│
└── docs/                  # Documentation
```

---

## 🔧 Troubleshooting

### "Module not found" errors
```bash
cd apps/frontend
rm -rf node_modules .next
npm install
npm run dev
```

### Wallet not connecting
1. Make sure you're on Monad Testnet (Chain ID: 10143)
2. Refresh the page
3. Try disconnecting and reconnecting

### Transaction failing
1. Check you have test USDT (click "Mint Test USDT")
2. Make sure USDT is approved (click "Approve USDT")
3. Check you're on the correct network

### "Cannot read properties of undefined"
1. Check all environment variables are set
2. Make sure contract addresses are correct
3. Restart the dev server

---

## 🌐 Deployed Contracts (Monad Testnet)

| Contract | Address |
|----------|---------|
| **PredictionMarket** | `0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B` |
| **MockUSDT** | `0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21` |
| **Gnosis Safe** | `0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA` |

View on Explorer: https://testnet.monadexplorer.com

---

## 📚 Key Files to Know

### Frontend
- `apps/frontend/lib/hooks/useContractBet.ts` - Betting logic
- `apps/frontend/lib/blockchain/viem-client.ts` - Blockchain client
- `apps/frontend/lib/config/constants.ts` - All configuration
- `apps/frontend/app/prediction/[id]/page.tsx` - Prediction market page

### Smart Contracts
- `packages/contracts/PredictionMarket.sol` - Main betting contract
- `packages/contracts/MockUSDT.sol` - Test USDT token
- `packages/scripts/deploy.ts` - Deployment script

---

## 🎯 What's Working vs What's Not

### ✅ Fully Working (Blockchain Connected)
- **Prediction Markets** - Complete smart contract integration
  - Place bets with USDT
  - Real-time pool updates
  - Transaction monitoring
  - Wallet connection
  - USDT approval
  - Mint test USDT

### 🎨 UI Mockups Only (No Blockchain Yet)
- **Casino** - Beautiful UI, no betting logic
- **Sports** - Match displays, no betting logic
- **Esports** - Game displays, no betting logic

---

## 💡 Tips for Development

1. **Always start with prediction markets** - It's the fully working example
2. **Check browser console** for detailed logs
3. **Use the "Mint Test USDT"** button to get test tokens
4. **Approve USDT once** before placing bets
5. **Wait for confirmations** - Transactions take a few seconds

---

## 🤝 Need Help?

If you run into issues:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Look at browser console for error messages
3. Check that all env variables are set correctly
4. Make sure you're on Monad Testnet
5. Ask the team!

---

## 📝 Next Steps

After setup, you can:
1. ✅ Place bets on prediction markets
2. 🔨 Help build casino/sports blockchain integration
3. 🎨 Improve UI/UX
4. 🧪 Add more tests
5. 📱 Build mobile responsive features

---

## 🚀 Happy Building!

You're all set! The prediction market is fully functional and ready to use. Casino, Sports, and Esports are beautiful mockups waiting for blockchain integration.

**Start here**: http://localhost:3000/prediction

Questions? Check the codebase or ask the team! 🎉
