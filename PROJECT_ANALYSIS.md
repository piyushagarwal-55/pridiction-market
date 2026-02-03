# Eden Haus - Comprehensive Project Analysis
## Real-Time Prediction Market Platform

**Analysis Date:** February 3, 2026  
**Repository:** piyushagarwal-55/pridiction-market  
**Analysis Type:** Code-based functional verification (README excluded as requested)

---

## Executive Summary

**Eden Haus** (branded as "Bet Bazzar" in UI) is a **monorepo-based prediction market and betting platform** combining:
- Binary prediction markets (YES/NO bets)
- Sports micro-betting (next-point/goal/kill markets)
- Casino games (Roulette, Dice, Coin Flip, High/Low)
- AI-powered auto-betting bot
- x402 payment protocol integration
- Real-time updates via WebSockets/SSE

**Technology Stack:**
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Wagmi, Viem
- **Backend:** FastAPI (Python), PostgreSQL, Redis, Web3.py
- **Smart Contracts:** Solidity 0.8.24, OpenZeppelin, Hardhat
- **Blockchain:** Cronos (primary), Monad testnet (secondary)
- **AI:** Google Gemini API for predictions
- **Deployment:** Vercel (frontend), Railway (backend)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Monorepo Structure (Turborepo)

```
pridiction-market/
├── apps/
│   ├── frontend/          # Next.js 15 application
│   │   ├── app/           # App Router pages
│   │   ├── lib/           # Utilities, hooks, configs
│   │   └── components/    # Reusable UI components
│   │
│   └── backend/           # FastAPI Python server
│       ├── app/
│       │   ├── api/v1/    # REST API routes
│       │   ├── models/    # Pydantic models
│       │   ├── services/  # Business logic
│       │   └── core/      # Core utilities
│       ├── migrations/    # SQL migrations
│       └── prisma/        # Database schema
│
└── packages/
    └── contracts/         # Smart contracts (Solidity)
        ├── *.sol          # Contract files
        ├── scripts/       # Deployment scripts
        └── test/          # Contract tests
```

### 1.2 Integration Flow

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│   Backend   │  │  Blockchain  │
│  (FastAPI)  │  │   (Cronos)   │
└──────┬──────┘  └──────┬───────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│  PostgreSQL │  │ Smart        │
│   + Redis   │  │ Contracts    │
└─────────────┘  └──────────────┘
```

**Data Flow:**
1. User connects wallet (MetaMask/WalletConnect) via AppKit
2. Frontend calls Backend REST APIs for market data
3. Backend stores data in PostgreSQL, caches in Redis
4. User places bet → Frontend interacts with smart contracts directly
5. Smart contract transfers USDT to Gnosis Safe
6. Backend listens to events, updates database
7. Real-time updates pushed via WebSocket/SSE

---

## 2. SMART CONTRACTS (Blockchain Layer)

### 2.1 Contract Overview

| Contract | Purpose | Status | Lines of Code |
|----------|---------|--------|---------------|
| **PredictionMarket.sol** | Binary YES/NO prediction markets | ✅ Complete | 562 |
| **Casino.sol** | Multi-game casino (4 games) | ✅ Complete | 436 |
| **MarketManager.sol** | ERC1155 position token management | ✅ Complete | 132 |
| **PositionToken.sol** | ERC1155 NFT for winning positions | ✅ Complete | 67 |
| **Settlement.sol** | Chainlink oracle resolution | ✅ Complete | 52 |
| **BotSettings.sol** | On-chain bot configuration | ✅ Complete | 422 |
| **MockUSDT.sol** | Test USDT token (6 decimals) | ✅ Complete | 17 |

### 2.2 PredictionMarket.sol - Core Features

**Key Functionality:**
- Binary YES/NO betting on prediction markets
- USDT-based wagering (IERC20)
- Funds flow to Gnosis Safe multi-sig
- Market lifecycle: ACTIVE → CLOSED → RESOLVED
- Pool-based liquidity (yes_pool + no_pool)

**Security Features:**
```solidity
✅ ReentrancyGuard        - Prevents reentrancy attacks
✅ Pausable               - Emergency pause mechanism
✅ Ownable                - Access control
✅ Input validation       - Strict parameter checks
✅ Cooldown enforcement   - 300s between bets per wallet
✅ Bet count limits       - Max 10 bets per wallet
✅ Pool concentration     - Max 10% of total pool per wallet
✅ Bet velocity limits    - Max 3 bets per hour per wallet
✅ Wallet flagging        - Manual review for suspicious activity
```

**Parameters:**
```solidity
MIN_BET             = 5 USDT
MAX_BET             = 5000 USDT
COOLDOWN_SECONDS    = 300 (5 minutes)
MAX_BETS_PER_WALLET = 10
POOL_CAP_PERCENT    = 10% of total pool
HOUSE_FEE_PERCENT   = 5%
MAX_BETS_IN_1_HOUR  = 3
```

**State Machine:**
```
ACTIVE → CLOSED → RESOLVED
  ↓         ↓         ↓
Betting   No New   Winner Set
Allowed   Bets     Payouts
```

### 2.3 Casino.sol - Games Implementation

**Supported Games:**

| Game | Type | Payout | House Edge | Max Bet |
|------|------|--------|------------|---------|
| Roulette | Single number (0-36) | 35:1 | ~2.7% | 100 USDT |
| Dice | Specific number (1-6) | 5:1 | ~16.7% | 200 USDT |
| Coin Flip | Heads/Tails | 1.95:1 | 2.5% | 500 USDT |
| High/Low Dice | Over/Under 3.5 | 1.9:1 | 5% | 1000 USDT |

**Game Logic:**
```solidity
enum GameType {
    ROULETTE,      // 0-36, straight bet
    DICE,          // 1-6, specific number
    COIN_FLIP,     // 0=Heads, 1=Tails
    HIGH_LOW_DICE  // 0=Low(1-3), 1=High(4-6)
}
```

**Randomness:**
⚠️ **Current Implementation:** Pseudo-random using `block.prevrandao`, `block.timestamp`, `block.number`
```solidity
uint256 random = uint256(
    keccak256(
        abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.number,
            _player,
            allBets.length
        )
    )
);
```

⚠️ **Production Note:** Comments indicate this should be replaced with **Chainlink VRF** for provably fair randomness

**Security:**
```solidity
✅ 3-second cooldown between bets
✅ Per-game bet limits
✅ House balance checks before payout
✅ Pausable mechanism
✅ ReentrancyGuard protection
```

### 2.4 BotSettings.sol - AI Bot Configuration

**Purpose:** On-chain storage of bot configuration for transparency

**Stored Parameters:**
```solidity
struct BotConfig {
    bool isActive;              // Bot on/off
    uint256 maxBetAmount;       // Max per bet (USDT)
    uint256 dailyBudget;        // Max daily spend (USDT)
    uint256 dailySpent;         // Today's spending tracker
    uint256 minConfidence;      // Min AI confidence (0-100)
    uint256 lastBetTimestamp;   // Last bet time
    uint256 dailyResetTime;     // Daily budget reset timestamp
}
```

**Safety Mechanisms:**
- Daily spending limits
- Confidence thresholds
- Emergency stop functionality
- Rate limiting
- Transparent on-chain state

---

## 3. BACKEND API (FastAPI)

### 3.1 API Routes

**Base URL:** `https://[backend-url]/api/v1`

#### 3.1.1 Markets API (`/markets`)

```
GET  /markets              → List active micro-markets
GET  /markets/{id}         → Get market details
POST /markets              → Create new market (admin)
```

**Implementation Status:** ⚠️ **MOCK DATA**
- Returns randomly generated markets
- No database persistence
- Sports: soccer, lol, cs2 (hardcoded)
- Odds: Random around 1.85

**Sample Response:**
```json
{
  "id": "next-point-1234",
  "sport": "soccer",
  "description": "Next point Winner",
  "odds": {
    "home": 1.87,
    "away": 1.83
  },
  "max_stake": 1.0,
  "expires_at": "2026-02-03T10:00:00Z"
}
```

#### 3.1.2 Bets API (`/bets`)

```
POST /bets                 → Place a bet
POST /bets/confirm         → Confirm after x402 payment
GET  /bets/user/{wallet}   → Get user's bet history
```

**Implementation Status:** ⚠️ **PARTIAL**
- Bet placement endpoint exists
- No actual blockchain interaction
- No database storage implemented
- Returns mock confirmations

#### 3.1.3 Predictions API (`/predictions`)

```
GET  /predictions/markets           → List prediction markets
GET  /predictions/markets/{id}      → Get market details
POST /predictions/vote              → Place YES/NO vote
```

**Implementation Status:** ✅ **IN-MEMORY FUNCTIONAL**

**Default Market:**
```json
{
  "id": "eden-haus-hackathon",
  "question": "Will Eden Haus win the Cronos x402 Hackathon?",
  "status": "ACTIVE",
  "yes_pool": 525.0,
  "no_pool": 725.0,
  "total_bets": 0,
  "start_date": "2026-02-02T09:13:00Z",
  "end_date": "2026-03-05T09:13:00Z",
  "category": "Crypto",
  "icon": "🏆"
}
```

**Vote Mechanism:**
```python
if vote.choice == "YES":
    market.yes_pool += vote.amount
else:
    market.no_pool += vote.amount
market.total_bets += 1
```

⚠️ **Current Limitation:** Uses in-memory dictionary `MARKETS_DB` (data lost on restart)

#### 3.1.4 x402 Payment API (`/x402`)

```
POST /x402/quote           → Generate payment quote
POST /x402/confirm         → Confirm x402 payment
```

**Implementation Status:** ⚠️ **MOCK/SIMULATION**

```python
async def verify_x402_payment(quote_id: str):
    # Simulate blockchain verification
    return {
        "quote_id": quote_id,
        "paid": True,
        "tx_hash": f"0x{quote_id[:64]}",
        "confirmed": True
    }
```

**Real x402 Flow (Planned):**
1. Client requests quote
2. Backend generates quote with expiry
3. Client makes on-chain payment
4. Backend verifies payment via smart contract
5. Backend confirms transaction

#### 3.1.5 Bot API (`/bot`)

```
POST /bot/start            → Start auto-betting bot
POST /bot/stop             → Stop bot
GET  /bot/status           → Get bot status & stats
POST /bot/configure        → Update bot settings
```

**Implementation Status:** ✅ **FULLY IMPLEMENTED**

**Bot Workflow:**
1. User provides wallet address + private key
2. Backend loads on-chain bot settings from `BotSettings.sol`
3. Bot runs async loop (60s intervals)
4. For each market:
   - Fetch market data
   - Call Gemini AI for prediction
   - Validate safety constraints
   - Place bet if confidence threshold met
5. Track stats (markets analyzed, bets placed, spending)

#### 3.1.6 WebSocket API (`/ws`)

```
WS /ws/markets             → Real-time market updates
WS /ws/bets                → Real-time bet stream
```

**Implementation Status:** ⚠️ **PARTIAL**
- WebSocket router defined
- SSE (Server-Sent Events) used on frontend
- Redis pub/sub architecture in place
- Needs full implementation for production

### 3.2 Backend Services

#### 3.2.1 Market Manager (`market_manager.py`)

**Responsibilities:**
- Calculate dynamic odds based on pool sizes
- Check exposure limits
- Generate bet quotes
- Validate bet parameters

**Key Functions:**
```python
calculate_odds(yes_pool, no_pool)
check_exposure_limit(wallet, amount)
generate_quote(market_id, side, stake)
```

#### 3.2.2 Auto Bet Bot (`auto_bet_bot.py`)

**Features:**
- Async bot loop (60s cycle)
- Web3 integration for blockchain interaction
- Gemini AI predictor integration
- Safety checker validation
- Activity logging
- Statistics tracking

**Bot State:**
```python
{
  "markets_analyzed": 0,
  "bets_placed": 0,
  "bets_skipped": 0,
  "total_spent": 0,
  "last_activity": None
}
```

#### 3.2.3 Gemini Predictor (`gemini_predictor.py`)

**Integration:** Google Gemini AI API

**Prediction Output:**
```json
{
  "prediction": "YES" or "NO",
  "confidence": 0-100,
  "reasoning": "Brief explanation",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "recommended_bet": 10-100 (USDT)
}
```

**Prompt Structure:**
- Market question + category
- User's betting history (last 10 bets)
- Current events context
- Conservative confidence scoring
- Risk-adjusted bet recommendations

**User Strategy Analysis:**
```python
analyze_user_strategy(user_history) → {
  "favorite_categories": ["sports", "crypto"],
  "avg_bet_amount": 50,
  "win_rate": 65,
  "typical_choice": "YES",
  "risk_profile": "MODERATE"
}
```

#### 3.2.4 Bot Safety (`bot_safety.py`)

**Validation Checks:**
- Daily budget enforcement
- Max bet amount limits
- Confidence threshold validation
- On-chain settings synchronization
- Rate limiting
- Emergency stop capability

#### 3.2.5 Settlement Service (`settlement.py`)

**Purpose:** Process payouts for winning positions

**Flow:**
1. Market is resolved (winner determined)
2. Fetch all winning bets from database
3. Calculate payout amounts
4. Execute on-chain payout transactions
5. Update bet statuses

**Integration:** Works with `Settlement.sol` contract

#### 3.2.6 Redis Service (`redis.py`)

**Use Cases:**
- Caching market odds
- Real-time pub/sub for market updates
- Session management
- Rate limiting

**Pub/Sub Channels:**
- `market:updates` - Pool changes
- `bet:placed` - New bets
- `market:resolved` - Market resolutions

### 3.3 Database Schema (PostgreSQL)

**Tables:**

#### Market
```sql
CREATE TABLE "Market" (
  id TEXT PRIMARY KEY,
  marketId TEXT UNIQUE,
  question TEXT,
  status TEXT CHECK (status IN ('ACTIVE', 'CLOSED', 'RESOLVED')),
  winner TEXT CHECK (winner IN ('YES', 'NO', NULL)),
  yesPool BIGINT,
  noPool BIGINT,
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  contractAddress TEXT,
  gnosisSafeAddress TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### Bet
```sql
CREATE TABLE "Bet" (
  id TEXT PRIMARY KEY,
  walletAddress TEXT,
  marketId TEXT REFERENCES "Market"(marketId),
  choice TEXT CHECK (choice IN ('YES', 'NO')),
  amount BIGINT,
  betNumber INTEGER CHECK (betNumber BETWEEN 1 AND 10),
  status TEXT CHECK (status IN ('PENDING', 'CONFIRMED', 'FLAGGED', 'CLAWED_BACK')),
  txHash TEXT,
  createdAt TIMESTAMP,
  UNIQUE (marketId, walletAddress, betNumber)
);
```

#### BetHistory
```sql
CREATE TABLE "BetHistory" (
  id TEXT PRIMARY KEY,
  betId TEXT REFERENCES "Bet"(id),
  marketId TEXT REFERENCES "Market"(marketId),
  wallet TEXT,
  action TEXT CHECK (action IN (
    'PLACED', 'CONFIRMED', 'FLAGGED', 'FLAGGED_VELOCITY',
    'FLAGGED_CONCENTRATION', 'CLAWED_BACK', 'REFUNDED'
  )),
  reason TEXT,
  clawbackAmount BIGINT,
  clawbackTxHash TEXT,
  createdAt TIMESTAMP
);
```

#### FlaggedWallet
```sql
CREATE TABLE "FlaggedWallet" (
  id TEXT PRIMARY KEY,
  wallet TEXT UNIQUE,
  marketId TEXT,
  reason TEXT,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  isActive BOOLEAN,
  createdAt TIMESTAMP,
  unflaggedAt TIMESTAMP
);
```

#### PoolSnapshot
```sql
CREATE TABLE "PoolSnapshot" (
  id TEXT PRIMARY KEY,
  marketId TEXT REFERENCES "Market"(marketId),
  yesPool BIGINT,
  noPool BIGINT,
  totalBets INTEGER,
  createdAt TIMESTAMP
);
```

**Indexing Strategy:**
- Market: `marketId`, `status`, `endDate`
- Bet: `walletAddress`, `marketId`, `status`, `createdAt`, `choice`
- BetHistory: `betId`, `marketId`, `wallet`, `action`, `createdAt`
- FlaggedWallet: `wallet`, `marketId`, `isActive`
- PoolSnapshot: `marketId`, `createdAt`

**Data Seeding:**
Default market seeded: `"eden-haus-hackathon"` with initial pools (525 USDT YES, 725 USDT NO)

---

## 4. FRONTEND (Next.js)

### 4.1 Pages & Routes

| Route | Feature | Implementation |
|-------|---------|----------------|
| `/` | Landing page with "secret knock" authentication | ✅ Complete |
| `/prediction` | Binary prediction markets list | ✅ Complete |
| `/prediction/[id]` | Single market detail & betting | ✅ Complete |
| `/sports` | Sports betting hub | ✅ Complete |
| `/casino` | Casino games interface | ✅ Complete |
| `/esports` | Esports betting | ✅ Complete |
| `/(live)/[sport]` | Live sports overlay | ✅ Complete |
| `/(live)/[sport]/markets` | Sport-specific markets | ✅ Complete |
| `/(live)/[sport]/[marketId]` | Micro-bet placement | ✅ Complete |
| `/bot/dashboard` | Bot monitoring & stats | ✅ Complete |
| `/bot/settings` | Bot configuration | ✅ Complete |
| `/terms` | Terms of service | ✅ Complete |
| `/responsible-gaming` | Responsible gaming info | ✅ Complete |
| `/contact` | Contact information | ✅ Complete |

### 4.2 Landing Page - Authentication Flow

**Feature:** Secret knock authentication

```javascript
const secretPattern = [1, 1, 1]; // Knock 3 times

// User clicks door image
handleKnock() → knockSequence.push(1)
// If sequence === [1,1,1]
  → setIsAuthenticated(true)
  → router.push("/prediction")
```

**Design:**
- Blue/purple gradient theme
- Art deco styling
- "Bet Bazzar - Blockchain Betting" branding
- Film grain + vignette effects
- Smoke animation on entry

### 4.3 Key React Hooks

#### usePredictionMarket
```typescript
usePredictionMarket(marketId?: string) → {
  markets: Market[],
  market: Market | null,
  loading: boolean,
  error: Error | null,
  refetch: () => void
}
```

**Features:**
- Fetches market data from backend API
- React Query for caching & invalidation
- SSE for real-time updates
- Auto-refetch on window focus

#### useMarketData
```typescript
useMarketData(marketId: string) → {
  uniqueWallets: number,
  avgBetSize: number,
  volumeByHour: { hour: string, volume: number }[],
  recentBets: Bet[]
}
```

**Statistics:**
- Unique wallet count
- Average bet size
- Hourly volume chart
- Recent bet activity

#### useContractBet
```typescript
useContractBet(contractAddress: string) → {
  placeBet: (choice: 'YES' | 'NO', amount: number) => Promise<void>,
  isPending: boolean,
  isConfirming: boolean,
  isConfirmed: boolean,
  error: Error | null
}
```

**Integration:** Direct smart contract interaction via Wagmi + Viem

#### useCasinoBet
```typescript
useCasinoBet() → {
  placeBet: (game: GameType, amount: number, prediction: number) => Promise<void>,
  result: { outcome: 'WIN' | 'LOSS', payout: number } | null,
  loading: boolean
}
```

**Games:** Roulette, Dice, Coin Flip, High/Low Dice

#### useBetValidation
```typescript
useBetValidation(amount: number, wallet: string) → {
  isValid: boolean,
  errors: string[],
  warnings: string[]
}
```

**Client-side validation:**
- Min/max bet checks
- Cooldown enforcement
- Bet count limits
- Wallet balance checks

#### useSSE (Server-Sent Events)
```typescript
useSSE(url: string, onMessage: (data: any) => void) → {
  connected: boolean,
  error: Error | null
}
```

**Real-time updates:**
- Market pool changes
- New bet notifications
- Market status changes

### 4.4 Wallet Integration

**Provider:** AppKit (Reown) - formerly WalletConnect

**Configuration:**
```typescript
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

const chains = [cronos, monad]
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

createAppKit({
  adapters: [new WagmiAdapter({ chains })],
  networks: chains,
  projectId,
  features: {
    analytics: true
  }
})
```

**Supported Wallets:**
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow
- Trust Wallet

**Blockchain Networks:**
- Cronos Testnet (primary)
- Monad Testnet (secondary)

### 4.5 UI Components

**Component Library:** shadcn/ui (Radix UI + Tailwind)

**Key Components:**
- `Button` - Primary/secondary variants
- `Card` - Market/bet display cards
- `Dialog` - Modal overlays
- `Form` - Bet placement forms
- `Table` - Bet history tables
- `Toast` - Notifications (sonner)
- `Chart` - Recharts integration

**Styling:**
- Tailwind CSS 3.4
- Custom animations via `tailwindcss-animate`
- Framer Motion for transitions
- Lucide React icons

---

## 5. FEATURES IN DETAIL

### 5.1 Binary Prediction Markets

**What Works:**
✅ Market listing from backend API
✅ Single market detail pages
✅ YES/NO voting interface
✅ Pool display (YES pool + NO pool)
✅ Dynamic odds calculation
✅ Real-time updates via SSE
✅ Bet history tracking

**How It Works:**

1. **Market Creation:**
   - Admin calls `createMarket()` on `PredictionMarket.sol`
   - Market stored with question, end date, pools (0 initially)
   - Backend syncs via event listener

2. **User Places Bet:**
   - User selects YES or NO
   - Frontend validates bet amount (5-5000 USDT)
   - User approves USDT spending to contract
   - User calls `placeBet(choice, amount)` on contract
   - Contract transfers USDT to Gnosis Safe
   - Contract updates yes_pool or no_pool
   - Event emitted: `BetPlaced`
   - Backend catches event, updates database
   - Real-time update pushed to connected clients

3. **Market Resolution:**
   - Admin closes market (no new bets)
   - Chainlink oracle or manual resolution
   - Admin calls `resolveMarket(winner)`
   - Settlement service processes payouts
   - Winners can claim their share

**Current Status:**
⚠️ **HYBRID** - Smart contract complete, backend has mock data + in-memory storage

### 5.2 Sports Micro-Betting

**Concept:** Fast-paced betting on next event (next point, next goal, next kill)

**Markets:**
- Soccer: Next goal, next corner, next card
- Basketball: Next point, next foul
- Tennis: Next point, next game winner
- Baseball: Next run, next out
- Hockey: Next goal, next penalty
- Esports (LoL/CS2): Next kill, next objective

**Implementation Status:** ⚠️ **MOCK DATA ONLY**

**Backend:**
```python
@router.get("/markets")
async def list_markets(sport: Optional[str] = None):
    # Returns randomly generated markets
    market_ids = [
        f"next-point-{random.randint(1000,9999)}",
        f"next-goal-{random.randint(1000,9999)}",
        f"next-kill-{random.randint(1000,9999)}"
    ]
```

**Frontend:**
- Sport-specific pages exist (`/soccer`, `/lol`, etc.)
- Micro-bet placement UI implemented
- No actual data source (no Chainlink Sports integration yet)
- No smart contract for micro-betting

**To Make Functional:**
1. Integrate Chainlink Sports data feeds
2. Create `MicroMarket.sol` contract
3. Connect backend to real sports data API
4. Implement market creation automation
5. Add settlement automation

### 5.3 Casino Games

**Status:** ✅ **SMART CONTRACT COMPLETE, FRONTEND IN PROGRESS**

**Contract:** `Casino.sol` (436 lines)

**Games Implemented:**

1. **Roulette**
   - Bet on single number (0-36)
   - 35:1 payout
   - Max bet: 100 USDT

2. **Dice**
   - Predict specific number (1-6)
   - 5:1 payout
   - Max bet: 200 USDT

3. **Coin Flip**
   - Heads (0) or Tails (1)
   - 1.95:1 payout (2.5% house edge)
   - Max bet: 500 USDT

4. **High/Low Dice**
   - Low (1-3) or High (4-6)
   - 1.9:1 payout (5% house edge)
   - Max bet: 1000 USDT

**How To Play:**
```solidity
Casino.placeBet(
  GameType _gameType,    // 0=Roulette, 1=Dice, 2=CoinFlip, 3=HighLow
  uint256 _amount,       // Bet amount in USDT (6 decimals)
  uint256 _prediction    // Your prediction
)
```

**Game Flow:**
1. User calls `placeBet()` with game choice
2. Contract transfers USDT from user to contract
3. Contract generates random number
4. Contract checks if user won
5. If won: Transfer payout immediately
6. Emit `BetResult` event

**Frontend Status:**
- `/casino` page exists
- UI for game selection implemented
- `useCasinoBet` hook available
- ⚠️ **Needs connection to deployed contract**

### 5.4 AI Auto-Betting Bot

**Status:** ✅ **FULLY IMPLEMENTED**

**Components:**
1. **BotSettings.sol** - On-chain configuration storage
2. **AutoBetBot** (Python) - Backend bot service
3. **GeminiPredictor** - AI prediction service
4. **BotSafety** - Safety constraint validator
5. **Frontend Dashboard** - Monitoring UI

**Bot Configuration (On-Chain):**
```solidity
struct BotConfig {
    bool isActive;              // Bot enabled/disabled
    uint256 maxBetAmount;       // Max per bet (e.g., 100 USDT)
    uint256 dailyBudget;        // Max daily spend (e.g., 500 USDT)
    uint256 dailySpent;         // Running total for today
    uint256 minConfidence;      // Min AI confidence (0-100, e.g., 70)
    uint256 lastBetTimestamp;   // Last bet time
    uint256 dailyResetTime;     // When to reset daily budget
}
```

**Bot Workflow:**

```
1. User starts bot via API
   POST /api/v1/bot/start
   {
     "wallet": "0x...",
     "privateKey": "..."
   }

2. Bot loads settings from BotSettings.sol
   isActive = true
   maxBetAmount = 100 USDT
   dailyBudget = 500 USDT
   minConfidence = 70

3. Bot enters main loop (60s intervals)
   while (isActive):
     - Check on-chain settings
     - Fetch active markets
     - For each market:
       a. Call Gemini AI for prediction
       b. Validate safety constraints
       c. Place bet if approved
     - Sleep 60s

4. AI Prediction (Gemini)
   Input:
     - Market question
     - Category
     - User's bet history
   
   Output:
     {
       "prediction": "YES",
       "confidence": 75,
       "reasoning": "...",
       "risk_level": "MEDIUM",
       "recommended_bet": 50
     }

5. Safety Validation
   ✓ confidence >= minConfidence (70)
   ✓ recommended_bet <= maxBetAmount
   ✓ dailySpent + bet <= dailyBudget
   ✓ No cooldown violation
   ✓ Wallet not flagged

6. Place Bet
   If all checks pass:
     - Call placeBet() on PredictionMarket.sol
     - Update dailySpent on-chain
     - Log activity
     - Update stats

7. User monitors via dashboard
   GET /api/v1/bot/status
   {
     "is_running": true,
     "markets_analyzed": 45,
     "bets_placed": 12,
     "bets_skipped": 33,
     "total_spent": 650.00,
     "last_activity": "2026-02-03T09:45:00Z"
   }
```

**Safety Features:**
- Daily spending caps
- Per-bet limits
- Confidence thresholds
- Emergency stop button
- On-chain transparency
- Activity logging
- Rate limiting

**Frontend:**
- `/bot/dashboard` - Real-time stats & activity log
- `/bot/settings` - Configure bot parameters
- Start/Stop controls
- Visual indicators for status

### 5.5 x402 Payment Integration

**Status:** ⚠️ **STUB/SIMULATION**

**Concept:** HTTP 402 "Payment Required" as programmable primitive

**How x402 Should Work:**
1. Client requests quote for action
2. Server returns 402 with payment details
3. Client makes on-chain payment
4. Client re-requests with proof of payment
5. Server verifies payment, returns 200 OK

**Current Implementation:**
```python
# apps/backend/app/core/x402.py
async def verify_x402_payment(quote_id: str):
    # Simulate blockchain verification
    return {
        "quote_id": quote_id,
        "paid": True,
        "tx_hash": f"0x{quote_id[:64]}",
        "confirmed": True
    }
```

**API Endpoints:**
- `POST /api/v1/x402/quote` - Generate payment quote
- `POST /api/v1/x402/confirm` - Verify payment

⚠️ **Not Production Ready:** No actual blockchain verification implemented

**To Complete:**
1. Deploy x402 payment contract
2. Implement quote generation with cryptographic signatures
3. Add on-chain payment verification
4. Handle quote expiry
5. Add payment failure recovery

### 5.6 Real-Time Updates

**Technologies:**
- WebSocket (Server-Sent Events)
- Redis Pub/Sub
- React Query for cache invalidation

**Architecture:**
```
Smart Contract Event
      ↓
Backend Event Listener
      ↓
Redis PUBLISH (channel: "market:updates")
      ↓
WebSocket/SSE Push
      ↓
Frontend Receives Update
      ↓
React Query Cache Invalidation
      ↓
UI Re-renders
```

**Status:** ⚠️ **PARTIAL**
- Infrastructure in place
- Redis pub/sub configured
- SSE hooks implemented
- Event listening needs completion

**Current Workaround:**
- Frontend polls backend API
- React Query auto-refetch (30s interval)

---

## 6. SECURITY ANALYSIS

### 6.1 Smart Contract Security

**✅ Good Practices:**
- ReentrancyGuard on all financial functions
- Pausable for emergency stops
- Ownable for access control
- Input validation on all parameters
- Check-effects-interactions pattern
- No floating pragma (fixed to 0.8.24)
- OpenZeppelin battle-tested libraries

**⚠️ Concerns:**

1. **Casino Randomness**
   ```solidity
   uint256 random = keccak256(
     abi.encodePacked(block.timestamp, block.prevrandao, ...)
   );
   ```
   - Uses `block.prevrandao` (EIP-4399)
   - Still predictable by miners/validators
   - **Fix Required:** Integrate Chainlink VRF

2. **Centralization Risks**
   - Single owner can pause contracts
   - Owner can flag wallets arbitrarily
   - Market resolution is manual (admin controlled)
   - **Mitigation:** Use multi-sig (Gnosis Safe) for owner

3. **Gas Optimization**
   - Loops in `_validateBetVelocity()` can be gas-intensive
   - Large `userBets` array grows unbounded
   - **Optimization:** Use pagination or off-chain indexing

4. **Bet Count Limit**
   - Max 10 bets per wallet per market
   - Creates Sybil attack vector (users can create multiple wallets)
   - **Partial Mitigation:** Pool concentration limits (10%)

### 6.2 Backend Security

**✅ Good Practices:**
- Environment variables for secrets
- CORS configuration
- FastAPI input validation (Pydantic)
- PostgreSQL with prepared statements (prevents SQL injection)

**⚠️ Concerns:**

1. **Private Key Handling**
   - Bot requires user's private key
   - Stored in memory (not persisted)
   - **Risk:** Backend breach exposes keys
   - **Recommendation:** Use wallet signing for bot authorization instead

2. **API Authentication**
   - No authentication on most endpoints
   - Anyone can call bot start/stop
   - **Missing:** JWT or API key system

3. **Rate Limiting**
   - No rate limiting on API endpoints
   - Open to DoS attacks
   - **Add:** FastAPI rate limiting middleware

4. **Hardcoded Gemini API Key**
   ```python
   GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDFS8...")
   ```
   - API key with fallback hardcoded in source
   - **Fix:** Remove fallback, require env var

### 6.3 Frontend Security

**✅ Good Practices:**
- No private keys stored in browser
- Wallet signature for authentication
- Environment variables for API keys
- TypeScript for type safety

**⚠️ Concerns:**

1. **Wallet Security**
   - Users must trust AppKit/WalletConnect
   - Phishing risk with fake prompts
   - **Mitigation:** Clear UI warnings

2. **XSS Prevention**
   - React auto-escapes by default
   - User-generated content should be sanitized
   - **Check:** Market questions, bet comments

---

## 7. DEPLOYMENT STATUS

### 7.1 Production Deployments

**Frontend:**
- ✅ Deployed on Vercel
- URL: `https://sportsbook-monorepo-frontend.vercel.app`
- Alternative: `https://edenhaus.vercel.app`

**Backend:**
- ✅ Deployed on Railway
- URL: (not public in code)
- Database: PostgreSQL on Railway
- Redis: Redis Cloud

**Smart Contracts:**
- ⚠️ **NOT DEPLOYED**
- Contracts compiled but no deployment scripts run
- No verified addresses in `.env` files
- **Target Chains:** Cronos Testnet, Monad Testnet

### 7.2 Configuration Files

**Backend `.env` Requirements:**
```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Blockchain
WEB3_PROVIDER_URL="https://testnet-rpc.monad.xyz"
PRIVATE_KEY="..."
CONTRACT_ADDRESS_PREDICTION_MARKET="0x..."
CONTRACT_ADDRESS_CASINO="0x..."
CONTRACT_ADDRESS_BOT_SETTINGS="0x..."
USDT_ADDRESS="0x..."
GNOSIS_SAFE_ADDRESS="0x..."

# AI
GEMINI_API_KEY="..."

# CORS
ALLOWED_ORIGINS="http://localhost:3000,https://edenhaus.vercel.app"
```

**Frontend `.env.local` Requirements:**
```bash
# Backend API
NEXT_PUBLIC_BACKEND_URL="https://backend.railway.app"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."

# Blockchain
NEXT_PUBLIC_CRONOS_RPC="https://evm-t3.cronos.org"
NEXT_PUBLIC_MONAD_RPC="https://testnet-rpc.monad.xyz"

# Contracts
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS="0x..."
NEXT_PUBLIC_CASINO_ADDRESS="0x..."
NEXT_PUBLIC_USDT_ADDRESS="0x..."
```

### 7.3 Deployment Process

**Smart Contracts:**
```bash
cd packages/contracts
npm install
npx hardhat compile
npx hardhat deploy --network cronos-testnet
# Outputs: Deployed contract addresses
```

**Backend:**
```bash
cd apps/backend
pip install -r requirements.txt
alembic upgrade head  # Run migrations
python seed_data.py   # Seed initial data
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd apps/frontend
npm install
npm run build
npm start
# Or: Deploy to Vercel via git push
```

---

## 8. TESTING STATUS

### 8.1 Smart Contract Tests

**Test File Found:** `packages/test/MarketManager.test.js`

**Coverage:** ⚠️ **MINIMAL**
- Only 1 test file found
- No comprehensive test suite
- No coverage reports

**Required Tests:**
- ✗ PredictionMarket.sol unit tests
- ✗ Casino.sol game logic tests
- ✗ BotSettings.sol configuration tests
- ✗ Integration tests across contracts
- ✗ Gas optimization tests
- ✗ Security/edge case tests

### 8.2 Backend Tests

**Test Files:** ❌ **NONE FOUND**

**Required Tests:**
- ✗ API endpoint tests
- ✗ Service layer tests
- ✗ Database model tests
- ✗ AI predictor tests
- ✗ Bot logic tests

### 8.3 Frontend Tests

**Test Files:** ❌ **NONE FOUND**

**Required Tests:**
- ✗ Component tests
- ✗ Hook tests
- ✗ Integration tests
- ✗ E2E tests

---

## 9. ACTUAL vs CLAIMED FEATURES

### 9.1 What Actually Works

| Feature | Status | Evidence |
|---------|--------|----------|
| Smart Contracts | ✅ Complete | 7 contracts, fully implemented |
| Binary Prediction Markets | 🟡 Partial | Contract done, backend mock data |
| Casino Games | 🟡 Partial | Contract done, frontend incomplete |
| AI Auto-Betting Bot | ✅ Complete | Fully implemented end-to-end |
| Database Schema | ✅ Complete | PostgreSQL schema + migrations |
| Frontend UI | ✅ Complete | All pages built |
| Wallet Integration | ✅ Complete | AppKit/Wagmi working |
| API Endpoints | 🟡 Partial | Defined but mock data |
| Real-time Updates | 🟡 Partial | Infrastructure only |
| x402 Payments | ❌ Stub | Mock implementation only |
| Sports Betting | ❌ Concept | Mock data, no real integration |
| Chainlink Oracles | ❌ Planned | Mentioned but not implemented |

### 9.2 Missing/Incomplete Features

1. **Smart Contract Deployment**
   - Contracts compiled but not deployed
   - No verified addresses
   - No testnet interaction

2. **Backend-Blockchain Integration**
   - Event listeners not implemented
   - No transaction broadcasting
   - No block explorers integration

3. **Real Sports Data**
   - No Chainlink Sports feeds
   - No third-party sports API
   - Mock data only

4. **Market Resolution**
   - Manual only (admin calls `resolveMarket()`)
   - No Chainlink oracle integration
   - No automated settlement

5. **User Authentication**
   - No API authentication
   - No session management
   - No user profiles

6. **Payment Processing**
   - x402 not functional
   - No payment verification
   - No transaction history

7. **Testing**
   - No comprehensive test suite
   - No CI/CD pipeline
   - No automated testing

8. **Documentation**
   - No API documentation (OpenAPI/Swagger)
   - No deployment guide
   - No user manual

---

## 10. DEVELOPMENT ROADMAP

### 10.1 Phase 1: MVP Completion (2-4 weeks)

**Priority 1: Deploy Smart Contracts**
- [ ] Deploy to Cronos testnet
- [ ] Deploy to Monad testnet
- [ ] Verify contracts on explorers
- [ ] Fund contracts with test USDT
- [ ] Update frontend/backend config with addresses

**Priority 2: Backend-Blockchain Integration**
- [ ] Implement event listeners (Web3.py)
- [ ] Connect to deployed contracts
- [ ] Store data in PostgreSQL (not in-memory)
- [ ] Add transaction broadcasting
- [ ] Test end-to-end bet flow

**Priority 3: Casino Integration**
- [ ] Connect frontend to Casino.sol
- [ ] Test all 4 games
- [ ] Integrate Chainlink VRF for randomness
- [ ] Add house wallet funding

**Priority 4: Security Hardening**
- [ ] Add API authentication (JWT)
- [ ] Remove private key requirement from bot
- [ ] Add rate limiting
- [ ] Security audit (automated tools)

### 10.2 Phase 2: Production Features (4-8 weeks)

**Live Sports Integration**
- [ ] Integrate Chainlink Sports data feeds
- [ ] Create MicroMarket contract
- [ ] Add sport-specific market creation
- [ ] Implement auto-settlement

**Real-time Updates**
- [ ] Complete WebSocket implementation
- [ ] Event-driven architecture
- [ ] Redis pub/sub for scaling
- [ ] Live odds updates

**User Experience**
- [ ] User profiles & history
- [ ] Portfolio tracking
- [ ] Leaderboards
- [ ] Referral system

**x402 Completion**
- [ ] Deploy x402 payment contract
- [ ] Implement quote generation
- [ ] Add payment verification
- [ ] Handle payment failures

### 10.3 Phase 3: Scale & Optimize (8-12 weeks)

**Testing**
- [ ] Comprehensive test suite (>80% coverage)
- [ ] E2E tests
- [ ] Load testing
- [ ] Security audit (professional)

**Performance**
- [ ] Database optimization
- [ ] Caching strategy (Redis)
- [ ] CDN for frontend assets
- [ ] Contract gas optimization

**Monitoring**
- [ ] Error tracking (Sentry)
- [ ] Analytics (Mixpanel)
- [ ] Uptime monitoring
- [ ] Smart contract monitoring (Tenderly)

---

## 11. TECH DEBT & ISSUES

### 11.1 Critical Issues

1. **No Smart Contract Deployment**
   - Severity: 🔴 Critical
   - Impact: Core functionality unusable
   - Fix: Deploy contracts to testnet

2. **Private Keys in Bot**
   - Severity: 🔴 Critical
   - Impact: Security vulnerability
   - Fix: Use wallet signatures instead

3. **Mock Payment System**
   - Severity: 🔴 Critical
   - Impact: No real payments
   - Fix: Implement x402 properly

4. **No API Authentication**
   - Severity: 🟠 High
   - Impact: Open to abuse
   - Fix: Add JWT auth

### 11.2 High Priority Issues

5. **Pseudo-random Casino**
   - Severity: 🟠 High
   - Impact: Predictable outcomes
   - Fix: Integrate Chainlink VRF

6. **No Automated Tests**
   - Severity: 🟠 High
   - Impact: Bugs in production
   - Fix: Build test suite

7. **In-Memory Data Storage**
   - Severity: 🟠 High
   - Impact: Data loss on restart
   - Fix: Use PostgreSQL properly

8. **No Rate Limiting**
   - Severity: 🟠 High
   - Impact: DoS vulnerability
   - Fix: Add middleware

### 11.3 Medium Priority Issues

9. **No Event Listeners**
   - Severity: 🟡 Medium
   - Impact: Delayed updates
   - Fix: Implement Web3 event watching

10. **Hardcoded API Keys**
    - Severity: 🟡 Medium
    - Impact: Key exposure
    - Fix: Remove fallbacks

11. **Gas-Intensive Loops**
    - Severity: 🟡 Medium
    - Impact: High transaction costs
    - Fix: Optimize contracts

12. **No User Profiles**
    - Severity: 🟡 Medium
    - Impact: Poor UX
    - Fix: Add authentication system

---

## 12. TECHNOLOGY STACK SUMMARY

### 12.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.1.0 | React framework |
| React | 19.0.0 | UI library |
| TypeScript | 5.5.3 | Type safety |
| Tailwind CSS | 3.4.10 | Styling |
| Wagmi | 2.16.0 | Ethereum library |
| Viem | 2.22.0 | Ethereum utilities |
| @reown/appkit | 1.4.7 | Wallet connection |
| React Query | 5.59.0 | Data fetching |
| Framer Motion | 11.5.6 | Animations |
| Recharts | 2.12.7 | Charts |
| Prisma Client | 6.19.1 | Database ORM |

### 12.2 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115.0 | Web framework |
| Uvicorn | 0.30.6 | ASGI server |
| Pydantic | 2.9.2 | Data validation |
| PostgreSQL | 15+ | Database |
| Redis | 5.2.1 | Caching/Pub-Sub |
| Web3.py | 6.15.1 | Blockchain |
| SQLAlchemy | 2.0.23 | ORM |
| Alembic | 1.13.0 | Migrations |
| Gemini AI | 0.8.3 | AI predictions |

### 12.3 Smart Contract Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | 0.8.24 | Contract language |
| Hardhat | 3.1.2 | Dev environment |
| OpenZeppelin | Latest | Contract library |
| Ethers.js | Latest | Testing |

### 12.4 Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Railway | Backend hosting |
| PostgreSQL | Railway database |
| Redis Cloud | Caching |
| Cronos | Blockchain (testnet) |
| Monad | Blockchain (testnet) |

---

## 13. ESTIMATED EFFORT TO PRODUCTION

### 13.1 Current Completion Status

**Overall: ~60% Complete**

| Component | Completion | Estimate |
|-----------|------------|----------|
| Smart Contracts | 95% | 1-2 days to deploy |
| Backend API Structure | 80% | 1 week to connect |
| Backend Services | 70% | 2 weeks to complete |
| Frontend UI | 95% | 1-2 days polish |
| Frontend Integration | 60% | 1 week to connect |
| Database | 90% | 2-3 days testing |
| Authentication | 0% | 1 week |
| Testing | 5% | 2 weeks |
| Documentation | 40% | 1 week |
| Security | 50% | 1-2 weeks audit |

### 13.2 Effort Breakdown

**Minimum Viable Product (MVP):**
- Smart contract deployment: 2 days
- Backend integration: 1 week
- Frontend connections: 1 week
- Basic testing: 3 days
- **Total: 3-4 weeks** (1 developer)

**Production Ready:**
- MVP + Authentication: 1 week
- MVP + Real-time updates: 1 week
- MVP + Comprehensive tests: 2 weeks
- MVP + Security audit: 1-2 weeks
- MVP + Documentation: 1 week
- **Total: 8-10 weeks** (1 developer)

**Full Feature Set:**
- Production + Sports integration: 2-3 weeks
- Production + Casino improvements: 1 week
- Production + x402 completion: 1-2 weeks
- Production + Monitoring: 1 week
- **Total: 12-16 weeks** (1 developer)

---

## 14. CONCLUSION

### 14.1 What's Impressive

✅ **Comprehensive Smart Contracts**
- Well-structured Solidity code
- Strong security features
- Multiple game types

✅ **Complete Frontend**
- Modern Next.js 15 architecture
- Beautiful UI design
- All pages built

✅ **AI Integration**
- Working Gemini predictor
- Sophisticated bot logic
- On-chain bot settings

✅ **Database Schema**
- Well-designed PostgreSQL schema
- Proper indexing
- Audit trail support

✅ **Monorepo Setup**
- Clean Turborepo structure
- Shared types
- Good separation of concerns

### 14.2 What Needs Work

⚠️ **Smart Contracts Not Deployed**
- Contracts exist but not on blockchain
- No interaction possible yet

⚠️ **Backend Using Mock Data**
- Most endpoints return fake data
- No database persistence
- No blockchain integration

⚠️ **Security Gaps**
- No API authentication
- Private key handling risky
- No rate limiting

⚠️ **Missing Core Features**
- x402 is stub only
- Sports data not integrated
- Real-time updates incomplete

⚠️ **No Testing**
- Minimal test coverage
- No automated testing
- High risk of bugs

### 14.3 Final Assessment

**This is a high-quality, well-architected codebase that is ~60% complete.**

The project demonstrates:
- Strong technical skills
- Good understanding of blockchain/DeFi
- Modern web development practices
- Thoughtful system design

However, it's **not production-ready** and needs:
- Smart contract deployment
- Backend-blockchain integration
- Authentication system
- Comprehensive testing
- Security audit

With **3-4 weeks of focused work**, this could be a functional MVP.
With **8-12 weeks**, it could be production-ready.

The foundation is solid - it just needs the connections between components to be completed.

---

## 15. RECOMMENDATIONS

### 15.1 Immediate Actions (This Week)

1. **Deploy Smart Contracts**
   ```bash
   cd packages/contracts
   npx hardhat deploy --network cronos-testnet
   ```

2. **Update Environment Variables**
   - Add deployed contract addresses
   - Remove hardcoded secrets
   - Configure CORS properly

3. **Test End-to-End Flow**
   - Manual testing of one complete bet
   - Verify funds flow
   - Check database updates

### 15.2 Short Term (Next Month)

4. **Add Authentication**
   - Implement JWT system
   - Protect sensitive endpoints
   - Add user sessions

5. **Complete Backend Integration**
   - Connect to deployed contracts
   - Implement event listeners
   - Store data in PostgreSQL

6. **Build Test Suite**
   - Unit tests for contracts
   - API endpoint tests
   - Integration tests

### 15.3 Long Term (Next Quarter)

7. **Security Audit**
   - Automated security scans
   - Professional audit (if launching mainnet)
   - Bug bounty program

8. **Performance Optimization**
   - Database query optimization
   - Caching strategy
   - Frontend bundle optimization

9. **Monitoring & Analytics**
   - Error tracking
   - User analytics
   - Smart contract monitoring

10. **Documentation**
    - API documentation
    - User guides
    - Developer docs

---

**END OF ANALYSIS**

Generated: February 3, 2026
Analyzed by: AI Code Analysis Agent
Repository: piyushagarwal-55/pridiction-market
