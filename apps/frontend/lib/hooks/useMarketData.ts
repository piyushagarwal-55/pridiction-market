/**
 * useMarketData Hook
 * 
 * Fetches real-time market data from the PredictionMarket smart contract
 * - Pool sizes (YES/NO)
 * - Pool percentages
 * - Total bets
 * - Market status
 * - Auto-refreshes every 5 seconds
 */

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/config/constants';
import { Hex } from 'viem';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketData {
    id: string;
    question: string;
    yesPool: bigint;
    noPool: bigint;
    totalPool: bigint;
    yesPercent: number;
    noPercent: number;
    startTime: bigint;
    endTime: bigint;
    status: 'ACTIVE' | 'CLOSED' | 'RESOLVED';
    winner: 'YES' | 'NO';
    totalBets: number;
    isLoading: boolean;
    error: string | null;
}

// ============================================================================
// CONTRACT ABI (only the functions we need)
// ============================================================================

const PREDICTION_MARKET_ABI = [
    {
        name: 'getMarket',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'id', type: 'string' },
            { name: 'question', type: 'string' },
            { name: 'yesPool', type: 'uint256' },
            { name: 'noPool', type: 'uint256' },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'status', type: 'uint8' },
            { name: 'winner', type: 'uint8' },
        ],
    },
    {
        name: 'getPoolInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'yesPool', type: 'uint256' },
            { name: 'noPool', type: 'uint256' },
            { name: 'totalPool', type: 'uint256' },
            { name: 'yesPercent', type: 'uint256' },
            { name: 'noPercent', type: 'uint256' },
        ],
    },
    {
        name: 'getBetCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'hasMarket',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

// ============================================================================
// HOOK
// ============================================================================

export function useMarketData(refreshInterval: number = 5000) {
    const publicClient = usePublicClient();
    
    const [marketData, setMarketData] = useState<MarketData>({
        id: '',
        question: '',
        yesPool: 0n,
        noPool: 0n,
        totalPool: 0n,
        yesPercent: 0,
        noPercent: 0,
        startTime: 0n,
        endTime: 0n,
        status: 'ACTIVE',
        winner: 'YES',
        totalBets: 0,
        isLoading: true,
        error: null,
    });

    const fetchMarketData = async () => {
        if (!publicClient) {
            console.log('⏳ Public client not ready');
            return;
        }

        try {
            console.log('📊 Fetching market data from contract...');

            // Check if market exists
            const hasMarket = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
                abi: PREDICTION_MARKET_ABI,
                functionName: 'hasMarket',
            });

            if (!hasMarket) {
                console.log('❌ No market exists on contract');
                setMarketData(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'No active market',
                }));
                return;
            }

            // Fetch market info
            const [marketInfo, poolInfo, betCount] = await Promise.all([
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
                    abi: PREDICTION_MARKET_ABI,
                    functionName: 'getMarket',
                }),
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
                    abi: PREDICTION_MARKET_ABI,
                    functionName: 'getPoolInfo',
                }),
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
                    abi: PREDICTION_MARKET_ABI,
                    functionName: 'getBetCount',
                }),
            ]);

            console.log('✅ Market data fetched:', {
                marketInfo,
                poolInfo,
                betCount,
            });

            // Parse market status
            const statusMap = ['ACTIVE', 'CLOSED', 'RESOLVED'] as const;
            const status = statusMap[marketInfo[6] as number] || 'ACTIVE';

            // Parse winner
            const winnerMap = ['YES', 'NO'] as const;
            const winner = winnerMap[marketInfo[7] as number] || 'YES';

            // Convert USDT (6 decimals) to readable format
            const yesPool = marketInfo[2] as bigint;
            const noPool = marketInfo[3] as bigint;
            const totalPool = poolInfo[2] as bigint;

            // Calculate percentages
            const yesPercent = totalPool > 0n 
                ? Number((yesPool * 100n) / totalPool)
                : 0;
            const noPercent = totalPool > 0n
                ? Number((noPool * 100n) / totalPool)
                : 0;

            setMarketData({
                id: marketInfo[0] as string,
                question: marketInfo[1] as string,
                yesPool,
                noPool,
                totalPool,
                yesPercent,
                noPercent,
                startTime: marketInfo[4] as bigint,
                endTime: marketInfo[5] as bigint,
                status,
                winner,
                totalBets: Number(betCount),
                isLoading: false,
                error: null,
            });

            console.log('📈 Market data updated:', {
                yesPercent,
                noPercent,
                totalBets: Number(betCount),
                totalPool: totalPool.toString(),
            });

        } catch (error) {
            console.error('❌ Error fetching market data:', error);
            setMarketData(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch market data',
            }));
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchMarketData();
    }, [publicClient]);

    // Auto-refresh
    useEffect(() => {
        if (!publicClient) return;

        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing market data...');
            fetchMarketData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [publicClient, refreshInterval]);

    // Manual refresh function
    const refresh = () => {
        console.log('🔄 Manual refresh triggered');
        fetchMarketData();
    };

    return {
        ...marketData,
        refresh,
        // Helper functions
        yesPoolUSDT: Number(marketData.yesPool) / 1_000_000,
        noPoolUSDT: Number(marketData.noPool) / 1_000_000,
        totalPoolUSDT: Number(marketData.totalPool) / 1_000_000,
    };
}

// ============================================================================
// HELPER: Format USDT
// ============================================================================

export function formatUSDT(amount: bigint): string {
    const usdt = Number(amount) / 1_000_000;
    return usdt.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}
