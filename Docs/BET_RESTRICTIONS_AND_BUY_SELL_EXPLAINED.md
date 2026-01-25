# 🚫 Bet Restrictions & Buy/Sell Explained

## Part 1: When Users CANNOT Place Multiple Bets

Your smart contract has **6 security restrictions** that prevent users from placing bets. Let me explain each one:

---

## 🔒 The 6 Betting Restrictions

### ❌ RESTRICTION 1: Cooldown Period (300 seconds = 5 minutes)

**Rule:** User must wait 5 minutes between bets

**Code:**
```solidity
uint256 public constant COOLDOWN_SECONDS = 300;

function _validateCooldown(address _wallet) internal view {
    uint256 timeSinceLastBet = block.timestamp - lastBetTimestamp[_wallet];
    require(
        timeSinceLastBet >= COOLDOWN_SECONDS,
        "Cooldown period not met (300s required)"
    );
}
```

**Example:**
```
User places bet at 10:00 AM
├─ Bet #1: ✅ Success
│
User tries to bet at 10:02 AM (2 minutes later)
├─ Bet #2: ❌ REJECTED
└─ Error: "Cooldown period not met (300s required)"
   Must wait until 10:05 AM

User tries to bet at 10:05 AM (5 minutes later)
└─ Bet #2: ✅ Success
```

**Why this exists:**
- Prevents spam attacks
- Stops bots from manipulating pools rapidly
- Gives time for pool prices to stabilize

---

### ❌ RESTRICTION 2: Maximum Bets Per Wallet (10 bets)

**Rule:** Each wallet can only place 10 bets total in one market

**Code:**
```solidity
uint256 public constant MAX_BETS_PER_WALLET = 10;

function _validateBetCount(address _wallet) internal view {
    uint256 currentBetCount = betCountPerWallet[_wallet];
    require(
        currentBetCount < MAX_BETS_PER_WALLET,
        "Maximum bets per wallet reached (10)"
    );
}
```

**Example:**
```
User's Betting History:
├─ Bet #1: 100 USDT YES ✅
├─ Bet #2: 50 USDT YES ✅
├─ Bet #3: 200 USDT NO ✅
├─ Bet #4: 150 USDT YES ✅
├─ Bet #5: 100 USDT NO ✅
├─ Bet #6: 75 USDT YES ✅
├─ Bet #7: 300 USDT YES ✅
├─ Bet #8: 125 USDT NO ✅
├─ Bet #9: 200 USDT YES ✅
└─ Bet #10: 100 USDT YES ✅

User tries Bet #11:
└─ ❌ REJECTED
   Error: "Maximum bets per wallet reached (10)"
```

**Why this exists:**
- Prevents one user from dominating the market
- Encourages fair distribution of bets
- Limits exposure per wallet

**Workaround:** User can create a new wallet to place more bets (but this is discouraged)

---

### ❌ RESTRICTION 3: Pool Cap (10% maximum exposure)

**Rule:** One wallet cannot control more than 10% of the total pool

**Code:**
```solidity
uint256 public constant POOL_CAP_PERCENT = 10;

function _validatePoolCap(address _wallet, uint256 _amount) internal view {
    uint256 totalPool = market.yesPool + market.noPool;
    uint256 maxWalletExposure = totalPool > 0
        ? (totalPool * POOL_CAP_PERCENT) / 100
        : MAX_BET * 10;

    uint256 walletTotalBets = getWalletTotalBets(_wallet);
    require(
        walletTotalBets + _amount <= maxWalletExposure,
        "Bet exceeds wallet pool cap (10%)"
    );
}
```

**Example:**
```
Current Market State:
├─ YES Pool: 5,000 USDT
├─ NO Pool: 3,000 USDT
└─ Total Pool: 8,000 USDT

Max per wallet: 8,000 * 10% = 800 USDT

User A's History:
├─ Bet #1: 200 USDT YES
├─ Bet #2: 300 USDT YES
└─ Total: 500 USDT

User A tries to bet 400 USDT:
├─ New total would be: 500 + 400 = 900 USDT
├─ Max allowed: 800 USDT
└─ ❌ REJECTED
   Error: "Bet exceeds wallet pool cap (10%)"

User A can only bet: 800 - 500 = 300 USDT more
```

**Why this exists:**
- Prevents whales from controlling the market
- Ensures decentralization
- Protects against market manipulation

---

### ❌ RESTRICTION 4: Bet Velocity (3 bets per hour)

**Rule:** Maximum 3 bets in any 1-hour period

**Code:**
```solidity
uint256 public constant MAX_BETS_IN_1_HOUR = 3;

function _validateBetVelocity(address _wallet) internal view {
    uint256 oneHourAgo = block.timestamp - 3600;
    uint256 recentBets = 0;

    uint256[] storage timestamps = walletBetTimestamps[_wallet];
    
    for (uint256 i = timestamps.length - 1; ; i--) {
        if (timestamps[i] >= oneHourAgo) {
            recentBets++;
        }
        if (i == 0) break;
    }

    require(
        recentBets < MAX_BETS_IN_1_HOUR,
        "Bet velocity limit exceeded (max 3 per hour)"
    );
}
```

**Example:**
```
Timeline:
10:00 AM - Bet #1: ✅ Success (1 bet in last hour)
10:10 AM - Bet #2: ✅ Success (2 bets in last hour)
10:20 AM - Bet #3: ✅ Success (3 bets in last hour)
10:30 AM - Bet #4: ❌ REJECTED
           Error: "Bet velocity limit exceeded (max 3 per hour)"
           Must wait until 11:00 AM

11:00 AM - Bet #1 is now >1 hour old
           Only 2 bets in last hour (Bet #2 and #3)
11:00 AM - Bet #4: ✅ Success
```

**Why this exists:**
- Prevents rapid-fire betting attacks
- Stops automated bots
- Reduces gas fee manipulation

**Note:** This works WITH the cooldown. You need to wait 5 minutes between bets AND can't exceed 3 bets per hour.

---

### ❌ RESTRICTION 5: Wallet Flagged

**Rule:** Admin can manually flag suspicious wallets

**Code:**
```solidity
mapping(address => bool) public flaggedWallets;

function _checkFlaggedWallet(address _wallet) internal view {
    require(
        !flaggedWallets[_wallet],
        "Wallet flagged for review"
    );
}

function flagWallet(address _wallet, string memory _reason) external onlyOwner {
    flaggedWallets[_wallet] = true;
    emit WalletFlagged(_wallet, _reason, block.timestamp);
}
```

**Example:**
```
Admin detects suspicious activity:
├─ Wallet 0xABC... placed 10 bets in 1 hour using multiple wallets
├─ Pattern suggests Sybil attack
└─ Admin calls: flagWallet(0xABC..., "Suspected bot activity")

User 0xABC... tries to bet:
└─ ❌ REJECTED
   Error: "Wallet flagged for review"

Admin can unflag later:
└─ unflagWallet(0xABC...)
```

**Why this exists:**
- Manual override for suspicious activity
- Protects against sophisticated attacks
- Allows human judgment in edge cases

---

### ❌ RESTRICTION 6: Contract Paused

**Rule:** Owner can pause all betting in emergency

**Code:**
```solidity
bool private contractPaused;

function _validateBet(address _wallet, uint256 _amount) internal view {
    require(!contractPaused, "Contract is paused");
    // ... other validations
}

function pauseContract(string memory _reason) external onlyOwner {
    contractPaused = true;
    emit ContractPaused(_reason, block.timestamp);
}
```

**Example:**
```
Normal operation:
├─ User bets: ✅ Success

Emergency detected (e.g., exploit found):
├─ Owner calls: pauseContract("Security audit in progress")
└─ Contract status: PAUSED

All users try to bet:
└─ ❌ REJECTED
   Error: "Contract is paused"

After fix:
├─ Owner calls: unpauseContract()
└─ Betting resumes: ✅
```

**Why this exists:**
- Emergency stop mechanism
- Protects users during security incidents
- Allows time to fix critical bugs

---

## 📊 Complete Validation Flow

When you click "Place Bet", here's what happens:

```
User clicks "Place Bet" (100 USDT on YES)
│
├─ ✓ Check 1: Contract not paused?
│  └─ If paused → ❌ STOP
│
├─ ✓ Check 2: Market exists and is ACTIVE?
│  └─ If closed/resolved → ❌ STOP
│
├─ ✓ Check 3: Amount between 5-5000 USDT?
│  └─ If outside range → ❌ STOP
│
├─ ✓ Check 4: Cooldown passed (5 minutes)?
│  └─ If too soon → ❌ STOP
│
├─ ✓ Check 5: Less than 10 bets already?
│  └─ If 10 bets → ❌ STOP
│
├─ ✓ Check 6: Won't exceed 10% of pool?
│  └─ If too much → ❌ STOP
│
├─ ✓ Check 7: Less than 3 bets in last hour?
│  └─ If too many → ❌ STOP
│
├─ ✓ Check 8: Wallet not flagged?
│  └─ If flagged → ❌ STOP
│
└─ ✅ ALL CHECKS PASSED → Bet placed!
```

---

## Part 2: Buy vs Sell - What Does It Mean?

### 🤔 The Confusion

You're right to be confused! In your current contract, **there is NO buy/sell functionality**. The UI shows "Buy" and "Sell" tabs, but they don't actually do anything different.

Let me explain what buy/sell SHOULD mean in prediction markets:

---

## 📈 Traditional Prediction Markets (Like Polymarket)

In advanced prediction markets, you can **trade shares** like stocks:

### BUY = Open a Position

**What it means:** You're betting that an outcome will happen

**Example:**
```
Market: "Will Bitcoin reach $100k by 2026?"

You BUY YES shares:
├─ You pay: 60 USDT
├─ You get: 100 YES shares
├─ Current price: $0.60 per share
└─ If YES wins: You get 100 USDT (profit: 40 USDT)
```

### SELL = Close a Position (Exit Early)

**What it means:** You're selling your shares BEFORE the market ends

**Example:**
```
You bought 100 YES shares at $0.60 (paid 60 USDT)

Price moves to $0.80 per share

You SELL your 100 YES shares:
├─ You receive: 80 USDT
├─ You paid: 60 USDT
└─ Profit: 20 USDT (without waiting for market to end!)
```

---

## 🔄 How Buy/Sell Works (Advanced Markets)

### Scenario: Bitcoin Price Market

```
Market: "Will Bitcoin reach $100k by Dec 2026?"

DAY 1 (Jan 2026):
═══════════════════════════════════════════════════════════
Bitcoin at $45k
YES share price: $0.30 (30% probability)
NO share price: $0.70 (70% probability)

Alice BUYS 100 YES shares:
├─ Pays: 30 USDT
└─ Owns: 100 YES shares


DAY 30 (Feb 2026):
═══════════════════════════════════════════════════════════
Bitcoin pumps to $80k!
YES share price: $0.75 (75% probability)
NO share price: $0.25 (25% probability)

Alice SELLS her 100 YES shares:
├─ Receives: 75 USDT
├─ Paid: 30 USDT
└─ Profit: 45 USDT (150% ROI in 30 days!)

Alice exits BEFORE market ends!


DAY 365 (Dec 2026):
═══════════════════════════════════════════════════════════
Bitcoin reaches $120k!
Market resolves: YES wins

Bob bought 100 YES shares at $0.75 (paid 75 USDT)
Bob holds until end:
├─ Receives: 100 USDT (each YES share = $1)
├─ Paid: 75 USDT
└─ Profit: 25 USDT (33% ROI)

Alice made MORE profit by selling early!
```

---

## 🎯 Why Buy/Sell is Powerful

### 1. **Exit Early (Take Profits)**

```
You bet YES at 30% probability
Price moves to 80% probability
You SELL and take profit WITHOUT waiting for market to end
```

### 2. **Cut Losses**

```
You bet YES at 70% probability
Bad news drops price to 20% probability
You SELL and recover 20% instead of losing 100%
```

### 3. **Trading Opportunities**

```
You can be a TRADER, not just a bettor:
├─ Buy low, sell high
├─ Profit from price movements
└─ Don't need to predict final outcome
```

---

## ⚠️ Your Current System vs Buy/Sell System

### YOUR CURRENT SYSTEM (Simple Betting)

```
┌─────────────────────────────────────────────────────────┐
│  User bets → Money locked → Wait for market end         │
│  No trading, no exit, no price changes                  │
└─────────────────────────────────────────────────────────┘

Example:
├─ You bet 100 USDT on YES
├─ Money is LOCKED until market ends
├─ You CANNOT exit early
├─ You CANNOT sell your position
└─ You wait for resolution (could be weeks/months)

If you change your mind:
└─ ❌ Too bad! Money is locked.
```

### ADVANCED SYSTEM (With Buy/Sell)

```
┌─────────────────────────────────────────────────────────┐
│  User buys shares → Can sell anytime → Dynamic prices   │
│  Trading enabled, exit anytime, prices change           │
└─────────────────────────────────────────────────────────┘

Example:
├─ You BUY 100 YES shares at $0.60 (60 USDT)
├─ Price moves to $0.80
├─ You SELL for 80 USDT (20 USDT profit)
└─ You exited BEFORE market ended!

If you change your mind:
└─ ✅ Just sell your shares!
```

---

## 🔧 What Your UI Shows vs What Contract Does

### UI Code (apps/frontend/app/prediction/[id]/page.tsx):

```typescript
const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

// UI shows two tabs:
<button onClick={() => setActiveTab("buy")}>Buy</button>
<button onClick={() => setActiveTab("sell")}>Sell</button>
```

### But the Contract Only Has:

```solidity
function placeBet(BetChoice _choice, uint256 _amount) external {
    // Only ONE function - no buy/sell distinction!
    // Money is locked until market ends
}
```

**The Problem:**
- UI shows "Buy" and "Sell" tabs
- But clicking either one does the SAME thing: `placeBet()`
- There's NO actual sell functionality
- It's misleading!

---

## 🎨 What You Should Do

### Option 1: Remove Buy/Sell Tabs (Recommended)

**Why:** Your contract doesn't support trading, so don't show it in UI

**Change:**
```typescript
// Remove this:
const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

// Just show:
<div className="eh-trade__title">Place Bet</div>
<div className="eh-trade__sub">Choose YES or NO</div>
```

### Option 2: Implement Full Buy/Sell System (Complex)

**Requires:**
1. **Share-based system** - Users get shares, not just bets
2. **Automated Market Maker (AMM)** - Dynamic pricing like Uniswap
3. **Liquidity pools** - For buying/selling shares
4. **Price calculation** - Based on pool ratios
5. **Exit mechanism** - Users can sell shares anytime

**This is a MAJOR rewrite** - probably 2-4 weeks of work

---

## 📚 Summary

### Bet Restrictions (6 Rules):
1. ⏱️ **Cooldown:** 5 minutes between bets
2. 🔢 **Max bets:** 10 bets per wallet per market
3. 💰 **Pool cap:** Can't exceed 10% of total pool
4. ⚡ **Velocity:** Max 3 bets per hour
5. 🚫 **Flagged:** Admin can block suspicious wallets
6. ⏸️ **Paused:** Admin can pause all betting

### Buy vs Sell:
- **Buy:** Open a position (bet on outcome)
- **Sell:** Close position early (exit before market ends)
- **Your system:** Only has "buy" (place bet), no "sell" (exit early)
- **Recommendation:** Remove buy/sell tabs from UI or implement full trading system

### Key Insight:
Your current system is **simple betting** (like a traditional sportsbook), not **share trading** (like a stock market). The UI is confusing because it shows buy/sell options that don't actually exist in the smart contract.

---

**Questions to Consider:**

1. Do you want to keep it simple (just betting) or add trading (buy/sell)?
2. Should we remove the buy/sell tabs from the UI?
3. Do you want to implement a full AMM system in the future?

Let me know what direction you want to take!
