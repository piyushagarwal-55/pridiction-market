/**
 * UserBetsList Component
 * 
 * Display user's betting history with:
 * 1. Paginated bet list
 * 2. Bet status (PENDING/CONFIRMED/FLAGGED/CLAWED_BACK)
 * 3. Bet amounts and choices
 * 4. Creation timestamps
 * 5. Transaction hashes (clickable to explorer)
 * 6. Sort and filter options
 * 7. Empty state handling
 * 8. Real-time status updates
 * 9. Responsive design
 * 
 * Usage:
 * <UserBetsList marketId="btc-100k" walletAddress={address} />
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	BetStatus,
	APIError,
} from "@/lib/types/prediction-market";
import { BET_LIMITS } from "@/lib/config/constants";
import { getTxExplorerUrl } from "@/lib/blockchain/viem-client";

// ============================================================================
// TYPES
// ============================================================================

export interface UserBetsListProps {
	marketId: string;
	walletAddress?: string;
	pageSize?: number; // Default 20
	className?: string;
	showFilters?: boolean; // Show sort/filter options
	compact?: boolean; // Simplified list for sidebar
	onBetClick?: (bet: BetWithDisplay) => void;
}

// API response format (JSON serialized)
interface ApiBet {
	id: string;
	choice: string;
	amount: string; // Formatted string from API
	betNumber: number;
	status: string;
	txHash: string | null;
	createdAt: string; // ISO string from API
}

interface BetWithDisplay extends ApiBet {
	displayAmount: string; // Formatted USDT
	displayDate: string; // Relative time (e.g., "2 hours ago")
	displayStatus: {
		label: string;
		color: string;
		icon: string;
	};
	isWinning?: boolean; // If market resolved
	payoutAmount?: string; // If won
}

interface PaginationData {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

interface BetsListState {
	bets: BetWithDisplay[];
	pagination: PaginationData;
	sortBy: "recent" | "amount" | "status";
	filterStatus: "all" | BetStatus;
}

// ============================================================================
// LOGGER
// ============================================================================

function logInfo(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [UserBetsList] ${message}`, context || "");
}

function logError(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] [UserBetsList] ❌ ${message}`, context || "");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status badge info
 */
function getStatusBadge(
	status: BetStatus
): { label: string; color: string; icon: string } {
	switch (status) {
		case "CONFIRMED":
			return {
				label: "Confirmed",
				color: "bg-green-100 text-green-800 border-green-300",
				icon: "✓",
			};
		case "PENDING":
			return {
				label: "Pending",
				color: "bg-blue-100 text-blue-800 border-blue-300",
				icon: "⟳",
			};
		case "FLAGGED":
			return {
				label: "Flagged",
				color: "bg-yellow-100 text-yellow-800 border-yellow-300",
				icon: "⚠",
			};
		case "CLAWED_BACK":
			return {
				label: "Clawed Back",
				color: "bg-red-100 text-red-800 border-red-300",
				icon: "✗",
			};
		default:
			return {
				label: status,
				color: "bg-gray-100 text-gray-800 border-gray-300",
				icon: "•",
			};
	}
}

/**
 * Format bet amount to USDT
 */
function formatAmount(weiAmount: bigint): string {
	const divisor = BigInt(10 ** BET_LIMITS.USDT_DECIMALS);
	const amount = Number(weiAmount) / Number(divisor);
	return amount.toFixed(2);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (seconds < 60) return "just now";
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
	if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

	return date.toLocaleDateString();
}

/**
 * Truncate transaction hash for display
 */
function truncateTxHash(hash: string, length = 8): string {
	if (!hash || hash.length < length) return hash;
	return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

/**
 * Transform API bet to display format
 */
function transformBet(bet: ApiBet): BetWithDisplay {
	// API already formats amount as string with 2 decimals
	const displayAmount = `$${bet.amount}`;
	const displayDate = formatRelativeTime(bet.createdAt);
	const displayStatus = getStatusBadge(bet.status as BetStatus);

	return {
		...bet,
		displayAmount,
		displayDate,
		displayStatus,
	};
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UserBetsList: React.FC<UserBetsListProps> = ({
	marketId,
	walletAddress,
	pageSize = 20,
	className = "",
	showFilters = true,
	compact = false,
	onBetClick,
}) => {
	// State
	const [page, setPage] = useState(1);
	const [sortBy, setSortBy] = useState<"recent" | "amount" | "status">(
		"recent"
	);
	const [filterStatus, setFilterStatus] = useState<"all" | BetStatus>("all");

	// ====== Fetch user bets ======
	const {
		data: response,
		isLoading,
		error,
		refetch,
		isFetching,
	} = useQuery({
		queryKey: ["userBets", marketId, walletAddress, page, pageSize],
		queryFn: async () => {
			if (!walletAddress) {
				return null;
			}

			logInfo("Fetching user bets", {
				marketId,
				walletAddress: walletAddress.slice(0, 8),
				page,
				pageSize,
			});

			const params = new URLSearchParams({
				marketId,
				page: page.toString(),
				limit: pageSize.toString(),
			});

			const res = await fetch(
				`/api/bets/get-user-bets?${params.toString()}`,
				{
					headers: {
						"X-Wallet-Address": walletAddress,
					},
				}
			);

			if (!res.ok) {
				const errorData = (await res.json()) as APIError;
				throw new Error(
					errorData.error || "Failed to fetch bets"
				);
			}

			const data = await res.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to fetch bets");
			}

			logInfo("User bets fetched successfully", {
				count: data.bets?.length || 0,
				total: data.pagination?.total || 0,
			});

			return data;
		},
		enabled: !!walletAddress,
		staleTime: 10000, // 10 seconds
		gcTime: 5 * 60 * 1000, // 5 minutes
	});

	// Transform and filter bets
	const bets = response?.bets
		?.map((bet: ApiBet) => transformBet(bet))
		?.filter(
			(bet: BetWithDisplay) =>
				filterStatus === "all" || bet.status === filterStatus
		)
		?.sort((a: BetWithDisplay, b: BetWithDisplay) => {
			switch (sortBy) {
				case "amount":
					return Number(b.amount) - Number(a.amount);
				case "status":
					return a.status.localeCompare(b.status);
				case "recent":
				default:
					return (
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime()
					);
			}
		}) || [];

	const pagination = response?.pagination || {
		page: 1,
		limit: pageSize,
		total: 0,
		pages: 0,
	};

	// ====== Handlers ======

	const handlePageChange = useCallback(
		(newPage: number) => {
			setPage(Math.max(1, Math.min(newPage, pagination.pages)));
			window.scrollTo({ top: 0, behavior: "smooth" });
			logInfo("Page changed", { newPage });
		},
		[pagination.pages]
	);

	const handleSortChange = useCallback(
		(newSort: typeof sortBy) => {
			setSortBy(newSort);
			logInfo("Sort changed", { sortBy: newSort });
		},
		[]
	);

	const handleFilterChange = useCallback(
		(newFilter: typeof filterStatus) => {
			setFilterStatus(newFilter);
			setPage(1);
			logInfo("Filter changed", { filterStatus: newFilter });
		},
		[]
	);

	// ====== Compact View ======
	if (compact) {
		if (!walletAddress) {
			return (
				<div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}>
					<p className="text-sm text-gray-600">
						Connect wallet to see your bets
					</p>
				</div>
			);
		}

		if (isLoading) {
			return (
				<div className={`space-y-2 ${className}`}>
					{Array(3)
						.fill(0)
						.map((_, i) => (
							<div
								key={i}
								className="h-12 bg-gray-200 rounded-lg animate-pulse"
							/>
						))}
				</div>
			);
		}

		if (error || !response) {
			return (
				<div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
					<p className="text-sm text-red-700">
						{error?.message || "Failed to load bets"}
					</p>
				</div>
			);
		}

		if (bets.length === 0) {
			return (
				<div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}>
					<p className="text-sm text-gray-600">
						No bets yet. Place your first bet!
					</p>
				</div>
			);
		}

		return (
			<div className={`space-y-2 ${className}`}>
				{bets.slice(0, 5).map((bet: BetWithDisplay) => (
					<button
						key={bet.id}
						onClick={() => onBetClick?.(bet)}
						className="w-full p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-left transition-colors"
					>
						<div className="flex justify-between items-center mb-1">
							<span className="text-sm font-semibold text-gray-900">
								${bet.displayAmount}
							</span>
							<span
								className={`text-xs px-2 py-0.5 rounded border ${bet.displayStatus.color}`}
							>
								{bet.displayStatus.icon}{" "}
								{bet.displayStatus.label}
							</span>
						</div>
						<p className="text-xs text-gray-600">
							{bet.choice} • {bet.displayDate}
						</p>
					</button>
				))}
			</div>
		);
	}

	// ====== Full View ======
	if (!walletAddress) {
		return (
			<div className={`rounded-lg border border-gray-200 bg-white p-8 text-center ${className}`}>
				<p className="text-lg text-gray-900 font-semibold mb-2">
					Betting History
				</p>
				<p className="text-gray-600">
					Connect your wallet to view your bets
				</p>
			</div>
		);
	}

	return (
		<div className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${className}`}>
			{/* Header */}
			<div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-bold text-gray-900">
						Your Bets
					</h2>
					<button
						onClick={() => refetch()}
						disabled={isFetching}
						className="text-sm px-3 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
					>
						{isFetching ? "⟳ Refreshing..." : "Refresh"}
					</button>
				</div>

				{/* Filters & Sorting */}
				{showFilters && bets.length > 0 && (
					<div className="flex gap-3 flex-wrap">
						{/* Sort */}
						<div className="flex gap-2 text-xs">
							<span className="text-gray-600 font-medium">
								Sort:
							</span>
							<button
								onClick={() => handleSortChange("recent")}
								className={`px-3 py-1 rounded-full border ${
									sortBy === "recent"
										? "bg-blue-100 border-blue-300 text-blue-700"
										: "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
								}`}
							>
								Recent
							</button>
							<button
								onClick={() => handleSortChange("amount")}
								className={`px-3 py-1 rounded-full border ${
									sortBy === "amount"
										? "bg-blue-100 border-blue-300 text-blue-700"
										: "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
								}`}
							>
								Amount
							</button>
							<button
								onClick={() => handleSortChange("status")}
								className={`px-3 py-1 rounded-full border ${
									sortBy === "status"
										? "bg-blue-100 border-blue-300 text-blue-700"
										: "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
								}`}
							>
								Status
							</button>
						</div>

						{/* Filter */}
						<div className="flex gap-2 text-xs">
							<span className="text-gray-600 font-medium">
								Filter:
							</span>
							<button
								onClick={() => handleFilterChange("all")}
								className={`px-3 py-1 rounded-full border ${
									filterStatus === "all"
										? "bg-green-100 border-green-300 text-green-700"
										: "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
								}`}
							>
								All
							</button>
							<button
								onClick={() => handleFilterChange(BetStatus.CONFIRMED)}
								className={`px-3 py-1 rounded-full border ${
									filterStatus === BetStatus.CONFIRMED
										? "bg-green-100 border-green-300 text-green-700"
										: "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
								}`}
							>
								Confirmed
							</button>
							<button
								onClick={() => handleFilterChange(BetStatus.PENDING)}
								className={`px-3 py-1 rounded-full border ${
									filterStatus === BetStatus.PENDING
										? "bg-blue-100 border-blue-300 text-blue-700"
										: "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
								}`}
							>
								Pending
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="p-6 space-y-4">
					{Array(5)
						.fill(0)
						.map((_, i) => (
							<div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
						))}
				</div>
			)}

			{/* Error State */}
			{error && !isLoading && (
				<div className="p-6">
					<div className="rounded-lg border border-red-200 bg-red-50 p-4">
						<p className="text-red-700 font-semibold mb-2">
							Error Loading Bets
						</p>
						<p className="text-red-600 text-sm mb-4">
							{error.message}
						</p>
						<button
							onClick={() => refetch()}
							className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
						>
							Try Again
						</button>
					</div>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && !error && bets.length === 0 && (
				<div className="p-8 text-center">
					<p className="text-2xl mb-2">📊</p>
					<p className="text-gray-900 font-semibold mb-1">
						No bets found
					</p>
					<p className="text-gray-600 text-sm">
						{filterStatus !== "all"
							? `No ${filterStatus.toLowerCase()} bets yet`
							: "You haven't placed any bets on this market yet"}
					</p>
				</div>
			)}

			{/* Bets Table */}
			{!isLoading && !error && bets.length > 0 && (
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
									Bet #
								</th>
								<th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
									Choice
								</th>
								<th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
									Amount
								</th>
								<th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
									Time
								</th>
								<th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
									Tx Hash
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{bets.map((bet: BetWithDisplay) => (
								<tr
									key={bet.id}
									onClick={() => onBetClick?.(bet)}
									className="hover:bg-gray-50 transition-colors cursor-pointer"
								>
									{/* Bet Number */}
									<td className="px-6 py-4">
										<span className="text-sm font-semibold text-gray-900">
											#{bet.betNumber}
										</span>
									</td>

									{/* Choice */}
									<td className="px-6 py-4">
										<span
											className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
												bet.choice === "YES"
													? "bg-green-100 text-green-700"
													: "bg-red-100 text-red-700"
											}`}
										>
											{bet.choice === "YES" ? "✓" : "✗"}{" "}
											{bet.choice}
										</span>
									</td>

									{/* Amount */}
									<td className="px-6 py-4">
										<span className="text-sm font-semibold text-gray-900">
											${bet.displayAmount}
										</span>
									</td>

									{/* Status */}
									<td className="px-6 py-4">
										<span
											className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${bet.displayStatus.color}`}
										>
											{bet.displayStatus.icon}{" "}
											{bet.displayStatus.label}
										</span>
									</td>

									{/* Time */}
									<td className="px-6 py-4">
										<span className="text-sm text-gray-600">
											{bet.displayDate}
										</span>
									</td>

									{/* Tx Hash */}
									<td className="px-6 py-4">
										{bet.txHash ? (
											<a
												href={getTxExplorerUrl(
													bet.txHash
												)}
												target="_blank"
												rel="noopener noreferrer"
												onClick={(e) =>
													e.stopPropagation()
												}
												className="text-sm text-blue-600 hover:text-blue-700 font-mono underline"
											>
												{truncateTxHash(bet.txHash)}
											</a>
										) : (
											<span className="text-sm text-gray-400">—</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{!isLoading && !error && bets.length > 0 && pagination.pages > 1 && (
				<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
					<p className="text-sm text-gray-600">
						Page {pagination.page} of {pagination.pages} • Total:{" "}
						{pagination.total} bets
					</p>

					<div className="flex gap-2">
						<button
							onClick={() =>
								handlePageChange(pagination.page - 1)
							}
							disabled={pagination.page === 1}
							className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
						>
							← Previous
						</button>

						<div className="flex items-center gap-2">
							{Array.from(
								{ length: pagination.pages },
								(_, i) => i + 1
							)
								.filter(
									(p) =>
										p === 1 ||
										p === pagination.pages ||
										Math.abs(p - pagination.page) <= 1
								)
								.map((p, i, arr) => (
									<React.Fragment key={p}>
										{i > 0 && arr[i - 1] !== p - 1 && (
											<span className="text-gray-400">
												...
											</span>
										)}
										<button
											onClick={() =>
												handlePageChange(p)
											}
											className={`px-3 py-1 rounded border text-sm font-medium ${
												p === pagination.page
													? "bg-blue-600 text-white border-blue-600"
													: "border-gray-300 text-gray-700 hover:bg-gray-100"
											}`}
										>
											{p}
										</button>
									</React.Fragment>
								))}
						</div>

						<button
							onClick={() =>
								handlePageChange(pagination.page + 1)
							}
							disabled={
								pagination.page === pagination.pages
							}
							className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next →
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default UserBetsList;
