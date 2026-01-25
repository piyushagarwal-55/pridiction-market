/**
 * PredictionMarket TypeScript Types
 * 
 * Centralized type definitions for:
 * - Database models (Prisma)
 * - Smart contract interactions
 * - API request/response types
 * - Component props
 * - Hook return types
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum BetChoice {
	YES = "YES",
	NO = "NO",
}

export enum MarketStatus {
	ACTIVE = "ACTIVE",
	CLOSED = "CLOSED",
	RESOLVED = "RESOLVED",
}

export enum BetStatus {
	PENDING = "PENDING",
	CONFIRMED = "CONFIRMED",
	FLAGGED = "FLAGGED",
	CLAWED_BACK = "CLAWED_BACK",
}

export enum BetHistoryAction {
	PLACED = "PLACED",
	CONFIRMED = "CONFIRMED",
	FLAGGED = "FLAGGED",
	FLAGGED_VELOCITY = "FLAGGED_VELOCITY",
	FLAGGED_CONCENTRATION = "FLAGGED_CONCENTRATION",
	CLAWED_BACK = "CLAWED_BACK",
	REFUNDED = "REFUNDED",
}

export enum FlagSeverity {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	CRITICAL = "CRITICAL",
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/**
 * Market model from Prisma
 */
export interface Market {
	id: string;
	marketId: string;
	question: string;
	status: string; // ACTIVE, CLOSED, RESOLVED
	winner: string | null;
	yesPool: bigint;
	noPool: bigint;
	startDate: Date;
	endDate: Date;
	contractAddress: string;
	gnosisSafeAddress: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Bet model from Prisma
 */
export interface Bet {
	id: string;
	walletAddress: string;
	marketId: string;
	choice: string; // YES or NO
	amount: bigint; // USDT with 6 decimals
	betNumber: number; // 1-10
	status: string; // PENDING, CONFIRMED, FLAGGED, CLAWED_BACK
	txHash: string | null;
	createdAt: Date;
}

/**
 * BetHistory model from Prisma (immutable audit trail)
 */
export interface BetHistory {
	id: string;
	betId: string;
	marketId: string;
	wallet: string;
	action: string; // PLACED, CONFIRMED, FLAGGED, CLAWED_BACK, REFUNDED
	reason: string | null;
	clawbackAmount: bigint | null;
	clawbackTxHash: string | null;
	createdAt: Date;
}

/**
 * FlaggedWallet model from Prisma
 */
export interface FlaggedWallet {
	id: string;
	wallet: string;
	marketId: string;
	reason: string;
	severity: string; // LOW, MEDIUM, HIGH, CRITICAL
	isActive: boolean;
	createdAt: Date;
	unflaggedAt: Date | null;
}

/**
 * PoolSnapshot model from Prisma
 */
export interface PoolSnapshot {
	id: string;
	marketId: string;
	yesPool: bigint;
	noPool: bigint;
	totalBets: number;
	createdAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request body for placing a bet
 */
export interface PlaceBetRequest {
	marketId: string;
	choice: BetChoice;
	amount: number; // Amount in USDT (decimals handled by contract)
	txHash: string; // Transaction hash from contract confirmation
}

/**
 * Response from placing a bet
 */
export interface PlaceBetResponse {
	success: boolean;
	betId?: string;
	status?: string;
	error?: string;
	txHash?: string;
}

/**
 * Response for fetching market data
 */
export interface GetMarketResponse {
	success: boolean;
	market?: {
		marketId: string;
		question: string;
		status: string;
		winner: string | null;
		yesPool: string; // Stringified BigInt
		noPool: string;
		startDate: string;
		endDate: string;
		timeRemaining: number; // seconds
		totalBets: number;
	};
	error?: string;
}

/**
 * Response for fetching pool info
 */
export interface GetPoolInfoResponse {
	success: boolean;
	poolInfo?: {
		marketId: string;
		yesPool: string; // Stringified BigInt
		noPool: string;
		totalPool: string;
		yesPercent: number;
		noPercent: number;
		updatedAt: string;
	};
	error?: string;
}

/**
 * Response for fetching user's bets
 */
export interface GetUserBetsResponse {
	success: boolean;
	bets?: BetWithDetails[];
	count?: number;
	error?: string;
}

/**
 * Bet with additional details for UI
 */
export interface BetWithDetails extends Bet {
	market?: {
		question: string;
		status: string;
	};
	isWinner?: boolean;
	potentialWinnings?: string; // Calculated based on pool at time of bet
}

/**
 * SSE (Server-Sent Events) message for real-time pool updates
 */
export interface PoolUpdateMessage {
	type: "POOL_UPDATE" | "BET_PLACED" | "MARKET_UPDATE" | "ERROR";
	data: {
		marketId: string;
		yesPool?: string;
		noPool?: string;
		yesPercent?: number;
		noPercent?: number;
		totalBets?: number;
		timestamp: number;
		message?: string;
	};
}

/**
 * Request to confirm bet on-chain
 */
export interface ConfirmBetRequest {
	txHash: string;
	marketId: string;
	choice: BetChoice;
	amount: number; // USDT
}

/**
 * Response from confirming bet
 */
export interface ConfirmBetResponse {
	success: boolean;
	betId?: string;
	status?: "PENDING" | "CONFIRMED";
	pollCount?: number;
	error?: string;
}

/**
 * Admin resolve market request
 */
export interface ResolvMarketRequest {
	winner: BetChoice;
	signature: string; // Admin's signed message
	message: string; // Message that was signed
}

/**
 * Admin resolve market response
 */
export interface ResolvMarketResponse {
	success: boolean;
	marketId?: string;
	winner?: BetChoice;
	error?: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for MarketHeader component
 */
export interface MarketHeaderProps {
	market: Market;
	timeRemaining: number; // seconds
	isExpired: boolean;
}

/**
 * Props for PoolDisplay component
 */
export interface PoolDisplayProps {
	yesPool: number; // USDT amount
	noPool: number;
	yesPercent: number;
	noPercent: number;
	totalPool: number;
	isLive: boolean;
}

/**
 * Props for BetForm component
 */
export interface BetFormProps {
	onSubmit: (choice: BetChoice, amount: number) => Promise<void>;
	isLoading: boolean;
	error: string | null;
	cooldownRemaining: number;
	betCount: number;
}

/**
 * Props for BetConfirmation modal
 */
export interface BetConfirmationProps {
	isOpen: boolean;
	txHash: string | null;
	status: "PENDING" | "CONFIRMED" | "ERROR";
	choice: BetChoice;
	amount: number;
	error: string | null;
	onClose: () => void;
}

/**
 * Props for UserBetsList component
 */
export interface UserBetsListProps {
	bets: BetWithDetails[];
	isLoading: boolean;
	error: string | null;
}

/**
 * Props for RealTimeStats component
 */
export interface RealTimeStatsProps {
	marketId: string;
	onPoolUpdate: (poolInfo: PoolInfo) => void;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Return type for usePredictionMarket hook
 */
export interface UsePredictionMarketReturn {
	market: Market | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Return type for useSSE hook
 */
export interface UseSSEReturn {
	poolInfo: PoolInfo | null;
	isConnected: boolean;
	error: string | null;
	disconnect: () => void;
}

/**
 * Return type for useContractBet hook
 */
export interface UseContractBetReturn {
	placeBet: (choice: BetChoice, amount: number) => Promise<string>; // Returns txHash
	isPending: boolean;
	isConfirming: boolean;
	error: string | null;
	txHash: string | null;
	requiresApproval: boolean;
	approveUSDT: () => Promise<void>;
}

/**
 * Return type for useBetValidation hook
 */
export interface UseBetValidationReturn {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation error structure
 */
export interface ValidationError {
	field: string;
	message: string;
	code: string; // e.g., "MIN_BET_EXCEEDED", "COOLDOWN_NOT_MET"
}

/**
 * Validation warning structure
 */
export interface ValidationWarning {
	field: string;
	message: string;
	severity: "LOW" | "MEDIUM" | "HIGH";
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pool information (derived from Market)
 */
export interface PoolInfo {
	marketId: string;
	yesPool: bigint;
	noPool: bigint;
	totalPool: bigint;
	yesPercent: number;
	noPercent: number;
}

/**
 * Market timeline information
 */
export interface MarketTimeline {
	startTime: Date;
	endTime: Date;
	timeRemaining: number; // seconds
	hasEnded: boolean;
	daysRemaining: number;
	hoursRemaining: number;
	minutesRemaining: number;
}

/**
 * Wallet statistics
 */
export interface WalletStats {
	wallet: string;
	betCount: number;
	totalBetAmount: bigint;
	betsOnYes: number;
	betsOnNo: number;
	lastBetTime: Date | null;
	isHighVelocity: boolean;
	isOverPoolCap: boolean;
	isFlagged: boolean;
}

/**
 * Market statistics (for admin/analytics)
 */
export interface MarketStats {
	marketId: string;
	totalBets: number;
	uniqueWallets: number;
	yesPool: bigint;
	noPool: bigint;
	averageBetSize: bigint;
	largestBet: bigint;
	smallestBet: bigint;
	highVelocityWallets: number;
	flaggedWallets: number;
}

/**
 * Clawback information
 */
export interface ClawbackInfo {
	betId: string;
	wallet: string;
	originalAmount: bigint;
	clawbackAmount: bigint;
	houseFeeDeducted: bigint;
	gasFeeEstimate: bigint;
	refundAmount: bigint;
	reason: string;
	timestamp: Date;
	txHash?: string;
}

/**
 * Contract interaction parameters
 */
export interface ContractBetParams {
	choice: BetChoice;
	amount: bigint; // In smallest unit (6 decimals for USDT)
	marketId: string;
	wallet: string;
}

/**
 * Contract state snapshot (from blockchain)
 */
export interface ContractMarketState {
	id: string;
	question: string;
	yesPool: bigint;
	noPool: bigint;
	startTime: number;
	endTime: number;
	status: string; // 0: ACTIVE, 1: CLOSED, 2: RESOLVED
	winner: number; // 0: YES, 1: NO
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Structured error response
 */
export interface APIError {
	success: false;
	error: string;
	code?: string;
	details?: Record<string, unknown>;
	timestamp: number;
}

/**
 * Bet validation error
 */
export interface BetValidationError extends ValidationError {
	code:
	| "INVALID_AMOUNT"
	| "INVALID_CHOICE"
	| "INVALID_WALLET"
	| "BET_MIN_EXCEEDED"
	| "BET_MAX_EXCEEDED"
	| "COOLDOWN_NOT_MET"
	| "BET_COUNT_EXCEEDED"
	| "POOL_CAP_EXCEEDED"
	| "VELOCITY_EXCEEDED"
	| "WALLET_FLAGGED"
	| "MARKET_NOT_ACTIVE"
	| "INSUFFICIENT_BALANCE"
	| "APPROVAL_REQUIRED";
}
