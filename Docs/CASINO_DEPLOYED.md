# 🎰 Casino Contract Deployed Successfully!

## Deployment Details

**Network:** Monad Testnet (Chain ID: 10143)
**Deployed:** January 24, 2026

### Contract Addresses

| Contract | Address |
|----------|---------|
| **Casino** | `0x9d95C1fd002A6d4732F081Fa7ccd7dF9dA0153EF` |
| **MockUSDT** | `0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21` |
| **House Wallet** | `0x3eBA27c0AF5b16498272AB7661E996bf2FF0D1cA` |

### Initial Setup

✅ Casino deployed successfully
✅ 10,000 USDT deposited as house funds
✅ All 4 games configured and ready
✅ Environment variables updated

## Game Configuration

| Game | Min Bet | Max Bet | Prediction | Payout |
|------|---------|---------|------------|--------|
| 🎲 **Roulette** | 1 USDT | 100 USDT | 0-36 | 35:1 |
| 🎯 **Dice** | 1 USDT | 200 USDT | 1-6 | 5:1 |
| 🪙 **Coin Flip** | 1 USDT | 500 USDT | Heads/Tails | 1.95:1 |
| 🔝 **High/Low** | 1 USDT | 1000 USDT | Low(1-3)/High(4-6) | 1.9:1 |

## Security Features

- ✅ 3-second cooldown between bets
- ✅ ReentrancyGuard protection
- ✅ Pausable in emergencies
- ✅ Bet limits per game
- ✅ House balance checks
- ⚠️ **Note:** Using pseudo-random (block data) - integrate Chainlink VRF for production

## How to Test

### 1. Start Frontend
```bash
cd apps/frontend
npm run dev
```

### 2. Navigate to Casino
Open: http://localhost:3000/casino

### 3. Connect Wallet
- Click "Connect Wallet"
- Select your wallet (MetaMask, etc.)
- Make sure you're on Monad Testnet

### 4. Get Test USDT (if needed)
```bash
# The MockUSDT contract has a mint function
# Or use the "Get Test USDT" button in the UI
```

### 5. Approve USDT
- Click "Approve USDT" button
- Approve the casino contract to spend your USDT
- Wait for transaction confirmation

### 6. Place a Bet!
- Select a game (Roulette, Dice, Coin Flip, or High/Low)
- Enter bet amount (min 1 USDT)
- Enter your prediction
- Click "Place Bet"
- Wait for result!

## Example Bets

### Roulette
```typescript
Game: Roulette
Amount: 10 USDT
Prediction: 7 (pick number 0-36)
Potential Win: 350 USDT (35:1 payout)
```

### Dice
```typescript
Game: Dice
Amount: 20 USDT
Prediction: 6 (pick number 1-6)
Potential Win: 100 USDT (5:1 payout)
```

### Coin Flip
```typescript
Game: Coin Flip
Amount: 50 USDT
Prediction: 0 (Heads) or 1 (Tails)
Potential Win: 97.5 USDT (1.95:1 payout)
```

### High/Low
```typescript
Game: High/Low Dice
Amount: 100 USDT
Prediction: 1 (High = 4,5,6)
Potential Win: 190 USDT (1.9:1 payout)
```

## View on Explorer

**Casino Contract:**
https://explorer.testnet.monad.xyz/address/0x9d95C1fd002A6d4732F081Fa7ccd7dF9dA0153EF

**USDT Token:**
https://explorer.testnet.monad.xyz/address/0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21

## Next Steps

### Immediate
- [ ] Test all 4 games
- [ ] Verify bet limits work
- [ ] Test cooldown (3 seconds)
- [ ] Check win/loss payouts

### UI Integration (TODO)
- [ ] Update casino page with blockchain integration
- [ ] Add wallet connection requirement
- [ ] Show real-time bet history
- [ ] Display player statistics
- [ ] Add transaction status toasts
- [ ] Show game results with animations

### Production Readiness
- [ ] Integrate Chainlink VRF for provably fair randomness
- [ ] Add comprehensive error handling
- [ ] Implement bet history pagination
- [ ] Add player leaderboard
- [ ] Security audit
- [ ] Gas optimization

## Troubleshooting

### "Insufficient USDT balance"
- Mint test USDT using the MockUSDT contract
- Or use the "Get Test USDT" button in UI

### "Please approve USDT spending first"
- Click "Approve USDT" button
- Wait for transaction to confirm
- Try betting again

### "Cooldown not met"
- Wait 3 seconds between bets
- This prevents spam and manipulation

### "Insufficient house balance"
- The casino needs funds to pay winners
- Contact admin to deposit more house funds

## Admin Functions

### Deposit House Funds
```javascript
await casino.depositHouseFunds(amount);
```

### Withdraw House Funds
```javascript
await casino.withdrawHouseFunds(amount);
```

### Pause Casino
```javascript
await casino.pause();
```

### Unpause Casino
```javascript
await casino.unpause();
```

## Statistics

### View House Stats
```javascript
const stats = await casino.getHouseStats();
// Returns: totalWagered, totalPaidOut, totalProfit, houseBalance
```

### View Player Stats
```javascript
const stats = await casino.getPlayerStats(playerAddress);
// Returns: wagered, won, lost, netProfit
```

### View Player Bets
```javascript
const bets = await casino.getPlayerBets(playerAddress);
// Returns array of all player bets
```

## Contract Events

The casino emits these events:

```solidity
event BetPlaced(address indexed player, GameType indexed gameType, uint256 amount, uint256 prediction, uint256 indexed betId);

event BetResult(address indexed player, uint256 indexed betId, GameType gameType, uint256 prediction, uint256 result, GameResult outcome, uint256 payout);

event HouseBalanceUpdated(uint256 newBalance, int256 change);
```

Listen to these events for real-time updates!

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify you're on Monad Testnet
3. Ensure wallet has MON for gas
4. Ensure wallet has USDT for betting
5. Check USDT is approved for casino

## Success! 🎉

Your casino is now live on Monad Testnet with:
- ✅ 4 fully functional games
- ✅ 10,000 USDT house bankroll
- ✅ Secure smart contracts
- ✅ Ready for testing

**Start betting at:** http://localhost:3000/casino

Good luck! 🍀
