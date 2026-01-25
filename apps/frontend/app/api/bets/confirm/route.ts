/**
 * POST /api/bets/confirm
 * 
 * Confirms a bet transaction after user has signed on-chain
 * 
 * Request body:
 * {
 *   txHash: string          // Transaction hash from blockchain
 *   marketId: string        // Market ID
 *   choice: "YES" | "NO"    // Bet choice
 *   amount: number          // Bet amount in USDT
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   betId?: string
 *   status?: "CONFIRMED"
 *   error?: string
 *   code?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { isAddress, Hex } from "viem";
import { db, getMarketById, getUserBetCount, getUserTotalBetAmount } from "@/lib/db/client";
import {
	validateBetTransaction,
	formatValidationErrors,
	getTransactionStatusMessage,
} from "@/lib/blockchain/tx-validator";
import {
	validateBetComprehensive,
	validateBetForContract,
} from "@/lib/validation/bet-rules";
import {
	BetChoice,
	PlaceBetRequest,
	PlaceBetResponse,
	APIError,
} from "@/lib/types/prediction-market";
import {
	ERROR_CODES,
	VALIDATION_MESSAGES,
	BET_LIMITS,
} from "@/lib/config/constants";

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

function validateRequest(body: any): {
	isValid: boolean;
	error?: string;
	data?: PlaceBetRequest & { walletAddress: string };
} {
	// Check required fields
	if (!body.txHash || typeof body.txHash !== "string") {
		return { isValid: false, error: "txHash is required and must be a string" };
	}

	if (!body.marketId || typeof body.marketId !== "string") {
		return { isValid: false, error: "marketId is required and must be a string" };
	}

	if (!body.choice || (body.choice !== BetChoice.YES && body.choice !== BetChoice.NO)) {
		return { isValid: false, error: "choice must be YES or NO" };
	}

	if (typeof body.amount !== "number" || body.amount <= 0) {
		return { isValid: false, error: "amount must be a positive number" };
	}

	if (!body.walletAddress || typeof body.walletAddress !== "string") {
		return { isValid: false, error: "walletAddress is required" };
	}

	// Validate Ethereum address
	if (!isAddress(body.walletAddress)) {
		return { isValid: false, error: "Invalid wallet address format" };
	}

	return {
		isValid: true,
		data: {
			txHash: body.txHash,
			marketId: body.marketId,
			choice: body.choice,
			amount: body.amount,
			walletAddress: body.walletAddress,
		},
	};
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

function errorResponse(
	message: string,
	code?: string,
	status: number = 400
): NextResponse<APIError | PlaceBetResponse> {
	return NextResponse.json(
		{
			success: false,
			error: message,
			code,
			timestamp: Date.now(),
		} as APIError,
		{ status }
	);
}

function validationErrorResponse(
	errors: string[],
	code?: string
): NextResponse<APIError | PlaceBetResponse> {
	return errorResponse(
		errors.length === 1 ? errors[0] : `${errors[0]} (and ${errors.length - 1} more)`,
		code,
		400
	);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(
	request: NextRequest
): Promise<NextResponse<APIError | PlaceBetResponse>> {
	try {
		// ====== STEP 1: Parse & validate request ======
		let body: any;
		try {
			body = await request.json();
		} catch {
			return errorResponse("Invalid JSON in request body", "INVALID_REQUEST", 400);
		}

		const validation = validateRequest(body);
		if (!validation.isValid) {
			return errorResponse(validation.error!, "INVALID_REQUEST", 400);
		}

		const { txHash, marketId, choice, amount, walletAddress } = validation.data!;

		console.log(`[BET CONFIRM] ${walletAddress.slice(0, 8)}... betting ${amount} USDT on ${choice}`);

		// ====== STEP 2: Fetch market data ======
		const market = await getMarketById(marketId);

		if (!market) {
			return errorResponse(
				"Market not found",
				ERROR_CODES.MARKET_NOT_FOUND,
				404
			);
		}

		if (market.status !== "ACTIVE") {
			return errorResponse(
				VALIDATION_MESSAGES.MARKET.NOT_ACTIVE,
				ERROR_CODES.MARKET_NOT_ACTIVE,
				400
			);
		}

		const now = Date.now();
		const marketEndMs = market.endDate.getTime();

		if (now > marketEndMs) {
			return errorResponse(
				"Market has expired",
				ERROR_CODES.MARKET_NOT_ACTIVE,
				400
			);
		}

		// ====== STEP 3: Validate transaction on-chain ======
		console.log(`[BET CONFIRM] Validating transaction ${txHash} on-chain...`);

		const txValidation = await validateBetTransaction(
			txHash as Hex,
			choice,
			amount
		);

		if (!txValidation.isValid) {
			const errorMsg = formatValidationErrors(txValidation.errors);
			console.error(`[BET CONFIRM] Transaction validation failed: ${errorMsg}`);

			return errorResponse(
				errorMsg || "Transaction validation failed",
				ERROR_CODES.TX_FAILED,
				400
			);
		}

		// Verify decoded data matches what user sent
		if (txValidation.choice !== choice || !txValidation.amount || Math.abs(txValidation.amount - amount) > 0.01) {
			return errorResponse(
				"Decoded transaction data does not match your input",
				"TX_DATA_MISMATCH",
				400
			);
		}

		// ====== STEP 4: Fetch user's existing bets ======
		const userBetCount = await getUserBetCount(walletAddress, marketId);
		const userTotalBets = Number(
			await getUserTotalBetAmount(walletAddress, marketId)
		) / 10 ** BET_LIMITS.USDT_DECIMALS;

		// ====== STEP 5: Get wallet flagging status ======
		const flaggedWallet = await db.flaggedWallet.findUnique({
			where: { wallet: walletAddress },
		}).catch(() => null);

		const isFlagged = flaggedWallet?.isActive || false;

		// ====== STEP 6: Comprehensive bet validation ======
		console.log(`[BET CONFIRM] Validating bet rules...`);

		// Get last bet timestamp
		const userBets = await db.bet.findMany({
			where: { walletAddress, marketId },
			orderBy: { createdAt: "desc" },
			take: 1,
		});

		const lastBetTime = userBets[0]?.createdAt?.getTime() || null;

		// Get recent bet timestamps (last 1 hour)
		const oneHourAgo = new Date(Date.now() - 3600000);
		const recentBets = await db.bet.findMany({
			where: {
				walletAddress,
				marketId,
				createdAt: { gte: oneHourAgo },
			},
		});
		const recentBetTimestamps = recentBets.map((b: typeof recentBets[0]) => b.createdAt.getTime());

		const betValidation = validateBetComprehensive({
			walletAddress,
			choice,
			amount,
			lastBetTimestamp: lastBetTime,
			currentBetCount: userBetCount,
			walletTotalBets: userTotalBets,
			recentBetTimestamps,
			totalYesPool: Number(market.yesPool) / 10 ** BET_LIMITS.USDT_DECIMALS,
			totalNoPool: Number(market.noPool) / 10 ** BET_LIMITS.USDT_DECIMALS,
			marketStatus: market.status,
			marketEndTime: marketEndMs / 1000,
			isFlagged,
		});

		if (!betValidation.isValid) {
			const errorMsg = formatValidationErrors(
				betValidation.errors.map((e) => e.message)
			);
			console.error(`[BET CONFIRM] Bet validation failed: ${errorMsg}`);

			return errorResponse(
				errorMsg,
				betValidation.errors[0]?.code,
				400
			);
		}

		// ====== STEP 7: Validate against contract rules ======
		const contractValidation = validateBetForContract({
			amount,
			choice,
			lastBetTimestamp: lastBetTime,
			currentBetCount: userBetCount,
			walletTotalBets: userTotalBets,
			recentBetTimestamps,
			totalYesPool: Number(market.yesPool) / 10 ** BET_LIMITS.USDT_DECIMALS,
			totalNoPool: Number(market.noPool) / 10 ** BET_LIMITS.USDT_DECIMALS,
			isFlagged,
		});

		if (!contractValidation.isValid) {
			return validationErrorResponse(
				contractValidation.errors.map((e) => e.message),
				contractValidation.errors[0]?.code
			);
		}

		// ====== STEP 8: Insert bet into database ======
		console.log(`[BET CONFIRM] Inserting bet into database...`);

		const amountWei = BigInt(
			Math.floor(amount * 10 ** BET_LIMITS.USDT_DECIMALS)
		);

		const newBetNumber = userBetCount + 1;

		// Create bet record
		const bet = await db.bet.create({
			data: {
				walletAddress,
				marketId,
				choice,
				amount: amountWei,
				betNumber: newBetNumber,
				status: "CONFIRMED",
				txHash,
			},
		});

		// ====== STEP 9: Create audit history ======
		await db.betHistory.create({
			data: {
				betId: bet.id,
				marketId,
				wallet: walletAddress,
				action: "PLACED",
				reason: `Bet placed via transaction ${txHash}`,
			},
		});

		// ====== STEP 10: Update market pools ======
		console.log(`[BET CONFIRM] Updating market pools...`);

		await db.market.update({
			where: { marketId },
			data: {
				...(choice === BetChoice.YES
					? { yesPool: market.yesPool + amountWei }
					: { noPool: market.noPool + amountWei }),
				updatedAt: new Date(),
			},
		});

		// ====== STEP 11: Create pool snapshot ======
		const updatedMarket = await getMarketById(marketId);

		if (updatedMarket) {
			await db.poolSnapshot.create({
				data: {
					marketId,
					yesPool: updatedMarket.yesPool,
					noPool: updatedMarket.noPool,
					totalBets: await db.bet.count({ where: { marketId } }),
				},
			});
		}

		// ====== STEP 12: Return success ======
		console.log(`[BET CONFIRM] ✅ Bet ${bet.id} confirmed successfully`);

		return NextResponse.json(
			{
				success: true,
				betId: bet.id,
				status: "CONFIRMED",
			} as PlaceBetResponse,
			{ status: 200 }
		);
	} catch (error) {
		console.error("[BET CONFIRM] Unexpected error:", error);

		return NextResponse.json(
			{
				success: false,
				error: "An unexpected error occurred while confirming your bet",
				code: "INTERNAL_ERROR",
				timestamp: Date.now(),
			} as APIError,
			{ status: 500 }
		);
	}
}

// ============================================================================
// OPTIONS (CORS)
// ============================================================================

export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
