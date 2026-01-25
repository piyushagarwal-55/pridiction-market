/**
 * Farcaster Frame API for Prediction Markets
 * Allows users to view and bet on markets directly from Farcaster
 */

import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Mock market data - replace with real blockchain data
const getMarketData = async (marketId: string) => {
  // TODO: Fetch from blockchain
  return {
    id: marketId,
    question: "Will Bet Bazzar reach 1000 users by March 2026?",
    yesPercent: 42,
    noPercent: 58,
    totalPool: 1250,
    status: "Active",
  };
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { untrustedData } = body;
    const buttonIndex = untrustedData?.buttonIndex;
    const marketId = params.id;

    const market = await getMarketData(marketId);

    // Handle button clicks
    if (buttonIndex === 1) {
      // View Market - redirect to full page
      return new NextResponse(
        getFrameHTML({
          image: `${APP_URL}/api/frames/market/${marketId}/image`,
          postUrl: `${APP_URL}/api/frames/market/${marketId}`,
          buttons: [
            { label: '📊 View Full Market', action: 'link', target: `${APP_URL}/prediction/${marketId}` },
          ],
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (buttonIndex === 2) {
      // Bet YES
      return new NextResponse(
        getFrameHTML({
          image: `${APP_URL}/api/frames/market/${marketId}/image?action=bet&choice=yes`,
          postUrl: `${APP_URL}/api/frames/market/${marketId}`,
          buttons: [
            { label: '✅ Confirm YES Bet', action: 'tx', target: `${APP_URL}/api/frames/market/${marketId}/tx?choice=yes` },
            { label: '🔙 Back', action: 'post' },
          ],
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (buttonIndex === 3) {
      // Bet NO
      return new NextResponse(
        getFrameHTML({
          image: `${APP_URL}/api/frames/market/${marketId}/image?action=bet&choice=no`,
          postUrl: `${APP_URL}/api/frames/market/${marketId}`,
          buttons: [
            { label: '❌ Confirm NO Bet', action: 'tx', target: `${APP_URL}/api/frames/market/${marketId}/tx?choice=no` },
            { label: '🔙 Back', action: 'post' },
          ],
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Default frame
    return new NextResponse(
      getFrameHTML({
        image: `${APP_URL}/api/frames/market/${marketId}/image`,
        postUrl: `${APP_URL}/api/frames/market/${marketId}`,
        buttons: [
          { label: '📊 View Market', action: 'link', target: `${APP_URL}/prediction/${marketId}` },
          { label: `✅ YES ${market.yesPercent}%`, action: 'post' },
          { label: `❌ NO ${market.noPercent}%`, action: 'post' },
        ],
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Frame error:', error);
    return NextResponse.json({ error: 'Frame processing failed' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const marketId = params.id;
  const market = await getMarketData(marketId);

  return new NextResponse(
    getFrameHTML({
      image: `${APP_URL}/api/frames/market/${marketId}/image`,
      postUrl: `${APP_URL}/api/frames/market/${marketId}`,
      buttons: [
        { label: '📊 View Market', action: 'link', target: `${APP_URL}/prediction/${marketId}` },
        { label: `✅ YES ${market.yesPercent}%`, action: 'post' },
        { label: `❌ NO ${market.noPercent}%`, action: 'post' },
      ],
    }),
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Helper to generate Frame HTML
function getFrameHTML({
  image,
  postUrl,
  buttons,
}: {
  image: string;
  postUrl: string;
  buttons: Array<{ label: string; action?: string; target?: string }>;
}) {
  const buttonTags = buttons
    .map((btn, i) => {
      const action = btn.action || 'post';
      const target = btn.target ? `<meta property="fc:frame:button:${i + 1}:target" content="${btn.target}" />` : '';
      return `
        <meta property="fc:frame:button:${i + 1}" content="${btn.label}" />
        <meta property="fc:frame:button:${i + 1}:action" content="${action}" />
        ${target}
      `;
    })
    .join('\n');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${image}" />
        <meta property="fc:frame:post_url" content="${postUrl}" />
        ${buttonTags}
        <meta property="og:image" content="${image}" />
        <meta property="og:title" content="Bet Bazzar - Prediction Market" />
      </head>
      <body>
        <h1>Bet Bazzar Frame</h1>
      </body>
    </html>
  `;
}
