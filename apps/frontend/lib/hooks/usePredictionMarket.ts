/**
 * usePredictionMarket Hook
 * 
 * Manages market data fetching with:
 * 1. Initial data fetch from API
 * 2. In-memory caching to prevent redundant requests
 * 3. Real-time pool updates via SSE
 * 4. Auto-refetch on interval
 * 5. Error handling and retry logic
 * 6. Automatic cleanup on unmount
 * 
 * Usage:
 * const { market, isLoading, error, refetch } = usePredictionMarket("btc-100k");
 * 
 * // market.yesPool, market.noPool, market.yesPercent, etc.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
	Market,
	PoolInfo,
	MarketTimeline,
	APIError,
} from "@/lib/types/prediction-market";
import {
	CACHE,
	BET_LIMITS,
	CURRENT_NETWORK,
} from "@/lib/config/constants";
import { getTxExplorerUrl } from "@/lib/blockchain/viem-client";

// ============================================================================
// TYPES
// ============================================================================

export interface MarketData {
	marketId: string;
	question: string;
	status: "ACTIVE" | "CLOSED" | "RESOLVED";
	winner?: string;
	yesPool: string; // Formatted USDT
	noPool: string;
	totalPool: string;
	yesPercent: number;
	noPercent: number;
	startDate: string; // ISO
	endDate: string;
	timeRemaining: number; // seconds
	daysRemaining: number;
	hoursRemaining: number;
	minutesRemaining: number;
	hasEnded: boolean;
	totalBets: number;
	stats?: {
		uniqueWallets: number;
		avgBetSize: string;
		largestBet: string;
		smallestBet: string;
	};
}

export interface UsePredictionMarketState {
	market: MarketData | null;
	isLoading: boolean;
	isFetching: boolean; // Refetching in background
	error: string | null;
	errorCode: string | null;
	lastUpdated: number | null;
}

export interface UsePredictionMarketActions {
	refetch: () => Promise<void>;
	reset: () => void;
}

export type UsePredictionMarketReturn = UsePredictionMarketState &
	UsePredictionMarketActions;

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry {
	data: MarketData;
	timestamp: number;
	ttl: number; // milliseconds
}

const marketCache = new Map<string, CacheEntry>();

function getCachedMarket(marketId: string): MarketData | null {
	const entry = marketCache.get(marketId);

	if (!entry) return null;

	if (Date.now() > entry.timestamp + entry.ttl) {
		marketCache.delete(marketId);
		return null;
	}

	return entry.data;
}

function setCachedMarket(marketId: string, data: MarketData) {
	marketCache.set(marketId, {
		data,
		timestamp: Date.now(),
		ttl: CACHE.MARKET_DATA_TTL * 1000, // TTL: 10 seconds
	});
}

function invalidateMarketCache(marketId: string) {
	marketCache.delete(marketId);
}

// ============================================================================
// LOGGER
// ============================================================================

interface LogContext {
	marketId?: string;
	source?: "api" | "cache" | "sse" | "poll";
	duration?: number;
	error?: string;
	errorCode?: string;
	cacheHit?: boolean;
}

function logInfo(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.log(
		`[${timestamp}] [usePredictionMarket] ${message}`,
		context
	);
}

function logError(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.error(
		`[${timestamp}] [usePredictionMarket] ❌ ${message}`,
		context
	);

	// TODO: Integrate with Sentry
	// if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
	//   Sentry.captureException(new Error(message), { extra: context });
	// }
}

// ============================================================================
// HOOK
// ============================================================================

export function usePredictionMarket(
	marketId: string,
	options?: {
		includeStats?: boolean;
		refetchInterval?: number; // milliseconds, default 30000
		autoConnect?: boolean; // Enable SSE updates, default true
	}
): UsePredictionMarketReturn {
	const refetchIntervalMs = options?.refetchInterval || 30000; // 30 seconds
	const includeStats = options?.includeStats || false;
	const autoConnect = options?.autoConnect !== false;

	// State
	const [state, setState] = useState<UsePredictionMarketState>({
		market: null,
		isLoading: true,
		isFetching: false,
		error: null,
		errorCode: null,
		lastUpdated: null,
	});

	// Refs for cleanup
	const abortRef = useRef<AbortController | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const eventSourceRef = useRef<EventSource | null>(null);
	const mountedRef = useRef(true);

	// ====== Helper: Set error ======
	const setError = useCallback((message: string, code?: string) => {
		setState((prev) => ({
			...prev,
			error: message,
			errorCode: code || null,
			isLoading: false,
			isFetching: false,
		}));
	}, []);

	// ====== Helper: Update market data ======
	const updateMarketData = useCallback((data: MarketData) => {
		if (!mountedRef.current) return;

		setCachedMarket(marketId, data);
		setState((prev) => ({
			...prev,
			market: data,
			lastUpdated: Date.now(),
			error: null,
			errorCode: null,
			isLoading: false,
			isFetching: false,
		}));
	}, [marketId]);

	// ====== Fetch market data from API ======
	const fetchMarket = useCallback(
		async (isFetching = false) => {
			try {
				const startTime = Date.now();

				if (!isFetching) {
					setState((prev) => ({
						...prev,
						isLoading: true,
					}));
				} else {
					setState((prev) => ({
						...prev,
						isFetching: true,
					}));
				}

				// Check cache first
				const cached = getCachedMarket(marketId);
				if (cached && !isFetching) {
					logInfo("Market loaded from cache", {
						marketId,
						cacheHit: true,
					});
					updateMarketData(cached);
					return;
				}

				logInfo("Fetching market data from API", {
					marketId,
					source: "api",
				});

				// Create abort controller
				abortRef.current = new AbortController();

				const params = new URLSearchParams();
				if (includeStats) {
					params.append("includeStats", "true");
				}

				const response = await fetch(
					`/api/markets/${marketId}?${params.toString()}`,
					{
						signal: abortRef.current.signal,
					}
				);

				if (!response.ok) {
					const errorData = (await response.json()) as APIError;
					setError(
						errorData.error || "Failed to fetch market",
						errorData.code || "API_ERROR"
					);
					return;
				}

				const data = await response.json();

				if (!data.success || !data.market) {
					setError("Invalid market data", "INVALID_DATA");
					return;
				}

				const duration = Date.now() - startTime;

				logInfo("Market data fetched successfully", {
					marketId,
					duration,
					source: "api",
				});

				updateMarketData(data.market);
			} catch (error) {
				if (error instanceof Error) {
					if (error.name === "AbortError") {
						logInfo("Market fetch aborted", { marketId });
						return;
					}

					logError("Error fetching market", {
						marketId,
						error: error.message,
					});
					setError(
						error.message || "Failed to fetch market",
						"FETCH_ERROR"
					);
				}
			}
		},
		[marketId, includeStats, updateMarketData, setError]
	);

	// ====== Connect to SSE for real-time updates ======
	const connectSSE = useCallback(() => {
		if (!autoConnect || !state.market) {
			return;
		}

		try {
			logInfo("Connecting to live market updates (SSE)", { marketId });

			const eventSource = new EventSource(
				`/api/markets/live-stats?marketId=${marketId}`
			);

			eventSourceRef.current = eventSource;

			// ====== Pool Update Event ======
			eventSource.addEventListener("POOL_UPDATE", (event: Event) => {
				if (!mountedRef.current) return;

				try {
					const data = JSON.parse(
						(event as MessageEvent).data
					);

					logInfo("Pool update received (SSE)", {
						marketId,
						source: "sse",
					});

					// Update only the pool-related fields
					setState((prev) => {
						if (!prev.market) return prev;

						return {
							...prev,
							market: {
								...prev.market,
								yesPool: data.yesPool,
								noPool: data.noPool,
								totalPool: data.totalPool,
								yesPercent: data.yesPercent,
								noPercent: data.noPercent,
								totalBets: data.totalBets,
							},
							lastUpdated: Date.now(),
						};
					});
				} catch (error) {
					logError("Error parsing pool update", {
						marketId,
						error: (error as Error).message,
					});
				}
			});

			// ====== Market Update Event ======
			eventSource.addEventListener(
				"MARKET_UPDATE",
				(event: Event) => {
					if (!mountedRef.current) return;

					try {
						const data = JSON.parse(
							(event as MessageEvent).data
						);

						logInfo("Market status update received (SSE)", {
							marketId,
							source: "sse",
						});

						setState((prev) => {
							if (!prev.market) return prev;

							return {
								...prev,
								market: {
									...prev.market,
									status: data.status,
									winner: data.winner,
									timeRemaining: data.timeRemaining,
									daysRemaining: Math.floor(
										data.timeRemaining / 86400
									),
									hoursRemaining: Math.floor(
										(data.timeRemaining % 86400) / 3600
									),
									minutesRemaining: Math.floor(
										(data.timeRemaining % 3600) / 60
									),
									hasEnded: data.hasEnded,
								},
								lastUpdated: Date.now(),
							};
						});

						// If market ended, invalidate cache for fresh state
						if (data.hasEnded) {
							invalidateMarketCache(marketId);
						}
					} catch (error) {
						logError("Error parsing market update", {
							marketId,
							error: (error as Error).message,
						});
					}
				}
			);

			// ====== Error Event ======
			eventSource.addEventListener("ERROR", (event: Event) => {
				const data = JSON.parse((event as MessageEvent).data);

				logError("SSE error received", {
					marketId,
					error: data.message,
					errorCode: data.code,
				});

				// Don't disconnect on error, SSE will auto-reconnect
			});

			// ====== Connection Error ======
			eventSource.onerror = () => {
				if (!mountedRef.current) return;

				logError("SSE connection error", { marketId });
				eventSourceRef.current?.close();
				eventSourceRef.current = null;

				// Attempt to reconnect after 5 seconds
				setTimeout(() => {
					if (mountedRef.current) {
						connectSSE();
					}
				}, 5000);
			};
		} catch (error) {
			logError("Error connecting to SSE", {
				marketId,
				error: (error as Error).message,
			});
		}
	}, [marketId, autoConnect, state.market]);

	// ====== Cleanup on unmount ======
	useEffect(() => {
		return () => {
			mountedRef.current = false;

			// Cleanup abort
			if (abortRef.current) {
				abortRef.current.abort();
			}

			// Cleanup interval
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}

			// Cleanup SSE
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}
		};
	}, []);

	// ====== Initial fetch + setup polling ======
	useEffect(() => {
		mountedRef.current = true;

		// Initial fetch
		fetchMarket(false);

		// Setup auto-refetch interval
		intervalRef.current = setInterval(() => {
			if (mountedRef.current) {
				fetchMarket(true);
			}
		}, refetchIntervalMs);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [marketId, fetchMarket, refetchIntervalMs]);

	// ====== Connect to SSE after initial fetch ======
	useEffect(() => {
		if (state.market && autoConnect) {
			connectSSE();
		}

		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}
		};
	}, [state.market, autoConnect, connectSSE]);

	// ====== Manual refetch ======
	const refetch = useCallback(async () => {
		invalidateMarketCache(marketId);
		await fetchMarket(false);
	}, [marketId, fetchMarket]);

	// ====== Reset state ======
	const reset = useCallback(() => {
		setState({
			market: null,
			isLoading: false,
			isFetching: false,
			error: null,
			errorCode: null,
			lastUpdated: null,
		});
		invalidateMarketCache(marketId);

		// Close SSE
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}
	}, [marketId]);

	return {
		// State
		market: state.market,
		isLoading: state.isLoading,
		isFetching: state.isFetching,
		error: state.error,
		errorCode: state.errorCode,
		lastUpdated: state.lastUpdated,

		// Actions
		refetch,
		reset,
	};
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Calculate remaining time and format for display
 */
export function useMarketTimer(market: MarketData | null) {
	const [timeDisplay, setTimeDisplay] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
		remaining: 0,
	});

	useEffect(() => {
		if (!market) return;

		const updateTime = () => {
			const remaining = market.timeRemaining - 1; // Decrement by 1 second
			const days = Math.floor(remaining / 86400);
			const hours = Math.floor((remaining % 86400) / 3600);
			const minutes = Math.floor((remaining % 3600) / 60);
			const seconds = remaining % 60;

			setTimeDisplay({
				days,
				hours,
				minutes,
				seconds,
				remaining,
			});
		};

		// Update immediately
		updateTime();

		// Update every second
		const interval = setInterval(updateTime, 1000);

		return () => clearInterval(interval);
	}, [market]);

	return timeDisplay;
}

/**
 * Format market data for display
 */
export function formatMarketDisplay(market: MarketData) {
	return {
		id: market.marketId,
		question: market.question,
		status: market.status,
		winner: market.winner,
		yesPool: `$${parseFloat(market.yesPool).toFixed(2)}`,
		noPool: `$${parseFloat(market.noPool).toFixed(2)}`,
		totalPool: `$${parseFloat(market.totalPool).toFixed(2)}`,
		yesPercent: `${market.yesPercent.toFixed(1)}%`,
		noPercent: `${market.noPercent.toFixed(1)}%`,
		endDate: new Date(market.endDate).toLocaleDateString(),
		endTime: new Date(market.endDate).toLocaleTimeString(),
		timeRemaining: `${market.daysRemaining}d ${market.hoursRemaining}h ${market.minutesRemaining}m`,
		totalBets: market.totalBets.toLocaleString(),
		avgBetSize: market.stats
			? `$${parseFloat(market.stats.avgBetSize).toFixed(2)}`
			: undefined,
		uniqueWallets: market.stats?.uniqueWallets.toLocaleString(),
	};
}

// ============================================================================
// MARKET STATUS HELPERS
// ============================================================================

export function isMarketActive(market: MarketData | null): boolean {
	return market?.status === "ACTIVE" && !market?.hasEnded;
}

export function isMarketClosed(market: MarketData | null): boolean {
	return market?.status === "CLOSED";
}

export function isMarketResolved(market: MarketData | null): boolean {
	return market?.status === "RESOLVED";
}

export function canBetOnMarket(market: MarketData | null): boolean {
	return isMarketActive(market);
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Clear all cached markets (for debugging)
 */
export function clearMarketCache() {
	marketCache.clear();
	logInfo("Market cache cleared", { marketId: "all" });
}

/**
 * Get cache stats (for debugging)
 */
export function getMarketCacheStats() {
	const entries = Array.from(marketCache.entries()).map(([id, entry]) => ({
		marketId: id,
		age: Date.now() - entry.timestamp,
		ttl: entry.ttl,
		expired: Date.now() > entry.timestamp + entry.ttl,
	}));

	return {
		totalCached: marketCache.size,
		entries,
	};
}
