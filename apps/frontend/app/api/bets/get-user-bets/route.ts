/**
 * GET /api/bets/get-user-bets?marketId=xxx&page=1&limit=20
 * 
 * Fetch user's bets for a specific market
 * 
 * Query parameters:
 * - marketId: string (required) - Market ID to fetch bets for
 * - page: number (optional, default=1) - Page number for pagination
 * - limit: number (optional, default=20, max=100) - Items per page
 * 
 * Headers (required):
 * - X-Wallet-Address: string - User's wallet address (from auth context)
 * 
 * Response:
 * {
 *   success: boolean
 *   bets?: {
 *     id: string
 *     choice: "YES" | "NO"
 *     amount: string (USDT)
 *     betNumber: number
 *     status: "CONFIRMED" | "FLAGGED" | "CLAWED_BACK"
 *     createdAt: string (ISO)
 *   }[]
 *   pagination?: {
 *     page: number
 *     limit: number
 *     total: number
 *     pages: number
 *   }
 *   error?: string
 *   code?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { db, getUserBetsForMarket } from "@/lib/db/client";
import { BET_LIMITS, PAGINATION } from "@/lib/config/constants";

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number = 100, windowMs: number = 60000): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(key);

	if (!entry || now > entry.resetTime) {
		rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
		return true;
	}

	if (entry.count < limit) {
		entry.count++;
		return true;
	}

	return false;
}

function cleanupRateLimitMap() {
	const now = Date.now();
	for (const [key, entry] of rateLimitMap.entries()) {
		if (now > entry.resetTime) {
			rateLimitMap.delete(key);
		}
	}
}

// Run cleanup every 5 minutes
if (typeof window === "undefined") {
	setInterval(cleanupRateLimitMap, 300000);
}

// ============================================================================
// LOGGER
// ============================================================================

interface LogContext {
	walletAddress: string;
	marketId: string;
	page?: number;
	limit?: number;
	error?: string;
	errorCode?: string;
	duration?: number;
}

function logInfo(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.log(
		`[${timestamp}] [GET-USER-BETS] ${message}`,
		JSON.stringify(context)
	);
}

function logError(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.error(
		`[${timestamp}] [GET-USER-BETS] ❌ ${message}`,
		JSON.stringify(context)
	);

	// TODO: Integrate with Sentry
	// if (process.env.SENTRY_DSN) {
	//   Sentry.captureException(new Error(message), { extra: context });
	// }
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

function validateRequest(request: NextRequest): {
	isValid: boolean;
	walletAddress?: string;
	marketId?: string;
	page?: number;
	limit?: number;
	error?: string;
	status?: number;
} {
	const startTime = Date.now();

	// Extract wallet from header
	const walletAddress = request.headers.get("X-Wallet-Address");

	if (!walletAddress) {
		logError("Missing wallet address header", { error: "NO_WALLET_HEADER" });
		return {
			isValid: false,
			error: "X-Wallet-Address header is required",
			status: 401,
		};
	}

	if (!isAddress(walletAddress)) {
		logError("Invalid wallet address format", {
			walletAddress,
			error: "INVALID_WALLET_FORMAT",
		});
		return {
			isValid: false,
			error: "Invalid wallet address format",
			status: 400,
		};
	}

	// Extract query parameters
	const { searchParams } = new URL(request.url);
	const marketId = searchParams.get("marketId");
	const pageStr = searchParams.get("page") || "1";
	const limitStr = searchParams.get("limit") || "20";

	if (!marketId) {
		logError("Missing marketId parameter", {
			walletAddress,
			error: "NO_MARKET_ID",
		});
		return {
			isValid: false,
			error: "marketId query parameter is required",
			status: 400,
		};
	}

	// Validate pagination
	let page = 1;
	let limit: number = PAGINATION.DEFAULT_PAGE_SIZE;

	try {
		page = Math.max(1, parseInt(pageStr, 10));
		limit = Math.max(1, Math.min(parseInt(limitStr, 10), PAGINATION.MAX_PAGE_SIZE));
	} catch {
		logError("Invalid pagination parameters", {
			walletAddress,
			marketId,
			error: "INVALID_PAGINATION",
		});
		return {
			isValid: false,
			error: "page and limit must be valid numbers",
			status: 400,
		};
	}

	// Check rate limit
	const rateLimitKey = `get-bets:${walletAddress}`;
	if (!checkRateLimit(rateLimitKey, 100, 60000)) {
		logError("Rate limit exceeded", {
			walletAddress,
			marketId,
			error: "RATE_LIMIT_EXCEEDED",
		});
		return {
			isValid: false,
			error: "Rate limit exceeded. Maximum 100 requests per minute.",
			status: 429,
		};
	}

	logInfo("Request validated", {
		walletAddress: walletAddress.slice(0, 8) + "...",
		marketId,
		page,
		limit,
		duration: Date.now() - startTime,
	});

	return {
		isValid: true,
		walletAddress,
		marketId,
		page,
		limit,
	};
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(
	request: NextRequest
): Promise<NextResponse> {
	const startTime = Date.now();
	let walletAddress = "";
	let marketId = "";
	let page = 1;
	let limit: number = PAGINATION.DEFAULT_PAGE_SIZE;

	try {
		// Validate request
		const validation = validateRequest(request);

		if (!validation.isValid) {
			return NextResponse.json(
				{
					success: false,
					error: validation.error,
					code: "VALIDATION_ERROR",
				},
				{ status: validation.status || 400 }
			);
		}

		walletAddress = validation.walletAddress!;
		marketId = validation.marketId!;
		page = validation.page!;
		limit = validation.limit!;

		// ====== STEP 1: Verify market exists ======
		const market = await db.market.findUnique({
			where: { marketId },
		});

		if (!market) {
			logError("Market not found", { walletAddress: walletAddress.slice(0, 8), marketId });
			return NextResponse.json(
				{
					success: false,
					error: "Market not found",
					code: "MARKET_NOT_FOUND",
				},
				{ status: 404 }
			);
		}

		// ====== STEP 2: Fetch total count ======
		const totalBets = await db.bet.count({
			where: {
				walletAddress,
				marketId,
			},
		});

		const totalPages = Math.ceil(totalBets / limit);

		// Validate page number
		if (page > totalPages && totalBets > 0) {
			logError("Page out of range", {
				walletAddress: walletAddress.slice(0, 8),
				marketId,
				page,
			});
			return NextResponse.json(
				{
					success: false,
					error: `Page ${page} out of range. Total pages: ${totalPages}`,
					code: "PAGE_OUT_OF_RANGE",
				},
				{ status: 400 }
			);
		}

		// ====== STEP 3: Fetch paginated bets ======
		const bets = await db.bet.findMany({
			where: {
				walletAddress,
				marketId,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip: (page - 1) * limit,
			take: limit,
		});

		// ====== STEP 4: Format response ======
		const formattedBets = bets.map((bet: typeof bets[0]) => ({
			id: bet.id,
			choice: bet.choice,
			amount: (Number(bet.amount) / 10 ** BET_LIMITS.USDT_DECIMALS).toFixed(2),
			betNumber: bet.betNumber,
			status: bet.status,
			txHash: bet.txHash,
			createdAt: bet.createdAt.toISOString(),
		}));

		const duration = Date.now() - startTime;

		logInfo("Bets fetched successfully", {
			walletAddress: walletAddress.slice(0, 8),
			marketId,
			page,
			limit,
			duration,
		});

		// ====== STEP 5: Return response with caching headers ======
		return NextResponse.json(
			{
				success: true,
				bets: formattedBets,
				pagination: {
					page,
					limit,
					total: totalBets,
					pages: totalPages,
				},
			},
			{
				status: 200,
				headers: {
					// Cache for 10 seconds (user's bets don't change often)
					"Cache-Control": "private, max-age=10",
					"X-Response-Time": `${duration}ms`,
					"X-Total-Bets": totalBets.toString(),
				},
			}
		);
	} catch (error) {
		const duration = Date.now() - startTime;

		logError("Unexpected error", {
			walletAddress: walletAddress.slice(0, 8),
			marketId,
			error: (error as Error).message,
			duration,
		});

		// TODO: Report to Sentry
		// if (process.env.SENTRY_DSN) {
		//   Sentry.captureException(error);
		// }

		return NextResponse.json(
			{
				success: false,
				error: "An error occurred while fetching your bets",
				code: "INTERNAL_ERROR",
			},
			{ status: 500 }
		);
	}
}

// ============================================================================
// CORS & OPTIONS
// ============================================================================

export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, X-Wallet-Address",
			"Access-Control-Max-Age": "86400",
		},
	});
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * TODO: Add performance tracking
 * 
 * Metrics to track:
 * - Response time (should be <100ms)
 * - Database query time
 * - Cache hit rate
 * - Error rate per market
 * - Rate limit hits per wallet
 */

/**
 * TODO: Add request/response logging
 * 
 * Log to:
 * - CloudWatch / DataDog / New Relic
 * - Include: wallet, market, page, response time, hit/miss
 */
