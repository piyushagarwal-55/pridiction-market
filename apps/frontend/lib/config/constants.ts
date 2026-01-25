/**
 * PredictionMarket Configuration Constants
 * 
 * Centralized configuration for:
 * - Bet limits and fees
 * - Cooldown and velocity limits
 * - Smart contract addresses
 * - API endpoints
 * - Network configuration
 * - UI constants
 */

// ============================================================================
// BET LIMITS & FEES
// ============================================================================

export const BET_LIMITS = {
	// Minimum bet in USDT
	MIN_BET: 5,
	// Maximum bet in USDT
	MAX_BET: 5000,
	// House fee percentage (taken from winnings, not bet amount)
	HOUSE_FEE_PERCENT: 5,
	// USDT decimals on Cronos (standard for ERC20)
	USDT_DECIMALS: 6,
	// Min/Max in smallest unit (for contract calls)
	MIN_BET_WEI: 5_000_000n, // 5 USDT
	MAX_BET_WEI: 5_000_000_000n, // 5000 USDT
} as const;

// ============================================================================
// ANTI-MANIPULATION LIMITS
// ============================================================================

export const ANTI_MANIPULATION = {
	// Seconds between bets from same wallet
	COOLDOWN_SECONDS: 300, // 5 minutes
	// Maximum bets per wallet on single market
	MAX_BETS_PER_WALLET: 10,
	// Maximum percentage of total pool per wallet (prevents concentration)
	POOL_CAP_PERCENT: 10, // 10% max per wallet
	// Maximum bets per wallet in 1 hour (bet velocity limit)
	MAX_BETS_IN_1_HOUR: 3,
	// Minimum wallet age in seconds (sybil resistance)
	MIN_WALLET_AGE_SECONDS: 604800, // 7 days
	// Minimum on-chain transactions required
	MIN_ONCHAIN_TRANSACTIONS: 1,
} as const;

// ============================================================================
// MARKET CONFIGURATION
// ============================================================================

export const MARKET_CONFIG = {
	// Minimum market duration in hours
	MIN_MARKET_DURATION_HOURS: 24,
	// Default market duration for new markets
	DEFAULT_MARKET_DURATION_DAYS: 30,
	// Update frequency for real-time pool stats in milliseconds
	POOL_UPDATE_INTERVAL_MS: 2000, // 2 seconds
	// Number of pool snapshots to keep for history
	POOL_SNAPSHOT_HISTORY_LIMIT: 1000,
} as const;

// ============================================================================
// SMART CONTRACT ADDRESSES
// ============================================================================

const getContractAddresses = () => {
	const network = process.env.NEXT_PUBLIC_CRONOS_NETWORK || "testnet";

	if (network === "mainnet") {
		return {
			PREDICTION_MARKET: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
			CASINO: process.env.NEXT_PUBLIC_CASINO_ADDRESS || "",
			USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || "0xF0F161fDA2712DB8b566946122a5af183995e2eD",
			GNOSIS_SAFE: process.env.NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS || "",
			BOT_SETTINGS: process.env.NEXT_PUBLIC_BOT_SETTINGS_ADDRESS || "",
		};
	}

	// Testnet defaults
	return {
		PREDICTION_MARKET: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
		CASINO: process.env.NEXT_PUBLIC_CASINO_ADDRESS || "", // Will be set after deployment
		USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x66e428c3f67a68a47b7bc798c2c77b519b79260d",
		GNOSIS_SAFE: process.env.NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS || "",
		BOT_SETTINGS: process.env.NEXT_PUBLIC_BOT_SETTINGS_ADDRESS || "", // Will be set after deployment
	};
};

export const CONTRACT_ADDRESSES = getContractAddresses();

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

export const NETWORKS = {
	CRONOS_TESTNET: {
		chainId: 338,
		name: "Cronos Testnet",
		rpcUrl: "https://evm-t3.cronos.org",
		blockExplorer: "https://cronos.org/explorer/testnet3",
		nativeSymbol: "CRO",
		isTestnet: true,
	},
	CRONOS_MAINNET: {
		chainId: 25,
		name: "Cronos",
		rpcUrl: "https://evm.cronos.org",
		blockExplorer: "https://cronos.org/explorer",
		nativeSymbol: "CRO",
		isTestnet: false,
	},
} as const;

export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_CRONOS_NETWORK === "mainnet"
	? NETWORKS.CRONOS_MAINNET
	: NETWORKS.CRONOS_TESTNET;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
	// Bet endpoints
	PLACE_BET: "/api/bets/confirm",
	GET_USER_BETS: "/api/bets/get-user-bets",

	// Market endpoints
	GET_MARKET: "/api/markets/[id]",
	GET_MARKET_STATS: "/api/markets/[id]/stats",
	LIVE_STATS: "/api/markets/live-stats",

	// Admin endpoints
	RESOLVE_MARKET: "/api/markets/[id]/admin/resolve",
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI = {
	// Polling interval for checking transaction confirmation (milliseconds)
	TX_CONFIRMATION_POLL_MS: 3000, // 3 seconds
	// Maximum time to wait for tx confirmation (milliseconds)
	TX_CONFIRMATION_TIMEOUT_MS: 300000, // 5 minutes
	// Debounce delay for form inputs (milliseconds)
	DEBOUNCE_MS: 500,
	// Refresh interval for real-time data (milliseconds)
	REFRESH_INTERVAL_MS: 2000,
	// Toast notification duration (milliseconds)
	TOAST_DURATION_MS: 5000,
	// Maximum number of recent transactions to show
	MAX_RECENT_BETS_DISPLAY: 10,
	// Chart data points to display
	CHART_DATA_POINTS: 50,
} as const;

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================

export const VALIDATION_MESSAGES = {
	BET_AMOUNT: {
		TOO_LOW: `Minimum bet is ${BET_LIMITS.MIN_BET} USDT`,
		TOO_HIGH: `Maximum bet is ${BET_LIMITS.MAX_BET} USDT`,
		INVALID: "Bet amount must be a whole number",
	},
	COOLDOWN: {
		NOT_MET: `You must wait ${ANTI_MANIPULATION.COOLDOWN_SECONDS} seconds between bets`,
	},
	BET_COUNT: {
		EXCEEDED: `Maximum ${ANTI_MANIPULATION.MAX_BETS_PER_WALLET} bets per market`,
	},
	POOL_CAP: {
		EXCEEDED: `Your bet would exceed ${ANTI_MANIPULATION.POOL_CAP_PERCENT}% pool limit`,
	},
	VELOCITY: {
		EXCEEDED: `Maximum ${ANTI_MANIPULATION.MAX_BETS_IN_1_HOUR} bets per hour`,
	},
	WALLET: {
		FLAGGED: "Your wallet has been flagged for review",
		NOT_CONNECTED: "Please connect your wallet",
		WRONG_NETWORK: `Please switch to ${CURRENT_NETWORK.name}`,
	},
	MARKET: {
		NOT_ACTIVE: "Market is not accepting bets",
		ALREADY_RESOLVED: "Market has already been resolved",
	},
	TRANSACTION: {
		FAILED: "Transaction failed. Please try again.",
		PENDING: "Transaction pending...",
		CONFIRMED: "Transaction confirmed!",
	},
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
	// Bet validation errors
	BET_MIN_EXCEEDED: "BET_MIN_EXCEEDED",
	BET_MAX_EXCEEDED: "BET_MAX_EXCEEDED",
	COOLDOWN_NOT_MET: "COOLDOWN_NOT_MET",
	BET_COUNT_EXCEEDED: "BET_COUNT_EXCEEDED",
	POOL_CAP_EXCEEDED: "POOL_CAP_EXCEEDED",
	VELOCITY_EXCEEDED: "VELOCITY_EXCEEDED",
	WALLET_FLAGGED: "WALLET_FLAGGED",

	// Market errors
	MARKET_NOT_ACTIVE: "MARKET_NOT_ACTIVE",
	MARKET_NOT_FOUND: "MARKET_NOT_FOUND",
	MARKET_ALREADY_RESOLVED: "MARKET_ALREADY_RESOLVED",

	// Wallet/Network errors
	WALLET_NOT_CONNECTED: "WALLET_NOT_CONNECTED",
	WRONG_NETWORK: "WRONG_NETWORK",
	INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
	APPROVAL_REQUIRED: "APPROVAL_REQUIRED",

	// Contract/Transaction errors
	TX_FAILED: "TX_FAILED",
	TX_REVERTED: "TX_REVERTED",
	TX_TIMEOUT: "TX_TIMEOUT",
	CONTRACT_ERROR: "CONTRACT_ERROR",

	// API errors
	API_ERROR: "API_ERROR",
	API_TIMEOUT: "API_TIMEOUT",
	UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
	// Enable real-time pool updates via SSE
	ENABLE_LIVE_POOL_UPDATES: process.env.NEXT_PUBLIC_ENABLE_LIVE_UPDATES !== "false",
	// Enable wallet flagging UI
	ENABLE_WALLET_FLAGGING: process.env.NEXT_PUBLIC_ENABLE_FLAGGING !== "false",
	// Enable market history view
	ENABLE_MARKET_HISTORY: process.env.NEXT_PUBLIC_ENABLE_HISTORY !== "false",
	// Enable analytics dashboard
	ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "false",
	// Enable admin resolution panel
	ENABLE_ADMIN_PANEL: process.env.NEXT_PUBLIC_ENABLE_ADMIN !== "false",
	// Enable maintenance mode
	MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
	// Enable debug logging
	DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG === "true",
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
	// Main pages
	HOME: "/",
	PREDICT: "/predict",
	LIVE: "/live",

	// Auth
	CONNECT: "/connect",

	// Admin
	ADMIN: "/admin",
	ADMIN_MARKETS: "/admin/markets",
	ADMIN_USERS: "/admin/users",

	// Account
	ACCOUNT: "/account",
	ACCOUNT_BETS: "/account/bets",
	ACCOUNT_SETTINGS: "/account/settings",
} as const;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME = {
	// Milliseconds per unit
	MS_PER_SECOND: 1000,
	MS_PER_MINUTE: 60000,
	MS_PER_HOUR: 3600000,
	MS_PER_DAY: 86400000,

	// Seconds per unit
	SECONDS_PER_MINUTE: 60,
	SECONDS_PER_HOUR: 3600,
	SECONDS_PER_DAY: 86400,

	// Formatting
	DATE_FORMAT: "MMM dd, yyyy",
	TIME_FORMAT: "HH:mm:ss",
	DATETIME_FORMAT: "MMM dd, yyyy HH:mm:ss",
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
	DEFAULT_PAGE_SIZE: 20,
	MAX_PAGE_SIZE: 100,
	BET_HISTORY_PAGE_SIZE: 10,
	MARKET_LIST_PAGE_SIZE: 25,
} as const;

// ============================================================================
// DISPLAY FORMATTING
// ============================================================================

export const DISPLAY = {
	// Number of decimal places for display
	USDT_DECIMALS_DISPLAY: 2,
	PERCENT_DECIMALS_DISPLAY: 1,

	// Maximum characters for truncation
	WALLET_ADDRESS_TRUNCATE: 6, // Show first 6 and last 4 chars
	TRANSACTION_HASH_TRUNCATE: 8,

	// Minimum pool to show percentage
	MIN_POOL_FOR_PERCENT: 1000, // 1000 USDT
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE = {
	// Cache duration in seconds
	MARKET_DATA_TTL: 10, // 10 seconds
	USER_BETS_TTL: 5, // 5 seconds
	POOL_STATS_TTL: 2, // 2 seconds
	WALLET_STATS_TTL: 30, // 30 seconds
} as const;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Format USDT amount from smallest unit (6 decimals) to display value
 */
export function formatUSDT(weiAmount: bigint | number): number {
	const amount = typeof weiAmount === "bigint" ? weiAmount : BigInt(weiAmount);
	return Number(amount) / Math.pow(10, BET_LIMITS.USDT_DECIMALS);
}

/**
 * Convert USDT display value to smallest unit (6 decimals)
 */
export function toUSDTWei(amount: number): bigint {
	return BigInt(Math.floor(amount * Math.pow(10, BET_LIMITS.USDT_DECIMALS)));
}

/**
 * Format percentage with proper decimal places
 */
export function formatPercent(value: number): string {
	return `${value.toFixed(DISPLAY.PERCENT_DECIMALS_DISPLAY)}%`;
}

/**
 * Truncate wallet address
 */
export function truncateAddress(address: string): string {
	if (address.length < 10) return address;
	return `${address.slice(0, DISPLAY.WALLET_ADDRESS_TRUNCATE)}...${address.slice(-4)}`;
}

/**
 * Truncate transaction hash
 */
export function truncateTxHash(txHash: string): string {
	if (txHash.length < 10) return txHash;
	return `${txHash.slice(0, DISPLAY.TRANSACTION_HASH_TRUNCATE)}...`;
}

/**
 * Get validation message for error code
 */
export function getValidationMessage(code: string): string {
	const messages: Record<string, string> = {
		[ERROR_CODES.BET_MIN_EXCEEDED]: VALIDATION_MESSAGES.BET_AMOUNT.TOO_LOW,
		[ERROR_CODES.BET_MAX_EXCEEDED]: VALIDATION_MESSAGES.BET_AMOUNT.TOO_HIGH,
		[ERROR_CODES.COOLDOWN_NOT_MET]: VALIDATION_MESSAGES.COOLDOWN.NOT_MET,
		[ERROR_CODES.BET_COUNT_EXCEEDED]: VALIDATION_MESSAGES.BET_COUNT.EXCEEDED,
		[ERROR_CODES.POOL_CAP_EXCEEDED]: VALIDATION_MESSAGES.POOL_CAP.EXCEEDED,
		[ERROR_CODES.VELOCITY_EXCEEDED]: VALIDATION_MESSAGES.VELOCITY.EXCEEDED,
		[ERROR_CODES.WALLET_FLAGGED]: VALIDATION_MESSAGES.WALLET.FLAGGED,
		[ERROR_CODES.MARKET_NOT_ACTIVE]: VALIDATION_MESSAGES.MARKET.NOT_ACTIVE,
		[ERROR_CODES.WALLET_NOT_CONNECTED]: VALIDATION_MESSAGES.WALLET.NOT_CONNECTED,
		[ERROR_CODES.WRONG_NETWORK]: VALIDATION_MESSAGES.WALLET.WRONG_NETWORK,
	};

	return messages[code] || "An error occurred. Please try again.";
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if transaction hash is valid
 */
export function isValidTxHash(txHash: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}
