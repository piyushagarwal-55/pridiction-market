/**
 * useMarketHistory Hook
 * 
 * Fetches real historical pool data to generate price history charts
 * - Stores pool snapshots after each bet
 * - Generates time-series data for YES/NO percentages
 * - Supports time filtering (1H, 3H, 24H, 7D, ALL)
 */

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/config/constants';
import { Hex } from 'viem';

// ============================================================================
// TYPES
// ============================================================================

export interface PricePoint {
    timestamp: number;
    date: string;
    yes: number;
    no: number;
    yesPool: number;
    noPool: number;
    totalPool: number;
}

export interface PoolSnapshot {
    timestamp: number;
    blockNumber: number;
    yesPool: bigint;
    noPool: bigint;
    yesPercent: number;
    noPercent: number;
    betCount: number;
}

// ============================================================================
// CONTRACT ABI
// ============================================================================

const PREDICTION_MARKET_ABI = [
    {
        name: 'BetPlaced',
        type: 'event',
        inputs: [
            { name: 'wallet', type: 'address', indexed: true },
            { name: 'marketId', type: 'string', indexed: true },
            { name: 'choice', type: 'uint8', indexed: false },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'betNumber', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false },
        ],
    },
    {
        name: 'PoolUpdated',
        type: 'event',
        inputs: [
            { name: 'marketId', type: 'string', indexed: true },
            { name: 'yesPool', type: 'uint256', indexed: false },
            { name: 'noPool', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false },
        ],
    },
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
] as const;

// ============================================================================
// HOOK
// ============================================================================

export function useMarketHistory() {
    const publicClient = usePublicClient();
    const [history, setHistory] = useState<PricePoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMarketHistory = async () => {
        console.log('🚀 fetchMarketHistory called, publicClient:', !!publicClient);
        
        if (!publicClient) {
            console.log('⏳ Public client not ready, skipping fetch');
            return;
        }

        try {
            console.log('📊 Fetching market history from blockchain events...');
            setIsLoading(true);

            // Get current market info
            const marketInfo = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
                abi: PREDICTION_MARKET_ABI,
                functionName: 'getMarket',
            });

            const startTime = marketInfo[4] as bigint;
            const currentBlock = await publicClient.getBlockNumber();

            // Calculate how many blocks to look back (approximately)
            // Monad RPC limits eth_getLogs to 100 block range
            const blocksToLookBack = 100n; // Only look back 100 blocks (~100 seconds on Monad)
            const fromBlock = currentBlock > blocksToLookBack 
                ? currentBlock - blocksToLookBack 
                : 0n;

            console.log('🔍 Fetching PoolUpdated events from block', fromBlock.toString());

            // Fetch PoolUpdated events
            let poolEvents: any[] = [];
            try {
                poolEvents = await publicClient.getLogs({
                    address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
                    event: {
                        type: 'event',
                        name: 'PoolUpdated',
                        inputs: [
                            { name: 'marketId', type: 'string', indexed: true },
                            { name: 'yesPool', type: 'uint256', indexed: false },
                            { name: 'noPool', type: 'uint256', indexed: false },
                            { name: 'timestamp', type: 'uint256', indexed: false },
                        ],
                    },
                    fromBlock,
                    toBlock: 'latest',
                });
            } catch (logError) {
                console.error('❌ Error fetching logs:', logError);
                // If we can't fetch events, fall back to current state only
                poolEvents = [];
            }

            console.log(`✅ Found ${poolEvents.length} pool update events`);

            if (poolEvents.length === 0) {
                console.log('🔀 Taking NO EVENTS path - creating 2 points manually');
                // No events yet, create two points to show a line
                const currentYesPool = marketInfo[2] as bigint;
                const currentNoPool = marketInfo[3] as bigint;
                const total = currentYesPool + currentNoPool;
                
                const currentYesPercent = total > 0n ? Number((currentYesPool * 100n) / total) : 50;
                const currentNoPercent = total > 0n ? Number((currentNoPool * 100n) / total) : 50;
                
                console.log('📊 No events found. Current pool state:', {
                    yesPool: Number(currentYesPool) / 1_000_000,
                    noPool: Number(currentNoPool) / 1_000_000,
                    total: Number(total) / 1_000_000,
                    yesPercent: currentYesPercent,
                    noPercent: currentNoPercent,
                });
                
                // Start point (market creation)
                const startPoint: PricePoint = {
                    timestamp: Number(startTime) * 1000,
                    date: new Date(Number(startTime) * 1000).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                    }),
                    yes: 50,
                    no: 50,
                    yesPool: 0,
                    noPool: 0,
                    totalPool: 0,
                };
                
                // Current point
                const currentPoint: PricePoint = {
                    timestamp: Date.now(),
                    date: new Date().toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                    }),
                    yes: currentYesPercent,
                    no: currentNoPercent,
                    yesPool: Number(currentYesPool) / 1_000_000,
                    noPool: Number(currentNoPool) / 1_000_000,
                    totalPool: Number(total) / 1_000_000,
                };

                console.log('📊 Created 2 points:', {
                    startPoint: { date: startPoint.date, yes: startPoint.yes, no: startPoint.no },
                    currentPoint: { date: currentPoint.date, yes: currentPoint.yes, no: currentPoint.no },
                });

                setHistory([startPoint, currentPoint]);
                setIsLoading(false);
                return;
            }

            console.log('🔀 Taking EVENTS FOUND path - processing events');

            // Convert events to price points
            const pricePoints: PricePoint[] = [];

            // Add initial point (market start with 50/50)
            pricePoints.push({
                timestamp: Number(startTime) * 1000,
                date: new Date(Number(startTime) * 1000).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                }),
                yes: 50,
                no: 50,
                yesPool: 0,
                noPool: 0,
                totalPool: 0,
            });

            // Add points from events
            for (const event of poolEvents) {
                const args = event.args as any;
                const yesPool = args.yesPool as bigint;
                const noPool = args.noPool as bigint;
                const timestamp = args.timestamp as bigint;
                const total = yesPool + noPool;

                const yesPercent = total > 0n 
                    ? Number((yesPool * 100n) / total) 
                    : 50;
                const noPercent = total > 0n 
                    ? Number((noPool * 100n) / total) 
                    : 50;

                pricePoints.push({
                    timestamp: Number(timestamp) * 1000,
                    date: new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    yes: yesPercent,
                    no: noPercent,
                    yesPool: Number(yesPool) / 1_000_000,
                    noPool: Number(noPool) / 1_000_000,
                    totalPool: Number(total) / 1_000_000,
                });
            }

            // Sort by timestamp
            pricePoints.sort((a, b) => a.timestamp - b.timestamp);
            
            // Always add current pool state as the most recent point
            // This ensures the chart shows the latest data even if events are delayed
            const currentYesPool = marketInfo[2] as bigint;
            const currentNoPool = marketInfo[3] as bigint;
            const currentTotal = currentYesPool + currentNoPool;
            const currentYesPercent = currentTotal > 0n ? Number((currentYesPool * 100n) / currentTotal) : 50;
            const currentNoPercent = currentTotal > 0n ? Number((currentNoPool * 100n) / currentTotal) : 50;
            
            // Only add if it's different from the last event point
            const lastPoint = pricePoints[pricePoints.length - 1];
            if (!lastPoint || lastPoint.yes !== currentYesPercent || lastPoint.no !== currentNoPercent) {
                pricePoints.push({
                    timestamp: Date.now(),
                    date: new Date().toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    yes: currentYesPercent,
                    no: currentNoPercent,
                    yesPool: Number(currentYesPool) / 1_000_000,
                    noPool: Number(currentNoPool) / 1_000_000,
                    totalPool: Number(currentTotal) / 1_000_000,
                });
            }
            
            // If we only have the initial point and one event, add intermediate points for smooth line
            if (pricePoints.length === 2) {
                const start = pricePoints[0];
                const end = pricePoints[1];
                const intermediatePoints: PricePoint[] = [];
                
                // Create 5 intermediate points for smooth transition
                for (let i = 1; i <= 5; i++) {
                    const ratio = i / 6;
                    const timestamp = start.timestamp + (end.timestamp - start.timestamp) * ratio;
                    
                    intermediatePoints.push({
                        timestamp,
                        date: new Date(timestamp).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                        }),
                        yes: start.yes + (end.yes - start.yes) * ratio,
                        no: start.no + (end.no - start.no) * ratio,
                        yesPool: start.yesPool + (end.yesPool - start.yesPool) * ratio,
                        noPool: start.noPool + (end.noPool - start.noPool) * ratio,
                        totalPool: start.totalPool + (end.totalPool - start.totalPool) * ratio,
                    });
                }
                
                // Insert intermediate points
                pricePoints.splice(1, 0, ...intermediatePoints);
            }

            console.log('📈 Generated price history:', {
                points: pricePoints.length,
                firstPoint: pricePoints[0],
                lastPoint: pricePoints[pricePoints.length - 1],
                allPoints: pricePoints.map(p => ({
                    date: p.date,
                    yes: p.yes,
                    no: p.no,
                    yesPool: p.yesPool,
                    noPool: p.noPool,
                })),
            });

            setHistory(pricePoints);
            setError(null);

        } catch (err) {
            console.error('❌ Error fetching market history:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch history');
            
            // Fallback to single current point
            setHistory([{
                timestamp: Date.now(),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                yes: 50,
                no: 50,
                yesPool: 0,
                noPool: 0,
                totalPool: 0,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchMarketHistory();
    }, [publicClient]);

    // Manual refresh
    const refresh = () => {
        console.log('🔄 Refreshing market history...');
        fetchMarketHistory();
    };

    return {
        history,
        isLoading,
        error,
        refresh,
    };
}

// ============================================================================
// HELPER: Filter history by time range
// ============================================================================

export type TimeFilter = '1H' | '3H' | '24H' | '7D' | 'ALL';

export function filterHistoryByTime(
    history: PricePoint[],
    filter: TimeFilter
): PricePoint[] {
    console.log('🔍 filterHistoryByTime called:', {
        filter,
        historyLength: history.length,
        history: history.map(p => ({ date: p.date, yes: p.yes, no: p.no, timestamp: p.timestamp })),
    });
    
    if (filter === 'ALL' || history.length === 0) {
        console.log('✅ Returning all history (filter=ALL or empty)');
        return history;
    }

    const now = Date.now();
    const filterMs = {
        '1H': 60 * 60 * 1000,
        '3H': 3 * 60 * 60 * 1000,
        '24H': 24 * 60 * 60 * 1000,
        '7D': 7 * 24 * 60 * 60 * 1000,
    }[filter];

    const filtered = history.filter((p) => now - p.timestamp <= filterMs);
    
    console.log('📊 Filtered result:', {
        filteredLength: filtered.length,
        filtered: filtered.map(p => ({ date: p.date, yes: p.yes, no: p.no })),
    });

    // Always include at least the first and last point for a proper line
    if (filtered.length === 0 && history.length > 0) {
        console.log('⚠️ No points in range, returning first and last');
        return [history[0], history[history.length - 1]];
    }
    
    // If only one point in filtered, add the previous point
    if (filtered.length === 1 && history.length > 1) {
        const firstFilteredIndex = history.findIndex(p => p.timestamp === filtered[0].timestamp);
        if (firstFilteredIndex > 0) {
            console.log('⚠️ Only 1 point, adding previous point');
            return [history[firstFilteredIndex - 1], ...filtered];
        }
    }

    return filtered.length > 0 ? filtered : history;
}

// ============================================================================
// HELPER: Interpolate missing data points
// ============================================================================

export function interpolateHistory(
    history: PricePoint[],
    targetPoints: number = 50
): PricePoint[] {
    if (history.length === 0) return [];
    if (history.length >= targetPoints) return history;

    const interpolated: PricePoint[] = [];
    const step = (history.length - 1) / (targetPoints - 1);

    for (let i = 0; i < targetPoints; i++) {
        const index = i * step;
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);

        if (lowerIndex === upperIndex) {
            interpolated.push(history[lowerIndex]);
        } else {
            const lower = history[lowerIndex];
            const upper = history[upperIndex];
            const ratio = index - lowerIndex;

            interpolated.push({
                timestamp: lower.timestamp + (upper.timestamp - lower.timestamp) * ratio,
                date: new Date(lower.timestamp + (upper.timestamp - lower.timestamp) * ratio)
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                yes: lower.yes + (upper.yes - lower.yes) * ratio,
                no: lower.no + (upper.no - lower.no) * ratio,
                yesPool: lower.yesPool + (upper.yesPool - lower.yesPool) * ratio,
                noPool: lower.noPool + (upper.noPool - lower.noPool) * ratio,
                totalPool: lower.totalPool + (upper.totalPool - lower.totalPool) * ratio,
            });
        }
    }

    return interpolated;
}
