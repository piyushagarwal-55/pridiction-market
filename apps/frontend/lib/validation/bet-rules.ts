/**
 * Bet Validation Rules
 * 
 * Comprehensive validation logic for bet placement
 * Used in API routes, hooks, and client-side validation
 * 
 * All validations must match smart contract constraints
 */

import {
	ANTI_MANIPULATION,
	BET_LIMITS,
	ERROR_CODES,
	VALIDATION_MESSAGES,
	formatUSDT,
	isValidAddress,
} from "@/lib/config/constants";
import { BetChoice, BetValidationError } from "@/lib/types/prediction-market";

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
	isValid: boolean;
	errors: BetValidationError[];
	warnings: ValidationWarning[];
}

export interface ValidationWarning {
	message: string;
	severity: "LOW" | "MEDIUM" | "HIGH";
}

// ============================================================================
// INDIVIDUAL VALIDATORS
// ============================================================================

/**
 * Validate bet amount is within min/max limits
 */
export function validateBetAmount(amount: number): BetValidationError[] {
	const errors: BetValidationError[] = [];

	// Check if amount is valid number
	if (typeof amount !== "number" || !isFinite(amount)) {
		errors.push({
			field: "amount",
			message: "Bet amount must be a valid number",
			code: "INVALID_AMOUNT",
		});
		return errors;
	}

	// Check if amount is positive
	if (amount <= 0) {
		errors.push({
			field: "amount",
			message: "Bet amount must be greater than 0",
			code: "INVALID_AMOUNT",
		});
		return errors;
	}

	// Check if amount is whole number (no decimals)
	if (!Number.isInteger(amount)) {
		errors.push({
			field: "amount",
			message: VALIDATION_MESSAGES.BET_AMOUNT.INVALID,
			code: "INVALID_AMOUNT",
		});
		return errors;
	}

	// Check minimum bet
	if (amount < BET_LIMITS.MIN_BET) {
		errors.push({
			field: "amount",
			message: VALIDATION_MESSAGES.BET_AMOUNT.TOO_LOW,
			code: ERROR_CODES.BET_MIN_EXCEEDED,
		});
	}

	// Check maximum bet
	if (amount > BET_LIMITS.MAX_BET) {
		errors.push({
			field: "amount",
			message: VALIDATION_MESSAGES.BET_AMOUNT.TOO_HIGH,
			code: ERROR_CODES.BET_MAX_EXCEEDED,
		});
	}

	return errors;
}

/**
 * Validate bet choice is valid
 */
export function validateBetChoice(choice: unknown): BetValidationError[] {
	const errors: BetValidationError[] = [];

	if (choice !== BetChoice.YES && choice !== BetChoice.NO) {
		errors.push({
			field: "choice",
			message: "Bet choice must be YES or NO",
			code: "INVALID_CHOICE",
		});
	}

	return errors;
}

/**
 * Validate cooldown enforcement
 * User must wait COOLDOWN_SECONDS between bets
 */
export function validateCooldown(
	lastBetTimestamp: number | null,
	currentTime: number = Date.now()
): BetValidationError[] {
	const errors: BetValidationError[] = [];

	// No previous bet = no cooldown needed
	if (!lastBetTimestamp) {
		return errors;
	}

	const timeSinceLastBet = currentTime - lastBetTimestamp;
	const cooldownMs = ANTI_MANIPULATION.COOLDOWN_SECONDS * 1000;

	if (timeSinceLastBet < cooldownMs) {
		const secondsRemaining = Math.ceil(
			(cooldownMs - timeSinceLastBet) / 1000
		);

		errors.push({
			field: "cooldown",
			message: `You must wait ${secondsRemaining} more seconds before betting again`,
			code: ERROR_CODES.COOLDOWN_NOT_MET,
		});
	}

	return errors;
}

/**
 * Validate bet count limit
 * Max ANTI_MANIPULATION.MAX_BETS_PER_WALLET bets per wallet per market
 */
export function validateBetCount(
	currentBetCount: number
): BetValidationError[] {
	const errors: BetValidationError[] = [];

	if (currentBetCount >= ANTI_MANIPULATION.MAX_BETS_PER_WALLET) {
		errors.push({
			field: "betCount",
			message: VALIDATION_MESSAGES.BET_COUNT.EXCEEDED,
			code: ERROR_CODES.BET_COUNT_EXCEEDED,
		});
	}

	return errors;
}

/**
 * Validate pool concentration cap
 * Single wallet cannot exceed ANTI_MANIPULATION.POOL_CAP_PERCENT of total pool
 */
export function validatePoolCap(
	walletTotalBets: number,
	newBetAmount: number,
	totalYesPool: number,
	totalNoPool: number
): BetValidationError[] {
	const errors: BetValidationError[] = [];

	const totalPool = totalYesPool + totalNoPool;

	// If pool is empty, use larger initial cap
	const maxWalletExposure = totalPool > 0
		? (totalPool * ANTI_MANIPULATION.POOL_CAP_PERCENT) / 100
		: BET_LIMITS.MAX_BET * 10;

	const walletExposureAfterBet = walletTotalBets + newBetAmount;

	if (walletExposureAfterBet > maxWalletExposure) {
		errors.push({
			field: "poolCap",
			message: VALIDATION_MESSAGES.POOL_CAP.EXCEEDED,
			code: ERROR_CODES.POOL_CAP_EXCEEDED,
		});
	}

	return errors;
}

/**
 * Validate bet velocity
 * Max ANTI_MANIPULATION.MAX_BETS_IN_1_HOUR bets per wallet per hour
 */
export function validateBetVelocity(
	recentBetTimestamps: number[],
	currentTime: number = Date.now()
): BetValidationError[] {
	const errors: BetValidationError[] = [];

	const oneHourMs = 3600 * 1000;
	const oneHourAgo = currentTime - oneHourMs;

	// Count bets in the last hour
	const betsInLastHour = recentBetTimestamps.filter(
		(timestamp) => timestamp >= oneHourAgo
	).length;

	if (betsInLastHour >= ANTI_MANIPULATION.MAX_BETS_IN_1_HOUR) {
		errors.push({
			field: "velocity",
			message: VALIDATION_MESSAGES.VELOCITY.EXCEEDED,
			code: ERROR_CODES.VELOCITY_EXCEEDED,
		});
	}

	return errors;
}

/**
 * Validate wallet is not flagged
 */
export function validateWalletNotFlagged(isFlagged: boolean): BetValidationError[] {
	const errors: BetValidationError[] = [];

	if (isFlagged) {
		errors.push({
			field: "wallet",
			message: VALIDATION_MESSAGES.WALLET.FLAGGED,
			code: ERROR_CODES.WALLET_FLAGGED,
		});
	}

	return errors;
}

/**
 * Validate wallet address format
 */
export function validateWalletAddress(address: unknown): BetValidationError[] {
	const errors: BetValidationError[] = [];

	if (!address || typeof address !== "string") {
		errors.push({
			field: "wallet",
			message: "Invalid wallet address",
			code: "INVALID_WALLET",
		});
		return errors;
	}

	if (!isValidAddress(address)) {
		errors.push({
			field: "wallet",
			message: "Wallet address format is invalid",
			code: "INVALID_WALLET",
		});
	}

	return errors;
}

/**
 * Validate market is active
 */
export function validateMarketActive(
	marketStatus: string,
	endTime: number,
	currentTime: number = Date.now()
): BetValidationError[] {
	const errors: BetValidationError[] = [];

	if (marketStatus !== "ACTIVE") {
		errors.push({
			field: "market",
			message: VALIDATION_MESSAGES.MARKET.NOT_ACTIVE,
			code: ERROR_CODES.MARKET_NOT_ACTIVE,
		});
	}

	// Also check if market has expired
	const endTimeMs = endTime * 1000;
	if (currentTime > endTimeMs) {
		errors.push({
			field: "market",
			message: "Market has expired",
			code: ERROR_CODES.MARKET_NOT_ACTIVE,
		});
	}

	return errors;
}

/**
 * Validate sufficient USDT balance
 */
export function validateUSDTBalance(
	userBalance: number,
	betAmount: number
): BetValidationError[] {
	const errors: BetValidationError[] = [];

	if (userBalance < betAmount) {
		errors.push({
			field: "balance",
			message: `Insufficient USDT balance. You have ${formatUSDT(userBalance)} USDT`,
			code: ERROR_CODES.INSUFFICIENT_BALANCE,
		});
	}

	return errors;
}

/**
 * Validate USDT approval
 */
export function validateUSDTApproval(
	allowance: number,
	betAmount: number
): BetValidationError[] {
	const errors: BetValidationError[] = [];

	if (allowance < betAmount) {
		errors.push({
			field: "approval",
			message: "You must approve USDT spending first",
			code: ERROR_CODES.APPROVAL_REQUIRED,
		});
	}

	return errors;
}

// ============================================================================
// COMPREHENSIVE VALIDATORS
// ============================================================================

/**
 * Validate all bet constraints (backend/API use)
 * Called from API route after transaction is confirmed
 */
export function validateBetComprehensive({
	walletAddress,
	choice,
	amount,
	lastBetTimestamp,
	currentBetCount,
	walletTotalBets,
	recentBetTimestamps,
	totalYesPool,
	totalNoPool,
	marketStatus,
	marketEndTime,
	isFlagged,
}: {
	walletAddress: string;
	choice: unknown;
	amount: number;
	lastBetTimestamp: number | null;
	currentBetCount: number;
	walletTotalBets: number;
	recentBetTimestamps: number[];
	totalYesPool: number;
	totalNoPool: number;
	marketStatus: string;
	marketEndTime: number;
	isFlagged: boolean;
}): ValidationResult {
	const errors: BetValidationError[] = [];
	const warnings: ValidationWarning[] = [];
	const currentTime = Date.now();

	// Validate wallet address
	errors.push(...validateWalletAddress(walletAddress));

	// Validate choice
	errors.push(...validateBetChoice(choice));

	// Validate amount
	errors.push(...validateBetAmount(amount));

	// Validate market is active
	errors.push(...validateMarketActive(marketStatus, marketEndTime, currentTime));

	// Validate wallet not flagged
	errors.push(...validateWalletNotFlagged(isFlagged));

	// Only check timing-based validators if previous validations passed
	if (errors.length === 0) {
		// Validate cooldown
		errors.push(...validateCooldown(lastBetTimestamp, currentTime));

		// Validate bet count
		errors.push(...validateBetCount(currentBetCount));

		// Validate pool cap
		errors.push(...validatePoolCap(walletTotalBets, amount, totalYesPool, totalNoPool));

		// Validate velocity
		errors.push(...validateBetVelocity(recentBetTimestamps, currentTime));
	}

	// Add warnings for high amounts
	if (amount > BET_LIMITS.MAX_BET * 0.8) {
		warnings.push({
			message: `You are betting a large amount (${amount} USDT)`,
			severity: "MEDIUM",
		});
	}

	// Add warning if approaching pool cap
	const totalPool = totalYesPool + totalNoPool;
	if (totalPool > 0) {
		const poolCapAmount = (totalPool * ANTI_MANIPULATION.POOL_CAP_PERCENT) / 100;
		const walletExposurePercent = ((walletTotalBets + amount) / totalPool) * 100;

		if (walletExposurePercent > 8) {
			warnings.push({
				message: `You are approaching the ${ANTI_MANIPULATION.POOL_CAP_PERCENT}% pool limit (${walletExposurePercent.toFixed(1)}%)`,
				severity: "HIGH",
			});
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate bet for client-side (before submission)
 * Less comprehensive - used for UX feedback
 */
export function validateBetClientSide({
	amount,
	cooldownRemaining,
	betCount,
	walletExposurePercent,
}: {
	amount: number;
	cooldownRemaining: number;
	betCount: number;
	walletExposurePercent: number;
}): ValidationResult {
	const errors: BetValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	// Validate amount
	errors.push(...validateBetAmount(amount));

	// Check cooldown
	if (cooldownRemaining > 0) {
		errors.push({
			field: "cooldown",
			message: `Wait ${cooldownRemaining}s before next bet`,
			code: ERROR_CODES.COOLDOWN_NOT_MET,
		});
	}

	// Check bet count
	if (betCount >= ANTI_MANIPULATION.MAX_BETS_PER_WALLET) {
		errors.push({
			field: "betCount",
			message: VALIDATION_MESSAGES.BET_COUNT.EXCEEDED,
			code: ERROR_CODES.BET_COUNT_EXCEEDED,
		});
	}

	// Check pool cap
	if (walletExposurePercent > ANTI_MANIPULATION.POOL_CAP_PERCENT) {
		errors.push({
			field: "poolCap",
			message: VALIDATION_MESSAGES.POOL_CAP.EXCEEDED,
			code: ERROR_CODES.POOL_CAP_EXCEEDED,
		});
	}

	// Warnings
	if (walletExposurePercent > 8) {
		warnings.push({
			message: `You have ${walletExposurePercent.toFixed(1)}% of the pool`,
			severity: "MEDIUM",
		});
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate bet for smart contract simulation
 * Checks only constraints that the contract enforces
 */
export function validateBetForContract({
	amount,
	choice,
	lastBetTimestamp,
	currentBetCount,
	walletTotalBets,
	recentBetTimestamps,
	totalYesPool,
	totalNoPool,
	isFlagged,
}: {
	amount: number;
	choice: unknown;
	lastBetTimestamp: number | null;
	currentBetCount: number;
	walletTotalBets: number;
	recentBetTimestamps: number[];
	totalYesPool: number;
	totalNoPool: number;
	isFlagged: boolean;
}): ValidationResult {
	const errors: BetValidationError[] = [];
	const warnings: ValidationWarning[] = [];
	const currentTime = Date.now();

	// These match contract validation
	errors.push(...validateBetAmount(amount));
	errors.push(...validateBetChoice(choice));
	errors.push(...validateCooldown(lastBetTimestamp, currentTime));
	errors.push(...validateBetCount(currentBetCount));
	errors.push(...validatePoolCap(walletTotalBets, amount, totalYesPool, totalNoPool));
	errors.push(...validateBetVelocity(recentBetTimestamps, currentTime));
	errors.push(...validateWalletNotFlagged(isFlagged));

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

// ============================================================================
// UTILITY VALIDATORS
// ============================================================================

/**
 * Check if bet would be rejected immediately
 */
export function wouldBetBeRejected({
	amount,
	cooldownRemaining,
	betCount,
	isFlagged,
	marketStatus,
}: {
	amount: number;
	cooldownRemaining: number;
	betCount: number;
	isFlagged: boolean;
	marketStatus: string;
}): boolean {
	return (
		amount < BET_LIMITS.MIN_BET ||
		amount > BET_LIMITS.MAX_BET ||
		cooldownRemaining > 0 ||
		betCount >= ANTI_MANIPULATION.MAX_BETS_PER_WALLET ||
		isFlagged ||
		marketStatus !== "ACTIVE"
	);
}

/**
 * Get remaining time for cooldown
 */
export function getCooldownRemaining(
	lastBetTimestamp: number | null,
	currentTime: number = Date.now()
): number {
	if (!lastBetTimestamp) return 0;

	const timeSinceLastBet = currentTime - lastBetTimestamp;
	const cooldownMs = ANTI_MANIPULATION.COOLDOWN_SECONDS * 1000;

	if (timeSinceLastBet >= cooldownMs) return 0;

	return Math.ceil((cooldownMs - timeSinceLastBet) / 1000);
}

/**
 * Get remaining bets allowed
 */
export function getRemainigBetsAllowed(currentBetCount: number): number {
	return Math.max(0, ANTI_MANIPULATION.MAX_BETS_PER_WALLET - currentBetCount);
}

/**
 * Calculate max bet allowed by pool cap
 */
export function getMaxBetByPoolCap(
	walletTotalBets: number,
	totalYesPool: number,
	totalNoPool: number
): number {
	const totalPool = totalYesPool + totalNoPool;

	const maxWalletExposure = totalPool > 0
		? (totalPool * ANTI_MANIPULATION.POOL_CAP_PERCENT) / 100
		: BET_LIMITS.MAX_BET * 10;

	return Math.max(0, maxWalletExposure - walletTotalBets);
}

/**
 * Calculate wallet's current pool percentage
 */
export function calculateWalletPoolPercent(
	walletTotalBets: number,
	totalYesPool: number,
	totalNoPool: number
): number {
	const totalPool = totalYesPool + totalNoPool;

	if (totalPool === 0) return 0;

	return (walletTotalBets / totalPool) * 100;
}
