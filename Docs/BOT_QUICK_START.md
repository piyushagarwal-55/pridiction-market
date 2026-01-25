# 🚀 AI Bot Quick Start Guide

## ✅ What's Done

All bot components are implemented and ready:
- ✅ Smart contract with 13 safety checks
- ✅ AI prediction service (Gemini)
- ✅ Safety checker
- ✅ Main bot service
- ✅ API endpoints
- ✅ Settings page
- ✅ Dashboard page
- ✅ Floating action button (🤖 in bottom-right corner)

## 🎯 Deploy in 5 Steps

### Step 1: Deploy Contract (2 minutes)

```bash
cd packages
npx hardhat run scripts/deploy-bot-settings.cjs --network monad-testnet
```

Copy the deployed address from output.

### Step 2: Update Backend .env (1 minute)

Edit `apps/backend/.env.backend`:

```env
BOT_SETTINGS_ADDRESS=<paste_deployed_address_here>
PREDICTION_MARKET_ADDRESS=0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
GEMINI_API_KEY=AIzaSyDFS8umhNSmp38Hw4Zk2gDAG1c-l93vuu0
MODEL_NAME=gemini-flash-latest
```

### Step 3: Update Frontend .env (1 minute)

Edit `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_BOT_SETTINGS_ADDRESS=<paste_deployed_address_here>
```

### Step 4: Update Constants (1 minute)

Edit `apps/frontend/lib/config/constants.ts`:

Find the line:
```typescript
BOT_SETTINGS: process.env.NEXT_PUBLIC_BOT_SETTINGS_ADDRESS || "",
```

Or manually set:
```typescript
BOT_SETTINGS: "<paste_deployed_address_here>",
```

### Step 5: Install Python Dependencies (2 minutes)

```bash
cd apps/backend
pip install google-generativeai web3 eth-account
```

## 🎮 How to Use

### For Users:

1. **Click the 🤖 button** in bottom-right corner (appears on all pages)

2. **Configure Settings** (`/bot/settings`):
   - Set max bet per market ($5-$1000)
   - Set daily budget
   - Set weekly budget
   - Set emergency stop loss
   - Set AI confidence threshold (60-95%)
   - Set max bets per day
   - Set cooldown between bets
   - Select allowed categories
   - Click "Save Settings On-Chain"

3. **Start Bot** (`/bot/dashboard`):
   - Click "▶️ Start Bot"
   - Enter private key (demo only - use secure storage in production)
   - Watch the bot work!

4. **Monitor Activity**:
   - See real-time stats (markets analyzed, bets placed, etc.)
   - Watch budget usage with progress bars
   - Read activity log to see what bot is doing
   - Use "🚨 Emergency Stop" if needed

## 📊 What the Bot Does

Every 60 seconds:
1. ✅ Checks if bot is active on-chain
2. ✅ Fetches new markets from blockchain
3. ✅ For each market:
   - Analyzes with Gemini AI
   - Gets prediction + confidence score
   - Validates with 13 safety checks
   - Places bet if all checks pass
   - Records activity

## 🛡️ Safety Features

The bot has 13 safety checks:
1. Bot must be active
2. No emergency stop
3. Can't bet twice on same market
4. Only allowed categories
5. AI confidence must be high enough
6. Bet amount within limit
7. Daily budget not exceeded
8. Weekly budget not exceeded
9. Cooldown period passed
10. Max bets per day not reached
11. Stop loss not triggered
12. Wallet has balance
13. Contract validation passed

**If ANY check fails, the bet is skipped and logged.**

## 🎨 UI Features

### Settings Page (`/bot/settings`)
- Configure all 13 parameters
- Visual budget indicators
- Category selection
- Real-time validation
- On-chain storage

### Dashboard (`/bot/dashboard`)
- Real-time status indicator
- Start/Stop controls
- Emergency stop button
- 4 key statistics
- Budget tracking with progress bars
- Live activity log (last 20 entries)
- Auto-refresh every 5-10 seconds

### Floating Action Button
- 🤖 button in bottom-right corner
- Appears on all pages except bot pages
- Hover to see "AI Bot" text
- Click to go to dashboard

## 🎬 Demo Script for Hackathon

### 1. Show the Problem (30 seconds)
"Imagine you're sleeping and a great market opens at 3 AM. You miss it. You lose money."

### 2. Show the Solution (30 seconds)
"Our AI bot never sleeps. It monitors markets 24/7 and places bets automatically."

### 3. Show the Safety (1 minute)
"But what if it bets all your money on bad markets? We have 13 safety checks stored on-chain:
- Budget limits (daily/weekly)
- AI confidence threshold
- Stop loss protection
- Emergency stop button
- All transparent on blockchain"

### 4. Live Demo (2 minutes)

**Settings:**
- "Let me configure the bot..."
- Set max bet: $50
- Set daily budget: $200
- Set AI confidence: 70%
- Select categories: Sports, Crypto
- "All settings saved on-chain for transparency"

**Dashboard:**
- "Now I start the bot..."
- Click Start Bot
- "Watch it analyze markets in real-time"
- Point to activity log
- "See the budget tracking"
- Point to progress bars
- "And I can stop it anytime with emergency stop"

### 5. Show the Intelligence (1 minute)
"The bot uses Google's Gemini AI to analyze markets:
- Reads market question
- Analyzes user's betting history
- Calculates confidence score
- Recommends bet amount
- Assesses risk level"

### 6. Closing (30 seconds)
"This is true Web3:
- Settings on-chain (transparent)
- AI-powered (intelligent)
- User-controlled (safe)
- Solves real problem (practical)"

## 🐛 Troubleshooting

### Bot won't start
- Check wallet is connected
- Check private key is correct
- Check bot settings are configured
- Check contract is deployed

### Bot skips all bets
- Check AI confidence threshold (lower it)
- Check budget limits (increase them)
- Check allowed categories (add more)
- Check activity log for specific reasons

### Budget not updating
- Wait for blockchain confirmation
- Refresh page
- Check on-chain stats

### Activity log empty
- Bot needs to analyze at least one market
- Wait 60 seconds for first cycle
- Check bot is actually running

## 📁 Key Files

### Smart Contract
- `packages/contracts/BotSettings.sol`
- `packages/scripts/deploy-bot-settings.cjs`

### Backend
- `apps/backend/app/services/auto_bet_bot.py`
- `apps/backend/app/services/gemini_predictor.py`
- `apps/backend/app/services/bot_safety.py`
- `apps/backend/app/api/v1/bot.py`

### Frontend
- `apps/frontend/app/bot/settings/page.tsx`
- `apps/frontend/app/bot/dashboard/page.tsx`
- `apps/frontend/app/components/BotFAB.tsx`

### Config
- `apps/frontend/lib/config/constants.ts`

## 🎯 Next Steps

1. **Deploy contract** (Step 1 above)
2. **Update environment variables** (Steps 2-4 above)
3. **Test locally** with a small market
4. **Prepare demo** using script above
5. **Win hackathon** 🏆

## 💡 Tips for Demo

- Use small bet amounts for demo ($5-10)
- Set low AI confidence (60%) so bot bets more often
- Have a test market ready
- Show activity log updating in real-time
- Emphasize the 13 safety checks
- Highlight on-chain transparency
- Show emergency stop working

## 🏆 Why This Wins

1. **Solves Real Problem** - Users miss markets
2. **AI Integration** - Gemini AI (judges love AI)
3. **Safety First** - 13 checks prevent disasters
4. **On-Chain Transparency** - True Web3
5. **Complete Implementation** - Not just a concept
6. **Great UX** - Easy to use, beautiful UI
7. **Innovative** - First auto-betting bot in prediction markets

---

**Status:** ✅ READY TO DEPLOY

**Time to Deploy:** 7 minutes  
**Time to Demo:** 5 minutes  
**Chance of Winning:** 🚀🚀🚀
