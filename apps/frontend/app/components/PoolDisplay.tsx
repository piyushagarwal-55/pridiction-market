/**
 * PoolDisplay Component
 * 
 * Visual representation of market pools with:
 * 1. YES/NO pool split visualization
 * 2. Pool amounts in USDT
 * 3. Percentages with color coding
 * 4. Total pool and bet count
 * 5. Real-time updates from SSE
 * 6. Historical pool snapshots (optional)
 * 7. Odds calculation
 * 8. Responsive design
 * 
 * Usage:
 * <PoolDisplay market={market} includeStats={true} />
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { MarketData } from "@/lib/hooks/usePredictionMarket";
import { useSSE } from "@/lib/hooks/useSSE";
import { calculateBreakevenOdds } from "@/lib/hooks/useBetValidation";
import { BET_LIMITS } from "@/lib/config/constants";

// ============================================================================
// TYPES
// ============================================================================

export interface PoolDisplayProps {
	market: MarketData;
	includeStats?: boolean;
	showOdds?: boolean;
	showSnapshots?: boolean;
	className?: string;
	compact?: boolean; // Simplified display for sidebar
}

interface PoolSnapshot {
	timestamp: number;
	yesPool: number;
	noPool: number;
	yesPercent: number;
	noPercent: number;
	totalBets: number;
}

// ============================================================================
// LOGGER
// ============================================================================

function logInfo(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [PoolDisplay] ${message}`, context || "");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color for percentage (green for high, red for low)
 */
function getPoolColor(percent: number, isYes: boolean): string {
	if (percent > 60) {
		return isYes ? "text-green-700" : "text-red-700";
	}
	if (percent > 50) {
		return isYes ? "text-green-600" : "text-red-600";
	}
	if (percent >= 40) {
		return isYes ? "text-blue-600" : "text-blue-600";
	}
	if (percent > 25) {
		return isYes ? "text-red-600" : "text-green-600";
	}
	return isYes ? "text-red-700" : "text-green-700";
}

/**
 * Format USD amount
 */
function formatUSD(amount: number): string {
	if (amount >= 1000000) {
		return `$${(amount / 1000000).toFixed(1)}M`;
	}
	if (amount >= 1000) {
		return `$${(amount / 1000).toFixed(1)}K`;
	}
	return `$${amount.toFixed(0)}`;
}

/**
 * Get background gradient colors
 */
function getPoolGradient(yesPercent: number): string {
	const clamped = Math.max(0, Math.min(100, yesPercent));
	if (clamped > 70) {
		return "from-green-500 via-green-400 to-blue-400";
	}
	if (clamped > 50) {
		return "from-blue-500 to-blue-300";
	}
	if (clamped > 30) {
		return "from-blue-400 to-red-400";
	}
	return "from-blue-300 via-red-400 to-red-500";
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PoolDisplay: React.FC<PoolDisplayProps> = ({
	market,
	includeStats = false,
	showOdds = true,
	showSnapshots = false,
	className = "",
	compact = false,
}) => {
	const yesAmount = parseFloat(market.yesPool);
	const noAmount = parseFloat(market.noPool);
	const totalPool = parseFloat(market.totalPool);

	// SSE for real-time updates
	const sse = useSSE(
		`/api/markets/live-stats?marketId=${market.marketId}`,
		{ enableLogging: false }
	);

	// Local state for animations
	const [displayData, setDisplayData] = useState({
		yesPool: yesAmount,
		noPool: noAmount,
		yesPercent: market.yesPercent,
		noPercent: market.noPercent,
		totalBets: market.totalBets,
	});

	const [snapshots, setSnapshots] = useState<PoolSnapshot[]>([
		{
			timestamp: Date.now(),
			yesPool: yesAmount,
			noPool: noAmount,
			yesPercent: market.yesPercent,
			noPercent: market.noPercent,
			totalBets: market.totalBets,
		},
	]);

	const [showDetails, setShowDetails] = useState(false);

	// ====== Handle SSE pool updates ======
	useEffect(() => {
		const unsubscribe = sse.on("POOL_UPDATE", (data) => {
			logInfo("Pool update received", {
				yesPool: data.yesPool,
				noPool: data.noPool,
				totalBets: data.totalBets,
			});

			setDisplayData({
				yesPool: parseFloat(data.yesPool),
				noPool: parseFloat(data.noPool),
				yesPercent: data.yesPercent,
				noPercent: data.noPercent,
				totalBets: data.totalBets,
			});

			// Add to snapshots
			setSnapshots((prev) => [
				...prev,
				{
					timestamp: Date.now(),
					yesPool: parseFloat(data.yesPool),
					noPool: parseFloat(data.noPool),
					yesPercent: data.yesPercent,
					noPercent: data.noPercent,
					totalBets: data.totalBets,
				},
			].slice(-50)); // Keep last 50 snapshots
		});

		return unsubscribe;
	}, [sse]);

	// Calculate odds
	const odds = showOdds
		? calculateBreakevenOdds(displayData.yesPool, displayData.noPool, BET_LIMITS.HOUSE_FEE_PERCENT)
		: null;

	// ====== Compact View ======
	if (compact) {
		return (
			<div
				className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-3">
					<h3 className="font-semibold text-gray-900 text-sm">Pool</h3>
					<span className="text-xs text-gray-600">
						{formatUSD(totalPool)}
					</span>
				</div>

				{/* Progress Bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-green-700">YES</span>
						<span className="text-xs font-medium text-green-700">
							{displayData.yesPercent.toFixed(1)}%
						</span>
					</div>
					<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full bg-green-500 transition-all duration-500"
							style={{ width: `${displayData.yesPercent}%` }}
						/>
					</div>

					<div className="flex items-center justify-between mt-3">
						<span className="text-xs font-medium text-red-700">NO</span>
						<span className="text-xs font-medium text-red-700">
							{displayData.noPercent.toFixed(1)}%
						</span>
					</div>
					<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full bg-red-500 transition-all duration-500"
							style={{ width: `${displayData.noPercent}%` }}
						/>
					</div>
				</div>

				{/* Bets Count */}
				<div className="mt-3 pt-3 border-t border-gray-200">
					<p className="text-xs text-gray-600">
						{displayData.totalBets.toLocaleString()} bets
					</p>
				</div>
			</div>
		);
	}

	// ====== Full View ======
	return (
		<div
			className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${className}`}
		>
			{/* Header */}
			<div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h2 className="text-xl font-bold text-gray-900">Pool</h2>
						<p className="text-sm text-gray-600 mt-1">
							Total:{" "}
							<span className="font-semibold text-gray-900">
								{formatUSD(totalPool)}
							</span>
						</p>
					</div>
					<div className="text-right">
						<p className="text-sm text-gray-600">Total Bets</p>
						<p className="text-2xl font-bold text-gray-900">
							{displayData.totalBets.toLocaleString()}
						</p>
					</div>
				</div>

				{/* SSE Connection Status */}
				{sse.isConnected && (
					<div className="text-xs text-green-700 flex items-center gap-1">
						<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						Live updates
					</div>
				)}
			</div>

			{/* Pool Visualization */}
			<div className="p-6 space-y-6">
				{/* Large Progress Bar */}
				<div>
					<div className="flex justify-between items-center mb-3">
						<div>
							<p className="text-sm font-semibold text-gray-700">Yes</p>
							<p className={`text-2xl font-bold ${getPoolColor(displayData.yesPercent, true)}`}>
								{displayData.yesPercent.toFixed(1)}%
							</p>
							<p className="text-sm text-gray-600 mt-1">
								{formatUSD(displayData.yesPool)}
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm font-semibold text-gray-700">No</p>
							<p className={`text-2xl font-bold ${getPoolColor(displayData.noPercent, false)}`}>
								{displayData.noPercent.toFixed(1)}%
							</p>
							<p className="text-sm text-gray-600 mt-1">
								{formatUSD(displayData.noPool)}
							</p>
						</div>
					</div>

					{/* Visual Bar */}
					<div className="relative w-full h-12 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
						<div
							className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 flex items-center justify-center"
							style={{ width: `${displayData.yesPercent}%` }}
						>
							{displayData.yesPercent > 20 && (
								<span className="text-sm font-bold text-white">
									{displayData.yesPercent.toFixed(0)}%
								</span>
							)}
						</div>

						{/* No section overlay */}
						{displayData.noPercent > 0 && (
							<div
								className="absolute top-0 right-0 h-full bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center transition-all duration-500"
								style={{ width: `${displayData.noPercent}%` }}
							>
								{displayData.noPercent > 20 && (
									<span className="text-sm font-bold text-white">
										{displayData.noPercent.toFixed(0)}%
									</span>
								)}
							</div>
						)}
					</div>

					{/* Divider Line */}
					<div className="mt-2 flex items-center">
						<div className="flex-1 h-px bg-gray-200" />
						<div className="px-3 text-xs text-gray-600">
							Split: {displayData.yesPercent.toFixed(1)}% / {displayData.noPercent.toFixed(1)}%
						</div>
						<div className="flex-1 h-px bg-gray-200" />
					</div>
				</div>

				{/* Pool Details Grid */}
				<div className="grid grid-cols-2 gap-4">
					{/* Yes Pool Card */}
					<div className="p-4 rounded-lg bg-green-50 border border-green-200">
						<p className="text-sm font-medium text-green-900 mb-2">
							Yes Pool
						</p>
						<p className="text-2xl font-bold text-green-700">
							{formatUSD(displayData.yesPool)}
						</p>
						<p className="text-xs text-green-700 mt-2">
							{((displayData.yesPool / totalPool) * 100).toFixed(1)}% of total
						</p>

						{odds && (
							<p className="text-xs text-green-600 mt-2">
								Odds: {odds.yesOdds.toFixed(2)}x
							</p>
						)}
					</div>

					{/* No Pool Card */}
					<div className="p-4 rounded-lg bg-red-50 border border-red-200">
						<p className="text-sm font-medium text-red-900 mb-2">
							No Pool
						</p>
						<p className="text-2xl font-bold text-red-700">
							{formatUSD(displayData.noPool)}
						</p>
						<p className="text-xs text-red-700 mt-2">
							{((displayData.noPool / totalPool) * 100).toFixed(1)}% of total
						</p>

						{odds && (
							<p className="text-xs text-red-600 mt-2">
								Odds: {odds.noOdds.toFixed(2)}x
							</p>
						)}
					</div>
				</div>

				{/* Statistics */}
				{includeStats && market.stats && (
					<div className="pt-4 border-t border-gray-200 space-y-3">
						<h3 className="font-semibold text-gray-900 text-sm">
							Statistics
						</h3>

						<div className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p className="text-gray-600">Unique Wallets</p>
								<p className="text-lg font-semibold text-gray-900">
									{market.stats.uniqueWallets.toLocaleString()}
								</p>
							</div>

							<div>
								<p className="text-gray-600">Average Bet</p>
								<p className="text-lg font-semibold text-gray-900">
									${parseFloat(market.stats.avgBetSize).toFixed(0)}
								</p>
							</div>

							<div>
								<p className="text-gray-600">Largest Bet</p>
								<p className="text-lg font-semibold text-gray-900">
									${parseFloat(market.stats.largestBet).toFixed(0)}
								</p>
							</div>

							<div>
								<p className="text-gray-600">Smallest Bet</p>
								<p className="text-lg font-semibold text-gray-900">
									${parseFloat(market.stats.smallestBet).toFixed(0)}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Odds Breakdown */}
				{odds && (
					<div className="pt-4 border-t border-gray-200">
						<h3 className="font-semibold text-gray-900 text-sm mb-3">
							Breakeven Odds (after {BET_LIMITS.HOUSE_FEE_PERCENT}% fee)
						</h3>

						<div className="space-y-2 text-sm">
							<div className="flex justify-between p-3 rounded-lg bg-green-50">
								<span className="text-green-900 font-medium">
									If YES wins
								</span>
								<span className="text-green-700 font-bold">
									{odds.yesOdds.toFixed(2)}x your bet
								</span>
							</div>

							<div className="flex justify-between p-3 rounded-lg bg-red-50">
								<span className="text-red-900 font-medium">
									If NO wins
								</span>
								<span className="text-red-700 font-bold">
									{odds.noOdds.toFixed(2)}x your bet
								</span>
							</div>
						</div>

						<p className="text-xs text-gray-600 mt-3">
							These odds account for your share of the winning pool and
							the {BET_LIMITS.HOUSE_FEE_PERCENT}% house fee on winnings.
						</p>
					</div>
				)}

				{/* Pool History */}
				{showSnapshots && snapshots.length > 1 && (
					<div className="pt-4 border-t border-gray-200">
						<button
							onClick={() => setShowDetails(!showDetails)}
							className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2"
						>
							{showDetails ? "Hide" : "Show"} Pool History
							<span className="text-xs">{snapshots.length} snapshots</span>
						</button>

						{showDetails && (
							<div className="mt-3 space-y-2">
								{snapshots.slice(-10).reverse().map((snapshot, i) => {
									const timeAgo = Math.round(
										(Date.now() - snapshot.timestamp) / 1000
									);
									const timeStr = timeAgo < 60
										? `${timeAgo}s ago`
										: `${Math.floor(timeAgo / 60)}m ago`;

									return (
										<div
											key={i}
											className="p-2 rounded-lg bg-gray-50 text-xs space-y-1"
										>
											<div className="flex justify-between text-gray-600">
												<span>{timeStr}</span>
												<span>{snapshot.totalBets} bets</span>
											</div>
											<div className="flex justify-between font-semibold text-gray-900">
												<span>
													YES {snapshot.yesPercent.toFixed(1)}% |
													NO {snapshot.noPercent.toFixed(1)}%
												</span>
												<span>{formatUSD(snapshot.yesPool + snapshot.noPool)}</span>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Footer Info */}
			<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
				{sse.isConnected && (
					<p>
						🟢 Real-time updates enabled ({sse.totalMessagesReceived} messages)
					</p>
				)}
			</div>
		</div>
	);
};

export default PoolDisplay;
