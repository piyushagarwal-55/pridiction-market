# 💰 Money Flow Visual Diagrams

## Diagram 1: Complete Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     BET BAZZAR PREDICTION MARKET                          │
│                        COMPLETE MONEY FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

STEP 1: USER PLACES BET
═══════════════════════════════════════════════════════════════════════════

    ┌─────────────┐                                    ┌─────────────┐
    │   User A    │                                    │   User B    │
    │  (Wallet)   │                                    │  (Wallet)   │
    └──────┬──────┘                                    └──────┬──────┘
           │                                                  │
           │ 1. Approve USDT                                 │ 1. Approve USDT
           │    spending                                     │    spending
           ▼                                                  ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │              USDT Token Contract (ERC20)                        │
    │         0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21             │
    └─────────────────────────────────────────────────────────────────┘
           │                                                  │
           │ 2. Call placeBet()                              │ 2. Call placeBet()
           │    YES, 100 USDT                                │    NO, 200 USDT
           ▼                                                  ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │           PredictionMarket Smart Contract                       │
    │         0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B             │
    │                                                                 │
    │  3. Validates bet:                                              │
    │     ✓ Amount 5-5000 USDT                                        │
    │     ✓ Cooldown passed (300s)                                    │
    │     ✓ Bet count < 10                                            │
    │     ✓ Pool cap < 10%                                            │
    │                                                                 │
    │  4. Transfers USDT:                                             │
    │     usdt.transferFrom(user, gnosisSafe, amount)                 │
    └─────────────────────────┬───────────────────────────────────────┘
                              │
                              │ 💸 MONEY MOVES HERE
                              │ User A: 100 USDT
                              │ User B: 200 USDT
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    Gnosis Safe (Treasury)                       │
    │         0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA             │
    │                                                                 │
    │                    Balance: 300 USDT                            │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │           Contract Storage (Tracking Only)                      │
    │                                                                 │
    │  market.yesPool = 100 USDT                                      │
    │  market.noPool = 200 USDT                                       │
    │                                                                 │
    │  userBets[UserA] = [Bet{YES, 100, timestamp}]                   │
    │  userBets[UserB] = [Bet{NO, 200, timestamp}]                    │
    └─────────────────────────────────────────────────────────────────┘


STEP 2: MARKET CLOSES
═══════════════════════════════════════════════════════════════════════════

    ┌─────────────┐
    │    Owner    │
    │  (Admin)    │
    └──────┬──────┘
           │
           │ closeMarket()
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │           PredictionMarket Smart Contract                       │
    │                                                                 │
    │  market.status = CLOSED                                         │
    │  ❌ No more bets allowed                                        │
    │                                                                 │
    │  Pools frozen:                                                  │
    │  ├─ YES: 100 USDT                                               │
    │  └─ NO: 200 USDT                                                │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │                    Gnosis Safe (Treasury)                       │
    │                                                                 │
    │              Balance: 300 USDT (unchanged)                      │
    └─────────────────────────────────────────────────────────────────┘


STEP 3: MARKET RESOLVED
═══════════════════════════════════════════════════════════════════════════

    ┌─────────────┐
    │    Owner    │
    │  (Admin)    │
    └──────┬──────┘
           │
           │ resolveMarket(YES)
           │ Winner: YES
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │           PredictionMarket Smart Contract                       │
    │                                                                 │
    │  market.status = RESOLVED                                       │
    │  market.winner = YES                                            │
    │                                                                 │
    │  Calculate payouts:                                             │
    │  ├─ Total Pool: 300 USDT                                        │
    │  ├─ House Fee (5%): 15 USDT                                     │
    │  ├─ Prize Pool: 285 USDT                                        │
    │  └─ Winning Pool: 100 USDT (YES)                                │
    │                                                                 │
    │  User A (YES, 100 USDT):                                        │
    │  └─ Payout = (100/100) * 285 = 285 USDT                         │
    │                                                                 │
    │  User B (NO, 200 USDT):                                         │
    │  └─ Payout = 0 USDT (lost)                                      │
    └─────────────────────────────────────────────────────────────────┘


STEP 4: WINNERS CLAIM PAYOUTS
═══════════════════════════════════════════════════════════════════════════

    ┌─────────────┐
    │   User A    │
    │  (Winner)   │
    └──────┬──────┘
           │
           │ claimPayout()
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │           PredictionMarket Smart Contract                       │
    │                                                                 │
    │  1. Check: market.status == RESOLVED ✓                          │
    │  2. Check: !hasClaimed[UserA] ✓                                 │
    │  3. Calculate: payout = 285 USDT                                │
    │  4. Mark: hasClaimed[UserA] = true                              │
    │  5. Transfer: usdt.transferFrom(gnosisSafe, UserA, 285)         │
    └─────────────────────────┬───────────────────────────────────────┘
                              │
                              │ 💸 PAYOUT TRANSFER
                              │ 285 USDT
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    Gnosis Safe (Treasury)                       │
    │                                                                 │
    │  Before: 300 USDT                                               │
    │  After:  15 USDT (house profit)                                 │
    └─────────────────────────┬───────────────────────────────────────┘
                              │
                              │ 285 USDT
                              ▼
    ┌─────────────┐
    │   User A    │
    │  (Wallet)   │
    │             │
    │  Received:  │
    │  285 USDT   │
    │             │
    │  Profit:    │
    │  +185 USDT  │
    │  (185% ROI) │
    └─────────────┘

    ┌─────────────┐
    │   User B    │
    │  (Loser)    │
    │             │
    │  Lost:      │
    │  200 USDT   │
    │  (100% loss)│
    └─────────────┘
```

---

## Diagram 2: Pool Dynamics

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        POOL DYNAMICS EXAMPLE                              │
│                   How Pools Affect Your Winnings                          │
└──────────────────────────────────────────────────────────────────────────┘

SCENARIO A: Balanced Pools (50/50)
═══════════════════════════════════════════════════════════════════════════

    YES Pool: 5,000 USDT (50 users)    NO Pool: 5,000 USDT (50 users)
    ┌─────────────────────┐            ┌─────────────────────┐
    │   ████████████████  │            │   ████████████████  │
    │   ████████████████  │            │   ████████████████  │
    │   ████████████████  │            │   ████████████████  │
    │   ████████████████  │            │   ████████████████  │
    │   ████████████████  │            │   ████████████████  │
    │     5,000 USDT      │            │     5,000 USDT      │
    └─────────────────────┘            └─────────────────────┘

    Total Pool: 10,000 USDT
    House Fee (5%): 500 USDT
    Prize Pool: 9,500 USDT

    IF YES WINS:
    ├─ Winners: 50 users (5,000 USDT bet)
    ├─ Prize Pool: 9,500 USDT
    └─ Average ROI: (9,500 / 5,000) - 1 = 90% profit

    Example: You bet 100 USDT on YES
    └─ Payout: (100 / 5,000) * 9,500 = 190 USDT
       Profit: +90 USDT (90% ROI)


SCENARIO B: Unbalanced Pools (80/20)
═══════════════════════════════════════════════════════════════════════════

    YES Pool: 8,000 USDT (80 users)    NO Pool: 2,000 USDT (20 users)
    ┌─────────────────────┐            ┌─────────────────────┐
    │   ████████████████  │            │   ████████          │
    │   ████████████████  │            │   ████████          │
    │   ████████████████  │            │                     │
    │   ████████████████  │            │                     │
    │   ████████████████  │            │                     │
    │     8,000 USDT      │            │     2,000 USDT      │
    └─────────────────────┘            └─────────────────────┘

    Total Pool: 10,000 USDT
    House Fee (5%): 500 USDT
    Prize Pool: 9,500 USDT

    IF YES WINS (Majority wins):
    ├─ Winners: 80 users (8,000 USDT bet)
    ├─ Prize Pool: 9,500 USDT
    └─ Average ROI: (9,500 / 8,000) - 1 = 18.75% profit

    Example: You bet 100 USDT on YES
    └─ Payout: (100 / 8,000) * 9,500 = 118.75 USDT
       Profit: +18.75 USDT (18.75% ROI)

    IF NO WINS (Minority wins):
    ├─ Winners: 20 users (2,000 USDT bet)
    ├─ Prize Pool: 9,500 USDT
    └─ Average ROI: (9,500 / 2,000) - 1 = 375% profit 🚀

    Example: You bet 100 USDT on NO
    └─ Payout: (100 / 2,000) * 9,500 = 475 USDT
       Profit: +375 USDT (375% ROI) 💰


SCENARIO C: Extreme Unbalance (95/5)
═══════════════════════════════════════════════════════════════════════════

    YES Pool: 9,500 USDT (95 users)    NO Pool: 500 USDT (5 users)
    ┌─────────────────────┐            ┌─────────────────────┐
    │   ████████████████  │            │   ██                │
    │   ████████████████  │            │                     │
    │   ████████████████  │            │                     │
    │   ████████████████  │            │                     │
    │   ████████████████  │            │                     │
    │     9,500 USDT      │            │      500 USDT       │
    └─────────────────────┘            └─────────────────────┘

    Total Pool: 10,000 USDT
    House Fee (5%): 500 USDT
    Prize Pool: 9,500 USDT

    IF YES WINS (Overwhelming majority):
    ├─ Winners: 95 users (9,500 USDT bet)
    ├─ Prize Pool: 9,500 USDT
    └─ Average ROI: (9,500 / 9,500) - 1 = 0% profit ⚠️

    Example: You bet 100 USDT on YES
    └─ Payout: (100 / 9,500) * 9,500 = 100 USDT
       Profit: 0 USDT (0% ROI - just get money back)

    IF NO WINS (Tiny minority):
    ├─ Winners: 5 users (500 USDT bet)
    ├─ Prize Pool: 9,500 USDT
    └─ Average ROI: (9,500 / 500) - 1 = 1,800% profit 🚀🚀🚀

    Example: You bet 100 USDT on NO
    └─ Payout: (100 / 500) * 9,500 = 1,900 USDT
       Profit: +1,800 USDT (1,800% ROI) 💎


KEY INSIGHT:
═══════════════════════════════════════════════════════════════════════════

    ┌────────────────────────────────────────────────────────────┐
    │  The more unbalanced the pools, the higher the potential   │
    │  reward for betting on the MINORITY side.                  │
    │                                                            │
    │  But also higher risk - if majority is right, you lose!   │
    └────────────────────────────────────────────────────────────┘

    Betting Strategy:
    ├─ Majority side (YES 80%): Lower risk, lower reward
    ├─ Minority side (NO 20%): Higher risk, higher reward
    └─ Balanced (50/50): Medium risk, medium reward
```

---

## Diagram 3: Multi-User Example

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     REAL MARKET EXAMPLE                                   │
│         "Will Bet Bazzar reach 1000 users by March 2026?"                │
└──────────────────────────────────────────────────────────────────────────┘

BETTING PHASE (Jan 24 - Feb 24, 2026)
═══════════════════════════════════════════════════════════════════════════

    User A: 100 USDT → YES  ─┐
    User B: 500 USDT → YES  ─┤
    User C: 200 USDT → YES  ─┤
    User D: 300 USDT → YES  ─┤──→  YES Pool: 1,500 USDT
    User E: 150 USDT → YES  ─┤
    User F: 250 USDT → YES  ─┘

    User G: 400 USDT → NO   ─┐
    User H: 300 USDT → NO   ─┤──→  NO Pool: 1,000 USDT
    User I: 300 USDT → NO   ─┘

    ┌─────────────────────────────────────────────────────────────┐
    │                    Gnosis Safe Balance                      │
    │                      2,500 USDT                             │
    └─────────────────────────────────────────────────────────────┘


RESOLUTION (March 1, 2026)
═══════════════════════════════════════════════════════════════════════════

    Result: Bet Bazzar reached 1,200 users ✅
    Winner: YES

    Total Pool: 2,500 USDT
    House Fee (5%): 125 USDT
    Prize Pool: 2,375 USDT
    Winning Pool: 1,500 USDT (YES)


PAYOUT CALCULATION
═══════════════════════════════════════════════════════════════════════════

    User A (YES, 100 USDT):
    ├─ Share: 100 / 1,500 = 6.67%
    ├─ Payout: 2,375 * 0.0667 = 158.33 USDT
    └─ Profit: +58.33 USDT (58.33% ROI) ✅

    User B (YES, 500 USDT):
    ├─ Share: 500 / 1,500 = 33.33%
    ├─ Payout: 2,375 * 0.3333 = 791.67 USDT
    └─ Profit: +291.67 USDT (58.33% ROI) ✅

    User C (YES, 200 USDT):
    ├─ Share: 200 / 1,500 = 13.33%
    ├─ Payout: 2,375 * 0.1333 = 316.67 USDT
    └─ Profit: +116.67 USDT (58.33% ROI) ✅

    User D (YES, 300 USDT):
    ├─ Share: 300 / 1,500 = 20%
    ├─ Payout: 2,375 * 0.20 = 475 USDT
    └─ Profit: +175 USDT (58.33% ROI) ✅

    User E (YES, 150 USDT):
    ├─ Share: 150 / 1,500 = 10%
    ├─ Payout: 2,375 * 0.10 = 237.50 USDT
    └─ Profit: +87.50 USDT (58.33% ROI) ✅

    User F (YES, 250 USDT):
    ├─ Share: 250 / 1,500 = 16.67%
    ├─ Payout: 2,375 * 0.1667 = 395.83 USDT
    └─ Profit: +145.83 USDT (58.33% ROI) ✅

    User G (NO, 400 USDT):
    └─ Payout: 0 USDT
       Loss: -400 USDT (100% loss) ❌

    User H (NO, 300 USDT):
    └─ Payout: 0 USDT
       Loss: -300 USDT (100% loss) ❌

    User I (NO, 300 USDT):
    └─ Payout: 0 USDT
       Loss: -300 USDT (100% loss) ❌


FINAL DISTRIBUTION
═══════════════════════════════════════════════════════════════════════════

    Gnosis Safe (Before): 2,500 USDT

    Payouts to Winners:
    ├─ User A: 158.33 USDT  ─┐
    ├─ User B: 791.67 USDT  ─┤
    ├─ User C: 316.67 USDT  ─┤
    ├─ User D: 475.00 USDT  ─┤──→  Total: 2,375 USDT
    ├─ User E: 237.50 USDT  ─┤
    └─ User F: 395.83 USDT  ─┘

    Gnosis Safe (After): 125 USDT (house profit)

    ┌─────────────────────────────────────────────────────────────┐
    │                    SUMMARY                                  │
    │                                                             │
    │  Total Wagered:     2,500 USDT                              │
    │  Total Paid Out:    2,375 USDT                              │
    │  House Profit:        125 USDT (5%)                         │
    │                                                             │
    │  Winners: 6 users (1,500 USDT bet)                          │
    │  Losers:  3 users (1,000 USDT lost)                         │
    │                                                             │
    │  Average Winner ROI: 58.33%                                 │
    │  Average Loser Loss: 100%                                   │
    └─────────────────────────────────────────────────────────────┘
```

---

## Diagram 4: House Fee Breakdown

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        HOUSE FEE EXPLAINED                                │
│                    Where Does the 5% Go?                                  │
└──────────────────────────────────────────────────────────────────────────┘

EXAMPLE: 10,000 USDT Total Pool
═══════════════════════════════════════════════════════════════════════════

    Total Pool: 10,000 USDT
    ┌────────────────────────────────────────────────────────────┐
    │  ████████████████████████████████████████████████████████  │
    │  ████████████████████████████████████████████████████████  │
    │                     10,000 USDT                            │
    └────────────────────────────────────────────────────────────┘

    House Fee (5%): 500 USDT
    ┌────────────────────────────────────────────────────────────┐
    │  ██████                                                    │
    │                      500 USDT                              │
    └────────────────────────────────────────────────────────────┘

    Prize Pool (95%): 9,500 USDT
    ┌────────────────────────────────────────────────────────────┐
    │  ██████████████████████████████████████████████████████    │
    │  ██████████████████████████████████████████████████████    │
    │                     9,500 USDT                             │
    └────────────────────────────────────────────────────────────┘


HOUSE FEE USAGE
═══════════════════════════════════════════════════════════════════════════

    500 USDT House Fee
    │
    ├─ 200 USDT (40%) → Platform Operations
    │  ├─ Server hosting
    │  ├─ Database costs
    │  ├─ API infrastructure
    │  └─ Monitoring tools
    │
    ├─ 150 USDT (30%) → Development
    │  ├─ Smart contract audits
    │  ├─ Feature development
    │  ├─ Bug fixes
    │  └─ Security improvements
    │
    ├─ 100 USDT (20%) → Marketing
    │  ├─ User acquisition
    │  ├─ Community building
    │  └─ Partnerships
    │
    └─ 50 USDT (10%) → Reserve Fund
       ├─ Emergency situations
       ├─ Dispute resolution
       └─ Platform insurance


COMPARISON WITH COMPETITORS
═══════════════════════════════════════════════════════════════════════════

    Bet Bazzar:        5% house fee  ████
    Polymarket:        2% fee        ██
    Augur:            1-2% fee       ██
    Traditional Books: 5-10% fee     ██████████

    ✅ Competitive with traditional sportsbooks
    ✅ Higher than pure DeFi protocols (but more features)
    ✅ Transparent (all fees in smart contract code)
```

---

## Diagram 5: Transaction Flow Timeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    TRANSACTION TIMELINE                                   │
│              What Happens When You Place a Bet                            │
└──────────────────────────────────────────────────────────────────────────┘

T+0s: User Clicks "Place Bet"
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ Frontend validates input
    ├─ Checks wallet connection
    └─ Checks USDT balance
    │
    ▼

T+1s: Approval Check
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ Check if USDT approved
    ├─ If not: Request approval (user signs)
    └─ Wait for approval tx confirmation
    │
    ▼

T+5s: Approval Confirmed
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ Approval transaction mined
    ├─ Contract can now spend USDT
    └─ Ready to place bet
    │
    ▼

T+6s: Place Bet Transaction
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ User signs placeBet() transaction
    ├─ Transaction sent to mempool
    └─ Waiting for miner to include
    │
    ▼

T+10s: Transaction Pending
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ Transaction in mempool
    ├─ Gas price determines priority
    └─ UI shows "Pending..." status
    │
    ▼

T+15s: Transaction Mined
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ Block mined with transaction
    ├─ USDT transferred to Gnosis Safe
    ├─ Pools updated
    ├─ Bet recorded
    └─ Events emitted
    │
    ▼

T+18s: Confirmation Wait
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ Wait for 1 block confirmation
    ├─ Ensures transaction finality
    └─ UI shows "Confirming..."
    │
    ▼

T+20s: API Confirmation
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ Frontend calls /api/bets/confirm
    ├─ Backend validates transaction
    ├─ Stores bet in database
    └─ Updates user stats
    │
    ▼

T+22s: Success!
═══════════════════════════════════════════════════════════════════════════
    │
    ├─ UI shows success message
    ├─ Toast notification appears
    ├─ Bet appears in user's history
    ├─ Pool percentages update
    └─ User can place another bet (after cooldown)


TOTAL TIME: ~22 seconds
═══════════════════════════════════════════════════════════════════════════

    Breakdown:
    ├─ Approval: 5 seconds (one-time)
    ├─ Bet transaction: 10 seconds
    ├─ Confirmation: 5 seconds
    └─ API sync: 2 seconds

    Note: Times vary based on:
    ├─ Network congestion
    ├─ Gas price
    └─ Block time
```

---

**Last Updated:** January 24, 2026
**Version:** 1.0
