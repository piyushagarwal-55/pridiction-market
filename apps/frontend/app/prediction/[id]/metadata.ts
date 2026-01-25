/**
 * Dynamic metadata for prediction market pages
 * Includes Farcaster Frame tags
 */

import { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const marketId = params.id;
  
  // TODO: Fetch real market data from blockchain
  const marketQuestion = "Will Bet Bazzar reach 1000 users by March 2026?";
  
  return {
    title: `${marketQuestion} | Bet Bazzar`,
    description: 'Bet on prediction markets with blockchain transparency',
    openGraph: {
      title: marketQuestion,
      description: 'Bet on prediction markets with blockchain transparency',
      images: [`${APP_URL}/api/frames/market/${marketId}/image`],
    },
    other: {
      // Farcaster Frame metadata
      'fc:frame': 'vNext',
      'fc:frame:image': `${APP_URL}/api/frames/market/${marketId}/image`,
      'fc:frame:post_url': `${APP_URL}/api/frames/market/${marketId}`,
      'fc:frame:button:1': '📊 View Market',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': `${APP_URL}/prediction/${marketId}`,
      'fc:frame:button:2': '✅ Bet YES',
      'fc:frame:button:2:action': 'post',
      'fc:frame:button:3': '❌ Bet NO',
      'fc:frame:button:3:action': 'post',
    },
  };
}
