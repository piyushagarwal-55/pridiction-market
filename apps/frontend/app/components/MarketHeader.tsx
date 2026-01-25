/**
 * MarketHeader Component
 * 
 * Market information header with:
 * 1. Market question/title
 * 2. Real-time countdown timer
 * 3. Market status (ACTIVE/CLOSED/RESOLVED)
 * 4. Winner display (if resolved)
 * 5. Start/end dates
 * 6. Status badges and colors
 * 7. Market metadata
 * 8. Responsive design
 * 
 * Usage:
 * <MarketHeader market={market} />
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MarketData, useMarketTimer } from "@/lib/hooks/usePredictionMarket";
import { useSSE } from "@/lib/hooks/useSSE";

// ============================================================================
// TYPES
// ============================================================================

export interface MarketHeaderProps {
	market: MarketData;
	className?: string;
	compact?: boolean; // Simplified header for embeds
	showTimeline?: boolean; // Show start/end dates
}

// ============================================================================
// LOGGER
// ============================================================================

function logInfo(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [MarketHeader] ${message}`, context || "");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status badge color
 */
function getStatusColor(
	status: string
): {
	bg: string;
	text: string;
	border: string;
	icon: string;
} {
	switch (status) {
		case "ACTIVE":
			return {
				bg: "bg-green-50",
				text: "text-green-700",
				border: "border-green-200",
				icon: "🟢",
			};
		case "CLOSED":
			return {
				bg: "bg-yellow-50",
				text: "text-yellow-700",
				border: "border-yellow-200",
				icon: "🟡",
			};
		case "RESOLVED":
			return {
				bg: "bg-blue-50",
				text: "text-blue-700",
				border: "border-blue-200",
				icon: "🔵",
			};
		default:
			return {
				bg: "bg-gray-50",
				text: "text-gray-700",
				border: "border-gray-200",
				icon: "⚪",
			};
	}
}

/**
 * Format date for display
 */
function formatDate(date: string): string {
	const d = new Date(date);
	const month = d.toLocaleString("en-US", { month: "short" });
	const day = d.getDate();
	const time = d.toLocaleString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
	return `${month} ${day}, ${time}`;
}

/**
 * Get time remaining text
 */
function getTimeRemainingText(
	days: number,
	hours: number,
	minutes: number,
	seconds: number
): string {
	if (days > 0) {
		return `${days}d ${hours}h remaining`;
	}
	if (hours > 0) {
		return `${hours}h ${minutes}m remaining`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds}s remaining`;
	}
	return `${seconds}s remaining`;
}

/**
 * Get progress percentage (0-100) based on time remaining
 */
function getProgressPercent(
	market: MarketData
): number {
	const startMs = new Date(market.startDate).getTime();
	const endMs = new Date(market.endDate).getTime();
	const nowMs = Date.now();

	const totalDuration = endMs - startMs;
	const elapsed = nowMs - startMs;

	if (elapsed <= 0) return 0;
	if (elapsed >= totalDuration) return 100;

	return (elapsed / totalDuration) * 100;
}

/**
 * Get progress bar color based on time remaining
 */
function getProgressColor(percent: number): string {
	if (percent < 50) return "bg-green-500";
	if (percent < 80) return "bg-yellow-500";
	return "bg-red-500";
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MarketHeader: React.FC<MarketHeaderProps> = ({
	market,
	className = "",
	compact = false,
	showTimeline = true,
}) => {
	const timer = useMarketTimer(market);

	// SSE for real-time status updates
	const sse = useSSE(
		`/api/markets/live-stats?marketId=${market.marketId}`,
		{ enableLogging: false }
	);

	// Local state for animated status changes
	const [displayStatus, setDisplayStatus] = useState(market.status);
	const [displayWinner, setDisplayWinner] = useState(market.winner);
	const [statusChanged, setStatusChanged] = useState(false);

	// ====== Handle SSE market updates ======
	useEffect(() => {
		const unsubscribe = sse.on("MARKET_UPDATE", (data) => {
			logInfo("Market status update received", {
				oldStatus: displayStatus,
				newStatus: data.status,
				winner: data.winner,
			});

			if (data.status !== displayStatus) {
				setDisplayStatus(data.status);
				setStatusChanged(true);

				// Clear animation after 3 seconds
				const timeout = setTimeout(() => {
					setStatusChanged(false);
				}, 3000);

				return () => clearTimeout(timeout);
			}

			if (data.winner && !displayWinner) {
				setDisplayWinner(data.winner);
			}
		});

		return unsubscribe;
	}, [sse, displayStatus, displayWinner]);

	const statusColor = getStatusColor(displayStatus);
	const progressPercent = getProgressPercent(market);
	const progressColor = getProgressColor(progressPercent);

	// ====== Compact View ======
	if (compact) {
		return (
			<div className={`${className}`}>
				{/* Question */}
				<h1 className="text-xl font-bold text-gray-900 mb-2">
					{market.question}
				</h1>

				{/* Status Badge + Timer */}
				<div className="flex items-center gap-3">
					<div
						className={`px-3 py-1 rounded-full border ${statusColor.bg} ${statusColor.border} text-xs font-semibold ${statusColor.text}`}
					>
						{statusColor.icon} {displayStatus}
					</div>

					<span className="text-sm text-gray-600">
						{!market.hasEnded
							? getTimeRemainingText(
								timer.days,
								timer.hours,
								timer.minutes,
								timer.seconds
							)
							: "Market Closed"}
					</span>
				</div>
			</div>
		);
	}

	// ====== Full View ======
	return (
		<div
			className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${className}`}
		>
			{/* Header Background */}
			<div className="relative bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-8 text-white overflow-hidden">
				{/* Animated background pattern */}
				<div className="absolute inset-0 opacity-10">
					<div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -mr-48 -mt-48" />
				</div>

				<div className="relative z-10">
					{/* Title */}
					<h1 className="text-3xl font-bold mb-4 leading-tight">
						{market.question}
					</h1>

					{/* Quick Stats Row */}
					<div className="flex gap-8 text-sm">
						<div>
							<p className="text-blue-100">Market ID</p>
							<p className="font-mono text-white">
								{market.marketId.slice(0, 12)}...
							</p>
						</div>
						<div>
							<p className="text-blue-100">Status</p>
							<p className="font-semibold text-white">
								{displayStatus}
							</p>
						</div>
						<div>
							<p className="text-blue-100">Total Bets</p>
							<p className="font-semibold text-white">
								{market.totalBets.toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Status & Timer Section */}
			<div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
				<div className="space-y-4">
					{/* Status Badge */}
					<div
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusColor.bg} ${statusColor.border} ${
							statusChanged ? "animate-pulse" : ""
						}`}
					>
						<span className="text-xl">{statusColor.icon}</span>
						<span className={`font-semibold ${statusColor.text}`}>
							{displayStatus}
						</span>

						{displayStatus === "RESOLVED" && displayWinner && (
							<span className="ml-2 px-2 py-1 rounded-md bg-white">
								<span className={displayWinner === "YES"
									? "text-green-700"
									: "text-red-700"
								}>
									Winner: {displayWinner}
								</span>
							</span>
						)}
					</div>

					{/* Timer */}
					{!market.hasEnded ? (
						<div className="space-y-3">
							<p className="text-sm text-gray-600 font-medium">
								Time Remaining
							</p>

							<div className="flex items-center gap-4">
								{/* Countdown Display */}
								<div className="flex gap-4 text-center">
									{timer.days > 0 && (
										<div>
											<p className="text-3xl font-bold text-gray-900">
												{timer.days}
											</p>
											<p className="text-xs text-gray-600 mt-1">
												Days
											</p>
										</div>
									)}

									<div>
										<p className="text-3xl font-bold text-gray-900">
											{timer.hours}
										</p>
										<p className="text-xs text-gray-600 mt-1">
											Hours
										</p>
									</div>

									<div>
										<p className="text-3xl font-bold text-gray-900">
											{timer.minutes}
										</p>
										<p className="text-xs text-gray-600 mt-1">
											Minutes
										</p>
									</div>

									<div>
										<p className="text-3xl font-bold text-gray-900">
											{timer.seconds}
										</p>
										<p className="text-xs text-gray-600 mt-1">
											Seconds
										</p>
									</div>
								</div>

								{/* Status Text */}
								<div className="text-sm text-gray-600">
									{getTimeRemainingText(
										timer.days,
										timer.hours,
										timer.minutes,
										timer.seconds
									)}
								</div>
							</div>

							{/* Progress Bar */}
							<div className="mt-4 space-y-2">
								<div className="flex justify-between text-xs text-gray-600">
									<span>Market Progress</span>
									<span>
										{progressPercent.toFixed(0)}%
									</span>
								</div>
								<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className={`h-full ${progressColor} transition-all duration-500`}
										style={{ width: `${progressPercent}%` }}
									/>
								</div>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							<div className="p-4 rounded-lg bg-gray-100 border border-gray-300">
								<p className="text-sm font-semibold text-gray-900">
									{displayStatus === "RESOLVED"
										? "✓ Market Resolved"
										: "Market Closed"}
								</p>
								<p className="text-sm text-gray-600 mt-1">
									{displayStatus === "RESOLVED"
										? displayWinner
											? `Winner: ${displayWinner}`
											: "Awaiting resolution"
										: "No longer accepting bets"}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Timeline Section */}
			{showTimeline && (
				<div className="px-6 py-6 border-b border-gray-200">
					<h3 className="font-semibold text-gray-900 mb-4">
						Market Timeline
					</h3>

					<div className="space-y-4">
						{/* Start */}
						<div className="flex gap-4">
							<div className="flex flex-col items-center">
								<div className="w-3 h-3 rounded-full bg-blue-500" />
								<div className="w-1 h-12 bg-gray-200 mt-2" />
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-900">
									Betting Started
								</p>
								<p className="text-sm text-gray-600">
									{formatDate(market.startDate)}
								</p>
							</div>
						</div>

						{/* Current Position */}
						{!market.hasEnded && (
							<div className="flex gap-4">
								<div className="flex flex-col items-center">
									<div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
									<div className="w-1 h-12 bg-gray-200 mt-2" />
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-900">
										Now
									</p>
									<p className="text-sm text-gray-600">
										Betting in progress
									</p>
								</div>
							</div>
						)}

						{/* End */}
						<div className="flex gap-4">
							<div className="flex flex-col items-center">
								<div
									className={`w-3 h-3 rounded-full ${
										market.hasEnded
											? "bg-red-500"
											: "bg-gray-300"
									}`}
								/>
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-900">
									{market.hasEnded
										? "Betting Ended"
										: "Betting Ends"}
								</p>
								<p className="text-sm text-gray-600">
									{formatDate(market.endDate)}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Market Category */}
			<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
				<div>
					<p className="text-xs text-gray-600">Category</p>
					<p className="text-sm font-semibold text-gray-900">
						{market.marketId.split("-")[0].toUpperCase()}
					</p>
				</div>

				{/* Live Indicator */}
				{sse.isConnected && (
					<div className="flex items-center gap-2 text-xs text-green-700">
						<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						Live updates
					</div>
				)}

				{/* Source Badge */}
				<div className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600">
					Cronos
				</div>
			</div>
		</div>
	);
};

export default MarketHeader;
