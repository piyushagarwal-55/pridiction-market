# 💰 Prediction Market Money Flow - Complete Guide

## Overview

This document explains **exactly** how money flows through the Bet Bazzar Prediction Market system - from the moment a user places a bet until they receive their winnings.

---

## 🎯 Quick Summary

**When you bet:**
- Your USDT goes directly to the Gnosis Safe (treasury wallet)
- Your bet amount is added to either YES pool or NO pool
- The contract tracks your bet but doesn't hold your money

**When market closes:**
- Owner manually resolves the market (sets winner: YES or NO)
- Winners can claim their share of the total pool
- Losers get nothing (their money stays in Gnosis Safe)

**Key Point:** The contract is a **tracking system**, not a bank. All USDT goes to Gnosis Safe immediately.

---

## 📊 Step-by-Step Money Flow

### STEP 1: User Places Bet

**User Action:** Clicks "Place Bet" with 100 USDT on YES

**What Happens:**

1. **Frontend validates:**
   - Amount between 5-5000 USDT ✓
   - User has enough USDT balance ✓
   - Cooldown period passed (300 seconds) ✓
   - User hasn't exceeded 10 bets limit ✓

2. **User approves USDT spending:**
   ```solidity
   // User signs this transaction first
   USDT.approve(PredictionMarketContract, 5000 USDT)
   ```

3. **User calls placeBet:**
   ```solidity
   // User signs this transaction
   PredictionMarket.placeBet(BetChoice.YES, 100 USDT)
   ```

4. **Contract transfers USDT:**
   ```solidity
   // Inside placeBet function
   usdt.transferFrom(msg.sender, gnosisSafe, 100 USDT)
   ```
   
   **💸 MONEY MOVES HERE:**
   - From: User's wallet (0xUser...)
   - To: Gnosis Safe (0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA)
   - Amount: 100 USDT

5. **Contract updates pools:**
   ```solidity
   if (choice == BetChoice.YES) {
       market.yesPool += 100 USDT;  // Now: yesPool = 500 USDT
   }
   ```

6. **Contract records bet:**
   ```solidity
   Bet memory newBet = Bet({
       wallet: 0xUser...,
       marketId: "dorahacks-winner",
       choice: BetChoice.YES,
       amount: 100 USDT,
       timestamp: 1706140800,
       betNumber: 1
   });
   
   allBets.push(newBet);
   userBets[0xUser...].push(newBet);
   ```

**Result:**
- ✅ User's 100 USDT is in Gnosis Safe
- ✅ YES pool increased by 100 USDT
- ✅ Bet recorded on blockchain
- ✅ User can see their bet in UI

---

### STEP 2: Market Closes

**Owner Action:** Calls `closeMarket()` when betting period ends

**What Happens:**

```solidity
function closeMarket() external onlyOwner {
    market.status = MarketStatus.CLOSED;
    emit MarketClosed(market.id, block.timestamp);
}
```

**Result:**
- ✅ No more bets can be placed
- ✅ All USDT still in Gnosis Safe
- ✅ Pools are frozen (yesPool: 5000 USDT, noPool: 3000 USDT)

---

### STEP 3: Market Resolved

**Owner Action:** Determines winner and calls `resolveMarket(BetChoice.YES)`

**What Happens:**

```solidity
function resolveMarket(BetChoice _winner) external onlyOwner {
    require(market.status == MarketStatus.CLOSED);
    
    market.status = MarketStatus.RESOLVED;
    market.winner = BetChoice.YES;  // YES wins!
    
    emit MarketResolved(market.id, _winner, block.timestamp);
}
```

**Result:**
- ✅ Winner declared: YES
- ✅ Market status: RESOLVED
- ✅ All USDT still in Gnosis Safe (8000 USDT total)
- ✅ Winners can now claim payouts

---

### STEP 4: Winners Claim Payouts

**⚠️ IMPORTANT:** The current contract does NOT have an automatic payout function. This needs to be implemented.

**How Payouts SHOULD Work:**

#### Example Scenario:
- **Total Pool:** 8000 USDT (5000 YES + 3000 NO)
- **Winner:** YES
- **House Fee:** 5% = 400 USDT
- **Prize Pool:** 7600 USDT (8000 - 400)

#### User's Payout Calculation:

**User A bet 100 USDT on YES:**

```javascript
// User's share of winning pool
userShare = (userBet / winningPool) * 100
userShare = (100 / 5000) * 100 = 2%

// User's payout
payout = (totalPool - houseFee) * userShare
payout = 7600 * 0.02 = 152 USDT

// User's profit
profit = 152 - 100 = 52 USDT (52% ROI)
```

**User B bet 500 USDT on YES:**

```javascript
userShare = (500 / 5000) * 100 = 10%
payout = 7600 * 0.10 = 760 USDT
profit = 760 - 500 = 260 USDT (52% ROI)
```

**User C bet 200 USDT on NO (LOST):**

```javascript
payout = 0 USDT
loss = 200 USDT (100% loss)
```

#### Payout Function (NEEDS TO BE ADDED):

```solidity
function claimPayout() external nonReentrant {
    require(market.status == MarketStatus.RESOLVED, "Market not resolved");
    require(!hasClaimed[msg.sender], "Already claimed");
    
    // Calculate user's payout
    uint256 userPayout = calculatePayout(msg.sender);
    require(userPayout > 0, "No payout available");
    
    // Mark as claimed
    hasClaimed[msg.sender] = true;
    
    // Transfer from Gnosis Safe to user
    // NOTE: Gnosis Safe needs to approve this contract first
    usdt.transferFrom(gnosisSafe, msg.sender, userPayout);
    
    emit PayoutClaimed(msg.sender, userPayout);
}

function calculatePayout(address _user) public view returns (uint256) {
    // Get all user's winning bets
    uint256 userWinningBets = 0;
    Bet[] memory bets = userBets[_user];
    
    for (uint i = 0; i < bets.length; i++) {
        if (bets[i].choice == market.winner) {
            userWinningBets += bets[i].amount;
        }
    }
    
    if (userWinningBets == 0) return 0;
    
    // Calculate share
    uint256 winningPool = market.winner == BetChoice.YES 
        ? market.yesPool 
        : market.noPool;
    
    uint256 totalPool = market.yesPool + market.noPool;
    uint256 houseFee = (totalPool * HOUSE_FEE_PERCENT) / 100;
    uint256 prizePool = totalPool - houseFee;
    
    // User's payout = (userBets / winningPool) * prizePool
    uint256 payout = (userWinningBets * prizePool) / winningPool;
    
    return payout;
}
```

---

## 💸 Complete Money Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PREDICTION MARKET MONEY FLOW                  │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: BETTING PERIOD
═══════════════════════

User A (100 USDT YES)  ──┐
User B (500 USDT YES)  ──┤
User C (200 USDT YES)  ──┤──→  Gnosis Safe
User D (200 USDT NO)   ──┤     (Treasury)
User E (300 USDT NO)   ──┘     
                               Total: 1300 USDT

Contract Tracking:
├─ YES Pool: 800 USDT
└─ NO Pool: 500 USDT


PHASE 2: MARKET CLOSED
═══════════════════════

Owner calls closeMarket()
├─ Status: CLOSED
├─ No more bets allowed
└─ Money still in Gnosis Safe


PHASE 3: MARKET RESOLVED
═════════════════════════

Owner calls resolveMarket(YES)
├─ Winner: YES
├─ Status: RESOLVED
└─ Calculate payouts


PHASE 4: PAYOUTS
═════════════════

Total Pool: 1300 USDT
House Fee (5%): 65 USDT
Prize Pool: 1235 USDT

Winners (YES bettors):
├─ User A: (100/800) * 1235 = 154.38 USDT  (+54.38 profit)
├─ User B: (500/800) * 1235 = 771.88 USDT  (+271.88 profit)
└─ User C: (200/800) * 1235 = 308.75 USDT  (+108.75 profit)

Losers (NO bettors):
├─ User D: 0 USDT  (-200 loss)
└─ User E: 0 USDT  (-300 loss)

Gnosis Safe → User A (154.38 USDT)
Gnosis Safe → User B (771.88 USDT)
Gnosis Safe → User C (308.75 USDT)

Remaining in Gnosis Safe:
├─ House Profit: 65 USDT (5% fee)
└─ Losers' Money: 500 USDT
    Total: 565 USDT
```

---

## 🔐 Security & Trust

### Why Gnosis Safe?

1. **Multi-signature wallet** - Requires multiple owners to approve withdrawals
2. **Transparent** - All transactions visible on blockchain
3. **Secure** - Battle-tested smart contract wallet
4. **Audited** - Used by major DeFi protocols

### Trust Model:

**Users trust:**
- Smart contract code (open source, auditable)
- Gnosis Safe security
- Owner to resolve markets fairly
- Owner to distribute payouts correctly

**Users DON'T need to trust:**
- Contract to hold their money (it doesn't)
- Centralized database (everything on-chain)
- Hidden fees (all fees in contract code)

---

## 📈 Example: Real Market Scenario

### Market: "Will Bet Bazzar reach 1000 users by March 2026?"

**Betting Period:** Jan 24 - Feb 24, 2026

#### Day 1-10: Early Bets
```
YES Pool: 2,000 USDT (10 bets)
NO Pool: 1,000 USDT (5 bets)
Total: 3,000 USDT in Gnosis Safe
```

#### Day 11-20: More Activity
```
YES Pool: 5,000 USDT (25 bets)
NO Pool: 3,000 USDT (15 bets)
Total: 8,000 USDT in Gnosis Safe
```

#### Day 21-30: Final Rush
```
YES Pool: 8,000 USDT (40 bets)
NO Pool: 7,000 USDT (35 bets)
Total: 15,000 USDT in Gnosis Safe
```

#### Feb 24: Market Closes
```
Owner calls closeMarket()
Final Pools:
├─ YES: 8,000 USDT
├─ NO: 7,000 USDT
└─ Total: 15,000 USDT
```

#### March 1: Market Resolved
```
Result: Bet Bazzar reached 1,200 users ✅
Owner calls resolveMarket(YES)

Payout Calculation:
├─ Total Pool: 15,000 USDT
├─ House Fee (5%): 750 USDT
├─ Prize Pool: 14,250 USDT
└─ Winning Pool: 8,000 USDT (YES)

Average ROI for YES bettors:
(14,250 / 8,000) - 1 = 78.125% profit

Example Payouts:
├─ User bet 100 USDT → Gets 178.13 USDT (+78.13)
├─ User bet 500 USDT → Gets 890.63 USDT (+390.63)
└─ User bet 1000 USDT → Gets 1,781.25 USDT (+781.25)

NO bettors: 7,000 USDT lost (stays in Gnosis Safe)
```

---

## ⚠️ Current Limitations

### 1. No Automatic Payout Function
**Problem:** Contract doesn't have `claimPayout()` function

**Solution Needed:**
- Add `claimPayout()` function
- Add `calculatePayout()` helper
- Add `hasClaimed` mapping
- Gnosis Safe must approve contract to spend USDT

### 2. Single Market Only
**Problem:** Contract only supports ONE market at a time

**Impact:**
- Must wait for market to resolve before creating new one
- Can't run multiple markets simultaneously

**Solution:** See `MULTIPLE_MARKETS_IMPLEMENTATION_GUIDE.md`

### 3. Manual Resolution
**Problem:** Owner must manually call `resolveMarket()`

**Risk:**
- Centralization risk
- Potential for disputes
- Delayed payouts

**Future Solution:**
- Integrate Chainlink oracle for automated resolution
- Use decentralized voting mechanism
- Implement dispute resolution system

---

## 🎓 Key Takeaways

1. **Money goes to Gnosis Safe immediately** - Contract doesn't hold funds
2. **Contract tracks bets** - Acts as ledger, not bank
3. **Pools are virtual** - Just numbers in contract storage
4. **Winners share the total pool** - Minus 5% house fee
5. **Losers get nothing** - Their money stays in Gnosis Safe
6. **Payout function needed** - Currently missing from contract
7. **ROI depends on pool ratio** - More people on losing side = higher ROI

---

## 🔧 Technical Details

### Contract Addresses (Monad Testnet)
```
PredictionMarket: 0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B
MockUSDT: 0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
Gnosis Safe: 0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA
```

### Key Functions
```solidity
// User calls
placeBet(BetChoice choice, uint256 amount)
getUserBets(address wallet)
getPoolInfo()

// Owner calls
createMarket(string marketId, string question, uint256 endTime)
closeMarket()
resolveMarket(BetChoice winner)

// Missing (needs to be added)
claimPayout()
calculatePayout(address user)
```

### Events Emitted
```solidity
BetPlaced(address wallet, string marketId, BetChoice choice, uint256 amount)
PoolUpdated(string marketId, uint256 yesPool, uint256 noPool)
MarketClosed(string marketId)
MarketResolved(string marketId, BetChoice winner)
```

---

## 📚 Related Documents

- `BET_BAZZAR_PITCH_DECK.md` - Project overview
- `MULTIPLE_MARKETS_IMPLEMENTATION_GUIDE.md` - How to add multiple markets
- `ARCHITECTURE.md` - System architecture
- `packages/contracts/PredictionMarket.sol` - Smart contract code

---

**Last Updated:** January 24, 2026
**Version:** 1.0
**Author:** Kiro AI Assistant
