# X402 Payment Flow Troubleshooting

## Issues Identified

### Issue 1: 400 Bad Request - Invalid Side
**Root Cause:** The backend validation was rejecting valid side values because it didn't support the yes/no terminology used in prediction markets.

**Symptoms:**
- First request shows `400 Bad Request`
- Error message: "Invalid side"

**Fix Applied:**
- Added side normalization in `apps/backend/app/api/v1/x402.py`
- Now supports: `yes → home`, `no → away`, plus `over`, `under`
- Improved error messages to show which sides are valid

### Issue 2: 402 Payment Required - Zero Address
**Root Cause:** The `Payment-Required` header contains `0x0000000000000000000000000000000000000000` (zero address) which cannot receive payments.

**Symptoms:**
```
Payment-Required: crypto-cronos://0x0000000000000000000000000000000000000000@0.197965
```

**Required Fix:** Set proper environment variables in your backend:

```bash
# Backend (.env or Railway)
X402_PAYEE_ADDRESS=0xYourActualWalletAddress
MARKET_MANAGER_ADDRESS=0xYourContractAddress  # fallback if X402_PAYEE_ADDRESS not set
NETWORK=cronos  # or monad-testnet
```

### Issue 3: Network Prefix Mismatch
**Previous:** Header used `monad-testnet` prefix  
**Current:** Changed to `cronos` (configurable via `NETWORK` env var)

## Changes Made

### 1. Backend: `apps/backend/app/api/v1/x402.py`
- ✅ Added side normalization (yes/no/home/away/over/under)
- ✅ Improved error messages with detailed validation info
- ✅ Added console logging for debugging
- ✅ Changed default network from `monad-testnet` to `cronos`
- ✅ Added payment address logging

### 2. Backend: `apps/backend/app/services/market_manager.py`
- ✅ Increased exposure limits from 10.0 to 100.0
- ✅ Added over/under support for sports markets
- ✅ Improved documentation

### 3. Frontend: `apps/frontend/app/api/x402/place-bet/route.ts`
- ✅ Added comprehensive logging
- ✅ Better error reporting
- ✅ Logs request body, backend response status, and payment headers

### 4. Frontend: `apps/frontend/app/api/x402/confirm/route.ts`
- ✅ Added logging for payment confirmation flow

## Testing the Fix

### Step 1: Set Environment Variables
```bash
# In Railway or your backend .env
export X402_PAYEE_ADDRESS="0xYourRealCronosAddress"
export NETWORK="cronos"
```

### Step 2: Restart Backend
```bash
cd apps/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Test the Flow
1. Navigate to `/prediction/btc-100k` (or any market)
2. Connect your Cronos wallet
3. Enter a bet amount (e.g., 0.1)
4. Click "Buy Yes" or "Buy No"
5. Check the browser console for logs:
   ```
   [PLACE-BET] Request body: {market_id: "...", side: "home", stake: 0.1}
   [PLACE-BET] Backend response: 402
   [PLACE-BET] Payment-Required: crypto-cronos://0xYourAddress@0.197965
   ```
6. Backend console should show:
   ```
   [X402] Quote abc-123: market=btc-100k, side=home, stake=0.1, price=0.197965
   [X402] Payment address: 0xYourAddress
   ```

### Step 4: Verify Payment Flow
- Wallet should prompt for transaction to the correct address
- After signing, confirm endpoint should be called
- Check logs: `[X402-CONFIRM] Confirming quote: abc-123`

## Expected Request/Response Flow

### 1. Initial Bet Request (Frontend → Backend)
```http
POST /api/x402/place-bet
Content-Type: application/json

{
  "market_id": "btc-100k",
  "side": "home",  // or "yes" - both work now
  "stake": 0.1
}
```

### 2. Backend 402 Response
```http
HTTP/1.1 402 Payment Required
Payment-Required: crypto-cronos://0xYourAddress@0.197965
X-Quote-ID: 8000b0d8-1949-40f6-86e8-e7b6b0ed7ccb
Retry-After: 300
Content-Type: application/json

{
  "quote_id": "8000b0d8-1949-40f6-86e8-e7b6b0ed7ccb",
  "market_id": "btc-100k",
  "side": "home",
  "odds": 1.91,
  "price": 0.197965,
  "max_stake": 1.0,
  "expires_at": 1706091067
}
```

### 3. Wallet Transaction
Frontend sends CRO to the payee address for the exact amount.

### 4. Confirmation Request
```http
POST /api/x402/confirm
Content-Type: application/json

{
  "quote_id": "8000b0d8-1949-40f6-86e8-e7b6b0ed7ccb"
}
```

## Common Errors & Solutions

### Error: "Invalid side: xxx"
**Cause:** Unsupported side value  
**Solution:** Use one of: `yes`, `no`, `home`, `away`, `over`, `under`

### Error: Payment to zero address
**Cause:** `X402_PAYEE_ADDRESS` not set  
**Solution:** Set proper wallet address in environment variables

### Error: "Exceeds exposure limit"
**Cause:** Total bets on this side exceed 100.0  
**Solution:** Wait or reduce bet size (this is a safety limit)

### Error: Network mismatch
**Cause:** Wallet on wrong network  
**Solution:** Switch wallet to Cronos network (or whatever `NETWORK` is set to)

## Monitoring & Debugging

### Backend Logs to Watch
```
[X402] Quote <id>: market=<market_id>, side=<side>, stake=<stake>, price=<price>
[X402] Payment address: <address>
```

### Frontend Logs to Watch
```
[PLACE-BET] Request body: {...}
[PLACE-BET] Forwarding: market=..., side=..., stake=...
[PLACE-BET] Backend response: 402
[PLACE-BET] Payment-Required: crypto-cronos://...
[X402-CONFIRM] Confirming quote: ...
```

### Network Tab Headers
Check in browser DevTools → Network:
- **Request Headers:** `Content-Type: application/json`
- **Response Headers:** 
  - `Payment-Required: crypto-cronos://0xAddress@amount`
  - `X-Quote-ID: uuid`
  - `Retry-After: 300`

## Next Steps

1. **Immediate:** Set `X402_PAYEE_ADDRESS` to a real Cronos address
2. **Testing:** Test the complete flow with a small amount
3. **Production:** 
   - Set up proper treasury/multisig address
   - Add transaction verification
   - Implement proper payment confirmation with on-chain checks
4. **Security:** 
   - Add rate limiting per wallet address
   - Verify on-chain payments before confirming bets
   - Add quote expiration enforcement

## Reference Files
- Backend X402: [apps/backend/app/api/v1/x402.py](apps/backend/app/api/v1/x402.py)
- Frontend Proxy: [apps/frontend/app/api/x402/place-bet/route.ts](apps/frontend/app/api/x402/place-bet/route.ts)
- Payment Hook: [apps/frontend/lib/x402.ts](apps/frontend/lib/x402.ts)
- Documentation: [x402.md](x402.md)
