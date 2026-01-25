# 🤖 AI Bot Implementation Plan (6-8 hours)

## Phase 1: Smart Contract (1-2 hours)

### Deploy BotSettings Contract
```bash
cd packages
npx hardhat run scripts/deploy-bot-settings.cjs --network monadTestnet
```

**Contract Features:**
- Store user bot configuration
- Validate settings on-chain
- Emergency stop mechanism
- Budget tracking
- Activity logging

---

## Phase 2: Backend Bot Service (2-3 hours)

### File Structure
```
apps/backend/app/
├── services/
│   ├── auto_bet_bot.py          # Main bot logic
│   ├── bot_safety.py            # Safety checks
│   └── gemini_predictor.py      # Gemini AI integration
├── api/v1/
│   └── bot.py                   # Bot API endpoints
└── tasks/
    └── bot_monitor.py           # Background task
```

### Gemini Integration
```python
# apps/backend/app/services/gemini_predictor.py

import google.generativeai as genai

genai.configure(api_key="AIzaSyDFS8umhNSmp38Hw4Zk2gDAG1c-l93vuu0")

class GeminiPredictor:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-flash-latest')
    
    async def predict_market(self, market_question, user_history):
        """
        Use Gemini to predict market outcome
        """
        prompt = f"""
        Analyze this prediction market and provide a prediction:
        
        Market Question: {market_question}
        
        User's Betting History:
        {self._format_history(user_history)}
        
        Provide your analysis in JSON format:
        {{
            "prediction": "YES" or "NO",
            "confidence": 0-100,
            "reasoning": "why",
            "risk_level": "LOW", "MEDIUM", or "HIGH",
            "recommended_bet": amount in USDT
        }}
        """
        
        response = self.model.generate_content(prompt)
        return json.loads(response.text)
```

### Bot API Endpoints
```python
# apps/backend/app/api/v1/bot.py

@router.post("/bot/start")
async def start_bot(user_address: str):
    """Start the bot for a user"""
    bot = AutoBetBot(user_address)
    await bot.start()
    return {"success": True, "message": "Bot started"}

@router.post("/bot/stop")
async def stop_bot(user_address: str):
    """Stop the bot"""
    bot = get_bot_instance(user_address)
    await bot.stop()
    return {"success": True, "message": "Bot stopped"}

@router.get("/bot/status")
async def get_bot_status(user_address: str):
    """Get bot status and stats"""
    return {
        "active": is_bot_active(user_address),
        "stats": get_bot_stats(user_address),
        "recent_activity": get_recent_activity(user_address)
    }
```

---

## Phase 3: Frontend (2-3 hours)

### Pages to Create

**1. Bot Settings Page** (`/bot/settings`)
- Configure all safety limits
- Save to blockchain
- Visual budget indicators

**2. Bot Dashboard** (`/bot/dashboard`)
- Start/Stop button
- Real-time status
- Activity log
- Budget tracking
- Performance stats

**3. Bot Activity Feed** (component)
- Show what bot is doing
- Why it skipped markets
- Bets placed
- Notifications

### Key Components
```typescript
// apps/frontend/app/bot/components/BotControl.tsx
export function BotControl() {
    const [botActive, setBotActive] = useState(false);
    
    const startBot = async () => {
        const response = await fetch('/api/bot/start', {
            method: 'POST',
            body: JSON.stringify({ userAddress })
        });
        setBotActive(true);
        toast.success("🤖 Bot Started!");
    };
    
    return (
        <div className="bot-control">
            <button 
                onClick={botActive ? stopBot : startBot}
                className={botActive ? 'btn-danger' : 'btn-success'}
            >
                {botActive ? '⏹️ Stop Bot' : '▶️ Start Bot'}
            </button>
        </div>
    );
}
```

---

## Phase 4: Testing (1 hour)

### Test Scenarios

**Safety Tests:**
1. ✅ Bot respects max bet limit
2. ✅ Bot stops at daily budget
3. ✅ Bot skips low confidence markets
4. ✅ Bot respects cooldown
5. ✅ Emergency stop works
6. ✅ Stop loss triggers correctly

**Functionality Tests:**
1. ✅ Bot detects new markets
2. ✅ Gemini AI makes predictions
3. ✅ Bot places bets correctly
4. ✅ Activity log updates
5. ✅ Notifications sent
6. ✅ Settings persist on-chain

---

## 🎯 MVP Features (Must Have)

### Smart Contract
- [x] Store bot settings
- [x] Validate limits
- [x] Emergency stop
- [x] Budget tracking

### Backend
- [x] Monitor new markets
- [x] Gemini AI predictions
- [x] Safety checks
- [x] Auto-bet placement
- [x] Activity logging

### Frontend
- [x] Settings page
- [x] Start/Stop button
- [x] Activity log
- [x] Budget indicators
- [x] Emergency stop button

---

## 🚀 Quick Start Commands

### 1. Deploy Contract
```bash
cd packages
npx hardhat run scripts/deploy-bot-settings.cjs --network monadTestnet
```

### 2. Start Backend Bot Service
```bash
cd apps/backend
python -m app.tasks.bot_monitor
```

### 3. Test Frontend
```bash
cd apps/frontend
npm run dev
# Navigate to /bot/settings
```

---

## 📊 Demo Script for Hackathon

### Setup (Before Demo)
1. Configure bot settings (max bet: 50 USDT, confidence: 75%)
2. Have a test market ready to create
3. Show bot dashboard with "Inactive" status

### Demo Flow (3 minutes)
1. **Show Settings Page** (30 sec)
   - "Here's where users configure safety limits"
   - Point out daily budget, confidence threshold, stop loss

2. **Start Bot** (30 sec)
   - Click "Start Bot" button
   - Show status change to "Active & Monitoring"

3. **Create New Market** (30 sec)
   - Create a test market: "Will BTC reach $100k by Feb 2026?"
   - Show bot detecting it in activity log

4. **Show AI Analysis** (60 sec)
   - Bot analyzes with Gemini AI
   - Shows confidence: 82%
   - Shows reasoning
   - Decides to bet 40 USDT on YES

5. **Show Bet Placement** (30 sec)
   - Bot places bet automatically
   - Transaction confirmed
   - User gets notification
   - Budget updates (40/200 USDT used)

### Talking Points
- "Bot never sleeps - monitors 24/7"
- "Gemini AI analyzes each market"
- "Multiple safety checks prevent losses"
- "All settings stored on-chain"
- "User has full control with emergency stop"

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────────────────────┐
│  🤖 AI Auto-Bet Bot                                 │
│  Your 24/7 betting assistant powered by Gemini AI   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Status: 🟢 ACTIVE & MONITORING             │   │
│  │  ✅ All safety checks passing                │   │
│  │  💰 Budget: 80 / 200 USDT (40%)             │   │
│  │  🧠 Confidence: 75% minimum                  │   │
│  │  ⏱️ Cooldown: Ready                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [⏹️ Stop Bot]  [⚙️ Settings]  [🚨 Emergency Stop] │
│                                                     │
├─────────────────────────────────────────────────────┤
│  📊 Performance                                     │
│  ├─ Total Bets: 47                                  │
│  ├─ Win Rate: 68%                                   │
│  ├─ Profit: +234 USDT                               │
│  └─ Avg Confidence: 79%                             │
├─────────────────────────────────────────────────────┤
│  📋 Recent Activity                                 │
│  ├─ 2 min ago: ✅ Bet 30 USDT on YES               │
│  │   Market: "ETH reaches $5k?"                     │
│  │   Confidence: 82% | Gemini AI                    │
│  ├─ 15 min ago: ⏭️ Skipped                         │
│  │   Reason: Confidence 68% below threshold         │
│  └─ 1 hour ago: 🚫 Blocked                         │
│      Reason: Category not allowed                   │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Start Simple**: Get basic bot working first, add features later
2. **Test Safety**: Verify all limits work before demo
3. **Mock Data**: Have fake activity log for demo if needed
4. **Backup Plan**: Record video in case live demo fails
5. **Emphasize Safety**: Judges care about user protection

---

## ⏱️ Time Breakdown

- Smart Contract: 1-2 hours
- Backend Bot: 2-3 hours  
- Frontend UI: 2-3 hours
- Testing: 1 hour
- **Total: 6-9 hours**

---

## 🏆 Why This Wins

1. **Unique** - No other platform has this
2. **AI-Powered** - Uses Gemini AI (buzzword!)
3. **Safe** - Multiple safety mechanisms
4. **On-Chain** - Settings stored on blockchain
5. **Demo-able** - Easy to show live
6. **Practical** - Solves real problem

This feature alone could win the hackathon! 🚀
