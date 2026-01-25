/**
 * Frame Image Generator
 * Generates dynamic OG images for Farcaster Frames
 */

import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Mock market data
const getMarketData = async (marketId: string) => {
  return {
    id: marketId,
    question: "Will Bet Bazzar reach 1000 users by March 2026?",
    yesPercent: 42,
    noPercent: 58,
    totalPool: 1250,
    totalBets: 47,
    status: "Active",
  };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const choice = searchParams.get('choice');
    const marketId = params.id;

    const market = await getMarketData(marketId);

    // Bet confirmation image
    if (action === 'bet' && choice) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1F3D2B',
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(194,161,77,0.15), transparent 70%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                backgroundColor: 'rgba(10,14,12,0.8)',
                borderRadius: '32px',
                border: '2px solid rgba(194,161,77,0.5)',
                maxWidth: '900px',
              }}
            >
              <div style={{ fontSize: 48, color: '#C2A14D', marginBottom: 20 }}>
                {choice === 'yes' ? '✅' : '❌'}
              </div>
              <div style={{ fontSize: 72, fontWeight: 'bold', color: '#F3EBDD', marginBottom: 20, textAlign: 'center' }}>
                Bet {choice?.toUpperCase()}
              </div>
              <div style={{ fontSize: 32, color: '#D8CFC0', marginBottom: 40, textAlign: 'center', maxWidth: '800px' }}>
                {market.question}
              </div>
              <div style={{ display: 'flex', gap: 40 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 24, color: '#B08D57' }}>Current Odds</div>
                  <div style={{ fontSize: 56, fontWeight: 'bold', color: choice === 'yes' ? '#C2A14D' : '#D8CFC0' }}>
                    {choice === 'yes' ? market.yesPercent : market.noPercent}%
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 24, color: '#B08D57' }}>Pool Size</div>
                  <div style={{ fontSize: 56, fontWeight: 'bold', color: '#F3EBDD' }}>
                    ${market.totalPool}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Default market image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1F3D2B',
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(194,161,77,0.15), transparent 70%)',
            padding: '60px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 64, fontWeight: 'bold', color: '#F3EBDD', letterSpacing: '0.1em' }}>
              Bet Bazzar
            </div>
            <div
              style={{
                marginLeft: 20,
                padding: '8px 16px',
                backgroundColor: 'rgba(194,161,77,0.2)',
                border: '2px solid rgba(194,161,77,0.5)',
                borderRadius: '999px',
                fontSize: 20,
                color: '#C2A14D',
                fontWeight: 'bold',
              }}
            >
              {market.status}
            </div>
          </div>

          {/* Question */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#F3EBDD',
              textAlign: 'center',
              marginBottom: 50,
              maxWidth: '1000px',
              lineHeight: 1.2,
            }}
          >
            {market.question}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 60, marginBottom: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 28, color: '#B08D57', marginBottom: 10 }}>YES</div>
              <div style={{ fontSize: 72, fontWeight: 'bold', color: '#C2A14D' }}>
                {market.yesPercent}%
              </div>
            </div>
            <div
              style={{
                width: 2,
                height: 120,
                backgroundColor: 'rgba(176,141,87,0.3)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 28, color: '#B08D57', marginBottom: 10 }}>NO</div>
              <div style={{ fontSize: 72, fontWeight: 'bold', color: '#D8CFC0' }}>
                {market.noPercent}%
              </div>
            </div>
          </div>

          {/* Pool info */}
          <div style={{ display: 'flex', gap: 40, fontSize: 24, color: '#D8CFC0' }}>
            <div>💰 Pool: ${market.totalPool}</div>
            <div>📊 Bets: {market.totalBets}</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
