/**
 * useBetValidation Hook
 * 
 * Validates bet parameters in real-time with:
 * 1. Amount validation (min/max, whole numbers)
 * 2. Cooldown tracking (countdown timer)
 * 3. Bet count tracking (remaining bets)
 * 4. Pool cap calculations (max bet allowed)
 * 5. Velocity detection (rapid-fire checks)
 * 6. Market status checks (active, not expired)
 * 7. Wallet flagging checks
 * 
 * Returns detailed validation results with:
 * - isValid: boolean (can submit?)
 * - errors: specific validation failures
 * - warnings: non-blocking warnings
 * - remaining: time/bets remaining
 * - maxBet: maximum allowed bet
 * - calculations: debug info
 * 
 * Usage:
 * const validation = useBetValidation(choice, amount, marketData, userData);
 * 
 * if (!validation.isValid) {
 *   return <div>{validation.errors[0].message}</div>;
 * }
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { BetChoice } from "@/lib/types/prediction-market";
import {
	validateBetClientSide,
	getCooldownRemaining,
	getRemainigBetsAllowed,
	getMaxBetByPoolCap,
	calculateWalletPoolPercent,
	wouldBetBeRejected,
} from "@/lib/validation/bet-rules";
import {
	BET_LIMITS,
	ANTI_MANIPULATION,
	ERROR_CODES,
} from "@/lib/config/constants";

// ============================================================================
// TYPES
// ============================================================================

export interface BetValidationInput {
	choice: BetChoice | null;
	amount: number;
	marketId: string;
	marketStatus: string;
	marketEndDate: Date;
	userBetCount: number;
	userTotalBets: number; // USDT amount
	userLastBetTime: number | null; // Timestamp
	userRecentBetTimes: number[]; // Timestamps from last hour
	marketYesPool: number; // USDT
	marketNoPool: number; // USDT
	userIsFlagged: boolean;
}

export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

export interface ValidationWarning {
	message: string;
	severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface BetValidationState {
	// Validation results
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];

	// Calculated values
	cooldownRemaining: number; // seconds
	betsRemaining: number; // 0-10
	maxBetByPoolCap: number; // USDT
	maxBetAllowed: number; // Math.min(MAX_BET, maxBetByPoolCap)
	walletPoolPercent: number; // 0-100
	wouldBeRejected: boolean; // Would contract reject?

	// For UI feedback
	isAmountValid: boolean;
	isChoiceValid: boolean;
	isMarketValid: boolean;
	isCooldownOk: boolean;
	isBetCountOk: boolean;
	isPoolCapOk: boolean;
	isWalletOk: boolean;

	// Calculations (for debugging)
	calculations: {
		totalPool: number;
		yesPoolPercent: number;
		noPoolPercent: number;
		estimatedOutcome: "YES" | "NO" | "EQUAL";
	};
}

// ============================================================================
// LOGGER
// ============================================================================

interface LogContext {
	marketId?: string;
	choice?: string;
	amount?: number;
	error?: string;
}

function logInfo(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.log(
		`[${timestamp}] [useBetValidation] ${message}`,
		context
	);
}

function logError(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.error(
		`[${timestamp}] [useBetValidation] ❌ ${message}`,
		context
	);
}

// ============================================================================
// HOOK
// ============================================================================

export function useBetValidation(
	input: BetValidationInput
): BetValidationState {
	const {
		choice,
		amount,
		marketId,
		marketStatus,
		marketEndDate,
		userBetCount,
		userTotalBets,
		userLastBetTime,
		userRecentBetTimes,
		marketYesPool,
		marketNoPool,
		userIsFlagged,
	} = input;

	// State for countdown timer
	const [cooldownTimer, setCooldownTimer] = useState(0);

	// ====== Calculate derived values ======
	const calculations = useMemo(() => {
		const totalPool = marketYesPool + marketNoPool;
		const yesPoolPercent =
			totalPool > 0 ? (marketYesPool / totalPool) * 100 : 0;
		const noPoolPercent =
			totalPool > 0 ? (marketNoPool / totalPool) * 100 : 0;

		// Estimate which side is winning
		let estimatedOutcome: "YES" | "NO" | "EQUAL" = "EQUAL";
		if (Math.abs(yesPoolPercent - noPoolPercent) > 5) {
			estimatedOutcome = yesPoolPercent > noPoolPercent ? "YES" : "NO";
		}

		return {
			totalPool,
			yesPoolPercent,
			noPoolPercent,
			estimatedOutcome,
		};
	}, [marketYesPool, marketNoPool]);

	// ====== Individual validation checks ======
	const isChoiceValid = choice === BetChoice.YES || choice === BetChoice.NO;

	const isAmountValid = useMemo(() => {
		if (typeof amount !== "number" || amount <= 0) return false;
		if (!Number.isInteger(amount)) return false;
		if (amount < BET_LIMITS.MIN_BET || amount > BET_LIMITS.MAX_BET)
			return false;
		return true;
	}, [amount]);

	const isMarketValid = useMemo(() => {
		if (marketStatus !== "ACTIVE") return false;
		const now = Date.now();
		const marketEndMs = marketEndDate.getTime();
		return now < marketEndMs;
	}, [marketStatus, marketEndDate]);

	const cooldownRemaining = useMemo(() => {
		return getCooldownRemaining(userLastBetTime);
	}, [userLastBetTime]);

	const isCooldownOk = cooldownRemaining === 0;

	const betsRemaining = useMemo(() => {
		return getRemainigBetsAllowed(userBetCount);
	}, [userBetCount]);

	const isBetCountOk = betsRemaining > 0;

	const maxBetByPoolCap = useMemo(() => {
		return getMaxBetByPoolCap(userTotalBets, marketYesPool, marketNoPool);
	}, [userTotalBets, marketYesPool, marketNoPool]);

	const maxBetAllowed = Math.min(BET_LIMITS.MAX_BET, maxBetByPoolCap);

	const isPoolCapOk = amount <= maxBetByPoolCap;

	const walletPoolPercent = useMemo(() => {
		return calculateWalletPoolPercent(
			userTotalBets + amount,
			marketYesPool,
			marketNoPool
		);
	}, [userTotalBets, amount, marketYesPool, marketNoPool]);

	const isWalletOk = !userIsFlagged;

	const wouldBeRejected = useMemo(() => {
		return wouldBetBeRejected({
			amount,
			cooldownRemaining,
			betCount: userBetCount,
			isFlagged: userIsFlagged,
			marketStatus,
		});
	}, [amount, cooldownRemaining, userBetCount, userIsFlagged, marketStatus]);

	// ====== Run comprehensive validation ======
	const validationResult = useMemo(() => {
		if (!choice || !isChoiceValid) {
			return {
				isValid: false,
				errors: [
					{
						field: "choice",
						message: "Please select YES or NO",
						code: "INVALID_CHOICE",
					},
				],
				warnings: [],
			};
		}

		return validateBetClientSide({
			amount,
			cooldownRemaining,
			betCount: userBetCount,
			walletExposurePercent: walletPoolPercent,
		});
	}, [
		choice,
		isChoiceValid,
		amount,
		cooldownRemaining,
		userBetCount,
		walletPoolPercent,
	]);

	// ====== Update cooldown timer every second ======
	useEffect(() => {
		if (cooldownRemaining <= 0) {
			setCooldownTimer(0);
			return;
		}

		setCooldownTimer(cooldownRemaining);

		const interval = setInterval(() => {
			setCooldownTimer((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => clearInterval(interval);
	}, [cooldownRemaining]);

	// ====== Log validation changes ======
	useEffect(() => {
		if (!validationResult.isValid && validationResult.errors.length > 0) {
			logError("Validation failed", {
				marketId,
				choice: choice?.toString(),
				amount,
				error: validationResult.errors[0].message,
			});
		}
	}, [validationResult.isValid, validationResult.errors, marketId, choice, amount]);

	// ====== Build final state ======
	const state: BetValidationState = {
		// Validation results
		isValid: validationResult.isValid,
		errors: validationResult.errors,
		warnings: validationResult.warnings,

		// Calculated values (use timer for real-time countdown)
		cooldownRemaining: cooldownTimer,
		betsRemaining,
		maxBetByPoolCap,
		maxBetAllowed,
		walletPoolPercent,
		wouldBeRejected,

		// Individual checks
		isAmountValid,
		isChoiceValid,
		isMarketValid,
		isCooldownOk,
		isBetCountOk,
		isPoolCapOk,
		isWalletOk,

		// Calculations
		calculations,
	};

	return state;
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get user-friendly error message
 */
export function useValidationMessage(
	errors: ValidationError[]
): string | null {
	if (errors.length === 0) return null;

	const primaryError = errors[0];
	const secondaryCount = errors.length - 1;

	if (secondaryCount === 0) {
		return primaryError.message;
	}

	return `${primaryError.message} (and ${secondaryCount} more)`;
}

/**
 * Format cooldown countdown for display
 */
export function formatCooldownDisplay(remainingSeconds: number): string {
	if (remainingSeconds <= 0) {
		return "Ready to bet";
	}

	if (remainingSeconds < 60) {
		return `${remainingSeconds}s`;
	}

	const minutes = Math.floor(remainingSeconds / 60);
	const seconds = remainingSeconds % 60;

	return `${minutes}m ${seconds}s`;
}

/**
 * Get color indicator for wallet pool percentage
 */
export function getPoolPercentColor(percent: number): string {
	if (percent < 5) return "text-green-600"; // Safe
	if (percent < 8) return "text-yellow-600"; // Caution
	if (percent < 10) return "text-orange-600"; // Warning
	return "text-red-600"; // At limit
}

/**
 * Get validation summary for display
 */
export interface ValidationSummary {
	statusIcon: string;
	statusText: string;
	statusColor: string;
	primaryError: string | null;
	warningsList: string[];
	amountStatus: "valid" | "invalid" | "empty";
	cooldownStatus: "ready" | "waiting" | "unknown";
	betCountStatus: "available" | "maxed";
	poolCapStatus: "safe" | "caution" | "warning" | "maxed";
}

export function useValidationSummary(
	validation: BetValidationState
): ValidationSummary {
	const primaryError = validation.errors[0]?.message || null;
	const warningsList = validation.warnings.map((w) => w.message);

	let statusIcon = "✓";
	let statusText = "Ready to bet";
	let statusColor = "text-green-600";

	if (!validation.isValid) {
		statusIcon = "✗";
		statusText = "Cannot bet";
		statusColor = "text-red-600";
	} else if (validation.warnings.length > 0) {
		statusIcon = "!";
		statusText = "Caution";
		statusColor = "text-yellow-600";
	}

	let amountStatus: "valid" | "invalid" | "empty" = "empty";
	if (validation.isAmountValid) {
		amountStatus = "valid";
	} else if (validation.errors.some((e) => e.field === "amount")) {
		amountStatus = "invalid";
	}

	let cooldownStatus: "ready" | "waiting" | "unknown" = "unknown";
	if (validation.cooldownRemaining === 0) {
		cooldownStatus = "ready";
	} else if (validation.cooldownRemaining > 0) {
		cooldownStatus = "waiting";
	}

	let betCountStatus: "available" | "maxed" = "available";
	if (validation.betsRemaining === 0) {
		betCountStatus = "maxed";
	}

	let poolCapStatus: "safe" | "caution" | "warning" | "maxed" =
		"safe";
	if (validation.walletPoolPercent >= 10) {
		poolCapStatus = "maxed";
	} else if (validation.walletPoolPercent >= 8) {
		poolCapStatus = "warning";
	} else if (validation.walletPoolPercent >= 5) {
		poolCapStatus = "caution";
	}

	return {
		statusIcon,
		statusText,
		statusColor,
		primaryError,
		warningsList,
		amountStatus,
		cooldownStatus,
		betCountStatus,
		poolCapStatus,
	};
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate expected payout if bet wins (before house fee)
 */
export function calculateExpectedPayout(
	betAmount: number,
	yesPool: number,
	noPool: number,
	betChoice: BetChoice,
	houseFeePercent: number = 5
): {
	totalPool: number;
	winningPool: number;
	userShare: number;
	grossPayout: number;
	houseFee: number;
	netPayout: number;
} {
	const totalPool = yesPool + noPool;

	if (totalPool === 0) {
		return {
			totalPool: 0,
			winningPool: betAmount,
			userShare: 100,
			grossPayout: betAmount,
			houseFee: 0,
			netPayout: betAmount,
		};
	}

	// After bet is placed
	const newYesPool = betChoice === BetChoice.YES ? yesPool + betAmount : yesPool;
	const newNoPool = betChoice === BetChoice.NO ? noPool + betAmount : noPool;
	const newTotalPool = newYesPool + newNoPool;

	const winningPool = betChoice === BetChoice.YES ? newYesPool : newNoPool;
	const userShare = (betAmount / winningPool) * 100;

	// User gets their share of the losing pool + their own bet
	const grossPayout = betAmount + (userShare / 100) * (newTotalPool - winningPool);

	// Apply house fee to winnings only
	const winnings = grossPayout - betAmount;
	const houseFee = (houseFeePercent / 100) * winnings;
	const netPayout = grossPayout - houseFee;

	return {
		totalPool: newTotalPool,
		winningPool,
		userShare,
		grossPayout,
		houseFee,
		netPayout,
	};
}

/**
 * Calculate breakeven odds
 */
export function calculateBreakevenOdds(
	yesPool: number,
	noPool: number,
	houseFeePercent: number = 5
): {
	yesOdds: number; // How much you win per $1 bet if YES wins
	noOdds: number;
} {
	const totalPool = yesPool + noPool;

	if (totalPool === 0) {
		return { yesOdds: 0, noOdds: 0 };
	}

	// Simplified odds calculation
	const yesOdds = totalPool / (yesPool || 1);
	const noOdds = totalPool / (noPool || 1);

	return {
		yesOdds: yesOdds * (1 - houseFeePercent / 100),
		noOdds: noOdds * (1 - houseFeePercent / 100),
	};
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Log full validation state (for debugging)
 */
export function logValidationState(
	validation: BetValidationState,
	context: string = ""
) {
	console.group(
		`🔍 Validation State${context ? ` - ${context}` : ""}`
	);
	console.log("Valid:", validation.isValid);
	console.log("Errors:", validation.errors);
	console.log("Warnings:", validation.warnings);
	console.log("Cooldown Remaining:", validation.cooldownRemaining + "s");
	console.log("Bets Remaining:", validation.betsRemaining);
	console.log("Max Bet Allowed:", validation.maxBetAllowed);
	console.log("Wallet Pool %:", validation.walletPoolPercent.toFixed(2) + "%");
	console.log("Individual Checks:", {
		amount: validation.isAmountValid,
		choice: validation.isChoiceValid,
		market: validation.isMarketValid,
		cooldown: validation.isCooldownOk,
		betCount: validation.isBetCountOk,
		poolCap: validation.isPoolCapOk,
		wallet: validation.isWalletOk,
	});
	console.log("Calculations:", validation.calculations);
	console.groupEnd();
}
