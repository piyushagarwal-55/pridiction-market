import { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: marketId } = await params;
  
  // TODO: Fetch real market data from blockchain
  const marketQuestion = "Will Bet Bazzar reach 1000 users by March 2026?";
  const marketDescription = "Prediction market for Bet Bazzar platform adoption milestone";
  
  const frameImageUrl = `${APP_URL}/api/frames/market/${marketId}/image`;
  const framePostUrl = `${APP_URL}/api/frames/market/${marketId}`;
  const marketUrl = `${APP_URL}/prediction/${marketId}`;
  
  return {
    title: `${marketQuestion} | Bet Bazzar`,
    description: marketDescription,
    openGraph: {
      title: marketQuestion,
      description: marketDescription,
      images: [frameImageUrl],
      url: marketUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: marketQuestion,
      description: marketDescription,
      images: [frameImageUrl],
    },
    other: {
      // Farcaster Frame metadata
      'fc:frame': 'vNext',
      'fc:frame:image': frameImageUrl,
      'fc:frame:post_url': framePostUrl,
      'fc:frame:button:1': '📊 View Market',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': marketUrl,
      'fc:frame:button:2': '✅ Bet YES',
      'fc:frame:button:2:action': 'post',
      'fc:frame:button:3': '❌ Bet NO',
      'fc:frame:button:3:action': 'post',
    },
  };
}

export default function PredictionMarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
