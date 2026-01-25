# Farcaster Frames Integration - Complete

## Overview
Bet Bazzar now supports Farcaster Frames, allowing users to view and bet on prediction markets directly from their Farcaster feed (Warpcast, etc.).

## What Was Implemented

### 1. Frame API Endpoints
Created 3 API routes for Frame functionality:

#### `/api/frames/market/[id]/route.ts`
- Main Frame handler (GET/POST)
- Handles button interactions
- Returns Frame HTML with metadata
- Supports:
  - View Market (link to full page)
  - Bet YES (transaction flow)
  - Bet NO (transaction flow)

#### `/api/frames/market/[id]/image/route.tsx`
- Dynamic OG image generator using Next.js ImageResponse
- Creates beautiful market preview images
- Shows:
  - Market question
  - Current YES/NO percentages
  - Pool size and bet count
  - Bet Bazzar branding
- Supports bet confirmation images

#### `/api/frames/market/[id]/tx/route.ts`
- Transaction data generator
- Encodes `placeBet` function call
- Returns Farcaster transaction frame format
- Default bet: 10 USDT
- Supports both YES (0) and NO (1) choices

### 2. Frame Metadata
Created `apps/frontend/app/prediction/[id]/layout.tsx`:
- Generates dynamic metadata for each market
- Includes Farcaster Frame tags (`fc:frame`, `fc:frame:image`, etc.)
- Open Graph tags for social sharing
- Twitter Card tags

### 3. Share to Farcaster Component
Created `apps/frontend/app/components/ShareToFarcaster.tsx`:
- "Share to Farcaster" button - opens Warpcast composer
- "Copy Frame URL" button - copies Frame URL to clipboard
- Pre-fills Warpcast post with market details
- Embeds Frame in the cast
- Toast notifications for user feedback

### 4. Integration in Market Pages
Updated `apps/frontend/app/prediction/[id]/page.tsx`:
- Added ShareToFarcaster component in right sidebar
- Positioned after market stats
- Matches project's dark glass/gold-brass aesthetic

## Configuration

### Environment Variables
Added to `apps/frontend/.env.local`:
```bash
NEYNAR_API_KEY=A05C9F7E-86A1-4B1C-A48A-012E761110C4
NEXT_PUBLIC_APP_URL=https://cammy-nonparliamentary-memphis.ngrok-free.dev
```

### Dependencies
Installed:
```bash
npm install @neynar/nodejs-sdk
```

## How It Works

### User Flow
1. **Share Market**: User clicks "Share to Farcaster" on market page
2. **Warpcast Opens**: Opens Warpcast composer with pre-filled text and Frame embed
3. **User Posts**: User posts the cast to their Farcaster feed
4. **Frame Appears**: Followers see interactive Frame in their feed
5. **View/Bet**: Followers can:
   - Click "View Market" to open full page
   - Click "YES" or "NO" to initiate bet
   - Confirm transaction in their wallet

### Frame Interaction Flow
```
User sees Frame in feed
  ↓
Clicks "YES" or "NO"
  ↓
Frame shows bet confirmation screen
  ↓
User clicks "Confirm YES/NO Bet"
  ↓
Wallet prompts for transaction signature
  ↓
Transaction submitted to Monad Testnet
  ↓
Bet recorded on-chain
```

## Testing

### Local Testing
1. Start frontend: `npm run dev` (in `apps/frontend`)
2. Start ngrok: `ngrok http 3000`
3. Update `NEXT_PUBLIC_APP_URL` in `.env.local` with ngrok URL
4. Visit: `http://localhost:3000/prediction/bet-bazzar-launch`
5. Click "Share to Farcaster"

### Frame Validator
Test your Frame at:
- https://warpcast.com/~/developers/frames
- Paste Frame URL: `https://your-ngrok-url.ngrok-free.dev/api/frames/market/bet-bazzar-launch`

### Warpcast Testing
1. Post a cast with Frame URL
2. View in Warpcast mobile app or web
3. Test button interactions
4. Verify transaction flow

## Frame URLs

### Production
```
Frame URL: https://cammy-nonparliamentary-memphis.ngrok-free.dev/api/frames/market/[marketId]
Image URL: https://cammy-nonparliamentary-memphis.ngrok-free.dev/api/frames/market/[marketId]/image
Market URL: https://cammy-nonparliamentary-memphis.ngrok-free.dev/prediction/[marketId]
```

### Example
```
https://cammy-nonparliamentary-memphis.ngrok-free.dev/api/frames/market/bet-bazzar-launch
```

## Features

### Frame Capabilities
✅ View market details (question, odds, pool)
✅ See current YES/NO percentages
✅ Click to view full market page
✅ Initiate bets directly from feed
✅ Transaction signing via wallet
✅ Beautiful branded images
✅ Responsive to button clicks
✅ Multi-step interaction flow

### Share Features
✅ One-click share to Warpcast
✅ Pre-filled post text
✅ Automatic Frame embed
✅ Copy Frame URL
✅ Toast notifications
✅ Matches project aesthetic

## Technical Details

### Frame Specification
- Version: `vNext` (Farcaster Frames v2)
- Image size: 1200x630px
- Buttons: Up to 4 (using 3)
- Actions: `post`, `link`, `tx`
- Chain: Monad Testnet (Chain ID: 10143)

### Smart Contract Integration
- Contract: PredictionMarket (`0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B`)
- Function: `placeBet(marketId, choice, amount)`
- Default bet: 10 USDT (10000000 with 6 decimals)
- Requires USDT approval first

### Image Generation
- Uses Next.js `ImageResponse` API
- Edge runtime for fast generation
- Dynamic content based on market data
- Branded with Bet Bazzar colors
- Supports multiple states (default, bet confirmation)

## Next Steps

### Enhancements
1. **Dynamic Bet Amounts**: Allow users to specify bet amount in Frame
2. **Real Market Data**: Fetch live data from blockchain in Frame API
3. **Multiple Markets**: Support browsing multiple markets in Frame
4. **Bet History**: Show user's bet history in Frame
5. **Notifications**: Send Frame notifications when markets resolve
6. **Analytics**: Track Frame interactions and conversions

### Production Deployment
1. Deploy frontend to production (Vercel/Railway)
2. Update `NEXT_PUBLIC_APP_URL` to production domain
3. Test Frame in production environment
4. Submit Frame to Farcaster directory
5. Promote on Farcaster channels

## Resources

- [Farcaster Frames Docs](https://docs.farcaster.xyz/reference/frames/spec)
- [Neynar SDK Docs](https://docs.neynar.com/)
- [Frame Validator](https://warpcast.com/~/developers/frames)
- [Warpcast](https://warpcast.com/)

## Support

For issues or questions:
1. Check Frame validator for errors
2. Verify ngrok URL is accessible
3. Check browser console for errors
4. Test API endpoints directly
5. Verify environment variables are set

---

**Status**: ✅ Complete and Ready for Testing
**Last Updated**: January 25, 2026
