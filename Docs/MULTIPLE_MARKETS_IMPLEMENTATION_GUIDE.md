# Multiple Prediction Markets Implementation Guide

## Current State Analysis

### ❌ **Current Limitation: Single Market Only**

The smart contract (`PredictionMarket.sol`) is designed to handle **ONLY ONE MARKET** at a time:

```solidity
// Line 56-57: Single market storage
Market public market;
bool public marketExists = false;
```

**Key Issues:**
1. ✅ Only one `Market` struct stored
2. ✅ `marketExists` boolean prevents creating multiple markets
3. ✅ All bets reference the single market
4. ✅ Must call `resetMarket()` after resolution to create a new one

---

## What It Takes to Support Multiple Markets

### 🔴 **DIFFICULTY: MEDIUM-HIGH** (Requires Smart Contract Redeployment)

### Required Changes

#### 1. **Smart Contract Changes** (MAJOR - Requires Redeployment)

**File:** `packages/contracts/PredictionMarket.sol`

**Changes Needed:**

```solidity
// BEFORE (Current - Single Market)
Market public market;
bool public marketExists = false;

// AFTER (Multiple Markets)
mapping(string => Market) public markets;
string[] public marketIds;
mapping(string => bool) public marketExists;
```

**Impact:**
- ⚠️ **REQUIRES CONTRACT REDEPLOYMENT** - Cannot upgrade existing contract
- ⚠️ All existing bets would be lost (unless migrated)
- ⚠️ New contract address needs to be updated everywhere
- ⚠️ Users need to re-approve USDT for new contract

**Additional Contract Changes:**
```solidity
// Update all functions to accept marketId parameter
function placeBet(string memory _marketId, BetChoice _choice, uint256 _amount)

// Update validation functions
function _validateBet(string memory _marketId, address _wallet, uint256 _amount)

// Update getters
function getMarket(string memory _marketId) external view returns (...)
function getMarkets() external view returns (Market[] memory)
function getActiveMarkets() external view returns (Market[] memory)
```

**Estimated Lines Changed:** ~200-300 lines
**Complexity:** Medium-High
**Testing Required:** Extensive (all bet flows, edge cases)

---

#### 2. **Frontend Changes** (MODERATE)

**Files to Update:**

**A. Hook Updates** (`apps/frontend/lib/hooks/useContractBet.ts`)
```typescript
// BEFORE
const placeBet = async (choice: BetChoice, amount: number, marketId: string)

// AFTER - Add marketId to contract call
const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
    abi: [...],
    functionName: "placeBet",
    args: [marketId, choice === BetChoice.YES ? 0 : 1, amountWei], // Add marketId
    account: userAddress,
});
```

**B. Market List Page** (`apps/frontend/app/prediction/page.tsx`)
```typescript
// BEFORE - Hardcoded single market
const MARKETS: Market[] = [
    {
        id: "bet-bazzar-launch",
        question: "Will Bet Bazzar reach 1000 users by March 2026?",
        // ...
    },
];

// AFTER - Fetch from contract
const [markets, setMarkets] = useState<Market[]>([]);

useEffect(() => {
    async function fetchMarkets() {
        const contractMarkets = await readContract({
            address: CONTRACT_ADDRESSES.PREDICTION_MARKET,
            abi: PredictionMarketABI,
            functionName: 'getActiveMarkets',
        });
        setMarkets(contractMarkets);
    }
    fetchMarkets();
}, []);
```

**C. Market Detail Page** (`apps/frontend/app/prediction/[id]/page.tsx`)
```typescript
// BEFORE - Hardcoded market data
const MARKET_DATA: MarketInfo = { ... };

// AFTER - Fetch specific market from contract
const { data: marketData } = useContractRead({
    address: CONTRACT_ADDRESSES.PREDICTION_MARKET,
    abi: PredictionMarketABI,
    functionName: 'getMarket',
    args: [marketId],
});
```

**Estimated Lines Changed:** ~150-200 lines
**Complexity:** Medium
**Testing Required:** Moderate

---

#### 3. **Backend Changes** (EASY)

**File:** `apps/backend/app/api/v1/predictions.py`

**Changes Needed:**

```python
# BEFORE - Single market initialization
HACKATHON_MARKET = PredictionMarket(
    id="bet-bazzar-launch",
    # ...
)
MARKETS_DB["bet-bazzar-launch"] = HACKATHON_MARKET

# AFTER - Multiple markets
def initialize_markets():
    markets = [
        PredictionMarket(
            id="bet-bazzar-launch",
            question="Will Bet Bazzar reach 1000 users by March 2026?",
            # ...
        ),
        PredictionMarket(
            id="btc-100k",
            question="Will BTC reach $100k by Feb 2026?",
            # ...
        ),
        PredictionMarket(
            id="eth-proto-danksharding",
            question="Will ETH implement Proto-Danksharding in Q1?",
            # ...
        ),
    ]
    for market in markets:
        MARKETS_DB[market.id] = market

initialize_markets()
```

**Estimated Lines Changed:** ~50-100 lines
**Complexity:** Easy
**Testing Required:** Minimal

---

## Implementation Roadmap

### Option A: Quick Win (No Contract Changes) ⚡
**Timeline:** 2-4 hours

**What You Can Do NOW:**
1. ✅ Add multiple markets to frontend UI (display only)
2. ✅ Add multiple markets to backend API
3. ✅ Show market list with different questions
4. ⚠️ **BUT:** All bets still go to the single contract market
5. ⚠️ **Limitation:** Only one market can be "active" on-chain at a time

**Use Case:** 
- Show upcoming markets
- Display historical markets
- Build UI/UX before contract upgrade

**Code Changes:**
```typescript
// Frontend - Show multiple markets (UI only)
const MARKETS = [
    { id: "bet-bazzar-launch", question: "...", status: "ACTIVE" },
    { id: "btc-100k", question: "...", status: "UPCOMING" },
    { id: "eth-upgrade", question: "...", status: "UPCOMING" },
];

// Only allow betting on ACTIVE market
const canBet = market.status === "ACTIVE";
```

---

### Option B: Full Implementation (Contract Redeployment) 🔧
**Timeline:** 1-2 weeks

**Steps:**

1. **Update Smart Contract** (2-3 days)
   - Modify contract to support multiple markets
   - Write comprehensive tests
   - Audit security implications
   - Deploy to testnet

2. **Update Frontend** (2-3 days)
   - Update hooks to pass marketId
   - Fetch markets from contract
   - Update UI to show multiple markets
   - Test all bet flows

3. **Update Backend** (1 day)
   - Add multiple markets to API
   - Update endpoints
   - Test integration

4. **Deploy & Migrate** (1-2 days)
   - Deploy new contract to Monad Testnet
   - Update contract addresses in frontend
   - Notify users to re-approve USDT
   - Migrate any existing data

---

## Recommendation

### 🎯 **Best Approach: Hybrid Strategy**

**Phase 1: Quick Win (Now)**
- Add multiple markets to frontend/backend (display only)
- Keep single active market on contract
- Build user experience and test demand

**Phase 2: Contract Upgrade (Later)**
- Once you validate user demand
- Plan proper contract upgrade
- Migrate to multi-market contract

### Why This Approach?

1. ✅ **No Risk:** Doesn't require contract redeployment
2. ✅ **Fast:** Can be done in a few hours
3. ✅ **Validates Demand:** See if users want multiple markets
4. ✅ **Builds UI:** Frontend ready when contract upgrades
5. ✅ **Flexible:** Can rotate which market is "active"

---

## Code Example: Quick Win Implementation

### Frontend Changes (No Contract Changes)

```typescript
// apps/frontend/app/prediction/page.tsx

const MARKETS: Market[] = [
    {
        id: "bet-bazzar-launch",
        question: "Will Bet Bazzar reach 1000 users by March 2026?",
        status: "active",  // ← Only this one accepts bets
        yesPercent: 42,
        noPercent: 58,
        pool: 1250,
        endsIn: "65 days",
    },
    {
        id: "btc-100k",
        question: "Will BTC reach $100k by Feb 2026?",
        status: "upcoming",  // ← Display only, no betting yet
        yesPercent: 54,
        noPercent: 46,
        pool: 0,
        endsIn: "Starts in 10 days",
    },
    {
        id: "eth-upgrade",
        question: "Will ETH implement Proto-Danksharding in Q1?",
        status: "upcoming",
        yesPercent: 52,
        noPercent: 48,
        pool: 0,
        endsIn: "Starts in 20 days",
    },
];

// In MarketCard component
const canBet = market.status === "active";

<button
    onClick={() => addSelection(market, "YES", yesPrice)}
    disabled={!canBet}
    className={`w-full px-4 py-3 ${!canBet ? 'opacity-50 cursor-not-allowed' : ''}`}
>
    <div className="text-[11px] uppercase">YES</div>
    <div className="mt-1 font-semibold">{market.yesPercent}%</div>
    {!canBet && <div className="text-xs mt-1">Coming Soon</div>}
</button>
```

---

## Summary

### Current State
- ❌ Contract supports **1 market only**
- ❌ Requires redeployment for multiple markets

### Quick Win (2-4 hours)
- ✅ Add multiple markets to UI
- ✅ Show upcoming/historical markets
- ✅ Only one active for betting
- ✅ **No contract changes needed**

### Full Implementation (1-2 weeks)
- ⚠️ Requires contract redeployment
- ⚠️ Users must re-approve USDT
- ⚠️ Extensive testing required
- ✅ True multi-market support

### My Recommendation
**Start with Quick Win**, validate demand, then upgrade contract if needed.

---

## Questions?

1. **Do you want to proceed with Quick Win?** (Multiple markets in UI, single active market)
2. **Or full contract redeployment?** (True multi-market support)
3. **How many markets do you want to support initially?** (3-5 recommended)

Let me know which approach you prefer!
