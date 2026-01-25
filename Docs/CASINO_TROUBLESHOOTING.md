# Casino Page Troubleshooting

## Issue: "No option to connect wallet on casino page"

### Solution

The ConnectButton is now added in **two places**:

1. **Header Navigation** (top right corner)
   - Look for "📱 WalletConnect" button next to the navigation links
   - Should appear after HOME, SPORTS, ESPORTS, CASINO, PREDICTION

2. **Betting Interface** (center of page)
   - If wallet is not connected, you'll see:
   - "Connect your wallet to start betting"
   - ConnectButton below that message

### If Button Still Not Visible

#### 1. Hard Refresh Browser
```bash
# Windows/Linux
Ctrl + Shift + R

# Mac
Cmd + Shift + R
```

#### 2. Clear Browser Cache
- Open DevTools (F12)
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

#### 3. Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart
cd apps/frontend
npm run dev
```

#### 4. Check Console for Errors
- Open DevTools (F12)
- Go to Console tab
- Look for any red errors
- Common issues:
  - Missing NEXT_PUBLIC_REOWN_PROJECT_ID
  - Network mismatch
  - Component import errors

#### 5. Verify Environment Variables
Check `apps/frontend/.env.local`:
```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=196186f35dc7a61f44d3c5ee129c13c1
NEXT_PUBLIC_CASINO_ADDRESS=0x9d95C1fd002A6d4732F081Fa7ccd7dF9dA0153EF
NEXT_PUBLIC_USDT_ADDRESS=0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21
```

### What the Button Looks Like

**When Disconnected:**
```
┌─────────────────────────┐
│  📱 WalletConnect       │
└─────────────────────────┘
```

**When Connected:**
```
┌──────────────────────────────────┐
│  [0x]  0x3eBA...D1cA    [✕]     │
└──────────────────────────────────┘
```

### Expected Behavior

1. **Page Loads**
   - Header shows "📱 WalletConnect" button
   - Betting interface shows "Connect your wallet to start betting"

2. **Click Connect Button**
   - Modal opens with wallet options
   - Select MetaMask, WalletConnect, etc.

3. **After Connection**
   - Button shows your address
   - Betting interface becomes active
   - Can now approve USDT and place bets

### Alternative: Use Browser Extension

If button still doesn't work, you can connect via:

1. **MetaMask Extension**
   - Click MetaMask icon
   - Select "Connected sites"
   - Add localhost:3000

2. **WalletConnect**
   - Use WalletConnect modal directly
   - Scan QR code with mobile wallet

### Debug Steps

#### Check if Component is Rendering
Open DevTools Console and run:
```javascript
// Check if ConnectButton exists in DOM
document.querySelector('button')?.innerText.includes('WalletConnect')
```

#### Check Wallet Connection State
```javascript
// In browser console
window.ethereum?.isConnected()
```

#### Check Network
```javascript
// Should be 10143 (Monad Testnet)
window.ethereum?.request({ method: 'eth_chainId' })
```

### Still Not Working?

1. **Check Screenshot**
   - Take a screenshot of the casino page
   - Look for the navigation bar at the top
   - ConnectButton should be after "PREDICTION" link

2. **Check Browser**
   - Try different browser (Chrome, Firefox, Brave)
   - Disable ad blockers
   - Disable privacy extensions

3. **Check Wallet**
   - Install MetaMask if not installed
   - Make sure wallet is unlocked
   - Switch to Monad Testnet

4. **Check Code**
   - File: `apps/frontend/app/casino/page.tsx`
   - Line 7: `import { ConnectButton } from "@/app/components/wallet/ConnectButton";`
   - Line 214: `<ConnectButton />` in header
   - Line 270: `<ConnectButton />` in betting interface

### Quick Test

Run this in your terminal:
```bash
# Check if ConnectButton component exists
cat apps/frontend/app/components/wallet/ConnectButton.tsx

# Should show the component code
```

### Contact Support

If none of the above works:
1. Share screenshot of casino page
2. Share browser console errors
3. Share network tab (DevTools)
4. Confirm you're on http://localhost:3000/casino

## Common Issues & Fixes

### Issue: Button Appears But Doesn't Work
**Fix:** Check NEXT_PUBLIC_REOWN_PROJECT_ID in .env.local

### Issue: Modal Opens But Can't Connect
**Fix:** Make sure you're on Monad Testnet (Chain ID: 10143)

### Issue: Connected But Can't Bet
**Fix:** Approve USDT first, then place bet

### Issue: "Wallet not connected" Error
**Fix:** Hard refresh page after connecting wallet

## Success Indicators

✅ ConnectButton visible in header
✅ ConnectButton visible in betting interface (when disconnected)
✅ Clicking button opens wallet modal
✅ Can select wallet and connect
✅ Address shows in button after connection
✅ Betting interface becomes active
✅ Can approve USDT
✅ Can place bets

## Next Steps After Connecting

1. Click "Approve USDT" button
2. Confirm transaction in wallet
3. Wait for confirmation
4. Select a game
5. Enter bet amount
6. Enter prediction
7. Click "Place Bet"
8. Confirm transaction
9. See result!

Good luck! 🎰
