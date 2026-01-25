/**
 * Frame Transaction Handler
 * Generates transaction data for betting from Farcaster
 */

import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData } from 'viem';

const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`;

// PredictionMarket ABI (placeBet function)
const PREDICTION_MARKET_ABI = [
  {
    inputs: [
      { name: 'marketId', type: 'string' },
      { name: 'choice', type: 'uint8' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const choice = searchParams.get('choice');
    const marketId = params.id;

    if (!choice || (choice !== 'yes' && choice !== 'no')) {
      return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });
    }

    // Default bet amount: 10 USDT (with 6 decimals)
    const betAmount = BigInt(10 * 10 ** 6);
    const betChoice = choice === 'yes' ? 0 : 1; // 0 = YES, 1 = NO

    // Encode the transaction data
    const data = encodeFunctionData({
      abi: PREDICTION_MARKET_ABI,
      functionName: 'placeBet',
      args: [marketId, betChoice, betAmount],
    });

    // Return Farcaster transaction frame response
    return NextResponse.json({
      chainId: `eip155:${process.env.NEXT_PUBLIC_CHAIN_ID}`, // Monad Testnet
      method: 'eth_sendTransaction',
      params: {
        abi: PREDICTION_MARKET_ABI,
        to: PREDICTION_MARKET_ADDRESS,
        data,
        value: '0',
      },
    });
  } catch (error) {
    console.error('Transaction generation error:', error);
    return NextResponse.json({ error: 'Failed to generate transaction' }, { status: 500 });
  }
}
