# Farcaster Frames - Quick Start Guide

## 🚀 Testing Your Farcaster Frame

### Prerequisites
- ✅ Neynar SDK installed (`@neynar/nodejs-sdk`)
- ✅ Environment variables configured in `.env.local`
- ✅ Frontend running locally or deployed
- ✅ ngrok installed (for local testing)

### Step 1: Start Your Development Server

```bash
cd apps/frontend
npm run dev
```

Your app should be running at `http://localhost:3000`

### Step 2: Expose with ngrok (Local Testing Only)

```bash
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Update Environment Variable

Update `apps/frontend/.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.app
```

Restart your dev server after changing this.

### Step 4: Test the Frame

#### Option A: Frame Validator (Recommended)
1. Go to: https://warpcast.com/~/developers/frames
2. Paste your Frame URL:
   ```
   https://your-ngrok-url.ngrok-free.app/api/frames/market/bet-bazzar-launch
   ```
3. Click "Load Frame"
4. Test button interactions

#### Option B: Direct Testing
1. Visit your market page:
   ```
   http://localhost:3000/prediction/bet-bazzar-launch
   ```
2. Scroll to the "SHARE" section in the right sidebar
3. Click "Share to Farcaster"
4. Warpcast composer will open with your Frame embedded

### Step 5: Post to Farcaster

1. In Warpcast composer, review the pre-filled text
2. Click "Cast" to post
3. View your cast in your Farcaster feed
4. The Frame should appear with interactive buttons

### Step 6: Test Frame Interactions

Click the buttons in your Frame:
- **📊 View Market**: Opens full market page
- **✅ YES**: Initiates YES bet flow
- **❌ NO**: Initiates NO bet flow

## 🎯 What to Test

### Frame Display
- [ ] Frame image loads correctly
- [ ] Market question is visible
- [ ] YES/NO percentages are shown
- [ ] Pool size and bet count are displayed
- [ ] Bet Bazzar branding is visible

### Button Interactions
- [ ] "View Market" button opens correct URL
- [ ] "YES" button shows bet confirmation screen
- [ ] "NO" button shows bet confirmation screen
- [ ] Bet confirmation shows correct choice
- [ ] Transaction button appears after confirmation

### Transaction Flow
- [ ] Clicking "Confirm YES/NO Bet" triggers wallet
- [ ] Transaction data is correctly formatted
- [ ] Wallet shows correct contract address
- [ ] Wallet shows correct function (placeBet)
- [ ] Transaction can be signed and submitted

### Share Functionality
- [ ] "Share to Farcaster" button works
- [ ] Warpcast composer opens
- [ ] Text is pre-filled correctly
- [ ] Frame is embedded in cast
- [ ] "Copy Frame URL" copies correct URL
- [ ] Toast notifications appear

## 🐛 Troubleshooting

### Frame Not Loading
- Check ngrok URL is accessible
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check browser console for errors
- Ensure dev server is running

### Image Not Showing
- Visit image URL directly: `/api/frames/market/[id]/image`
- Check for errors in terminal
- Verify Next.js ImageResponse is working

### Buttons Not Working
- Check Frame validator for errors
- Verify button metadata is correct
- Check POST endpoint is responding
- Look for errors in browser console

### Transaction Fails
- Verify contract address is correct
- Check wallet is connected to Monad Testnet
- Ensure USDT is approved
- Check transaction data encoding

## 📱 Testing on Mobile

### Warpcast Mobile App
1. Install Warpcast app (iOS/Android)
2. Post a cast with your Frame URL
3. View in your feed
4. Test interactions on mobile

### Mobile Browser
1. Open Warpcast web on mobile
2. View your cast
3. Test Frame interactions

## 🌐 Production Deployment

### When Ready for Production:

1. **Deploy Frontend**
   ```bash
   # Deploy to Vercel, Railway, or your hosting
   vercel deploy --prod
   ```

2. **Update Environment Variable**
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-production-domain.com
   ```

3. **Test Production Frame**
   - Use Frame validator with production URL
   - Post test cast from your account
   - Verify all interactions work

4. **Promote Your Frame**
   - Share on Farcaster channels
   - Add to Farcaster Frame directory
   - Promote in your community

## 🎨 Customization

### Change Frame Image
Edit `apps/frontend/app/api/frames/market/[id]/image/route.tsx`:
- Modify colors, fonts, layout
- Add your branding
- Change image dimensions (keep 1200x630 for best results)

### Change Button Labels
Edit `apps/frontend/app/api/frames/market/[id]/route.ts`:
- Modify button labels
- Change button actions
- Add more buttons (max 4)

### Change Bet Amount
Edit `apps/frontend/app/api/frames/market/[id]/tx/route.ts`:
- Change default bet amount (currently 10 USDT)
- Add dynamic amount selection

## 📊 Analytics

Track Frame performance:
- Views: Check Warpcast analytics
- Clicks: Add analytics to Frame API
- Conversions: Track on-chain bets from Frame
- Engagement: Monitor cast interactions

## 🔗 Useful Links

- **Frame Validator**: https://warpcast.com/~/developers/frames
- **Farcaster Docs**: https://docs.farcaster.xyz/reference/frames/spec
- **Neynar Docs**: https://docs.neynar.com/
- **Warpcast**: https://warpcast.com/
- **ngrok**: https://ngrok.com/

## 💡 Tips

1. **Test Locally First**: Always test with Frame validator before posting
2. **Use ngrok**: Essential for local testing
3. **Check Logs**: Monitor terminal for API errors
4. **Mobile Testing**: Test on actual mobile devices
5. **Cache Issues**: Clear browser cache if Frame doesn't update
6. **Image Size**: Keep images under 1MB for fast loading
7. **Button Limit**: Maximum 4 buttons per Frame
8. **Transaction Testing**: Test with small amounts first

## 🎉 Success Checklist

- [ ] Frame loads in validator
- [ ] Image displays correctly
- [ ] All buttons work
- [ ] Transaction flow completes
- [ ] Share button works
- [ ] Mobile testing passed
- [ ] Production deployment successful
- [ ] First cast posted with Frame
- [ ] Community engagement started

---

**Need Help?**
- Check Frame validator for specific errors
- Review browser console logs
- Test API endpoints directly
- Verify environment variables

**Ready to Launch?**
Once everything works locally, deploy to production and start sharing your Frames on Farcaster! 🚀
