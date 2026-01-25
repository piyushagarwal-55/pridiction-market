/**
 * useCasinoBet Hook
 * 
 * Manages casino betting lifecycle:
 * 1. Check USDT approval
 * 2. Request approval if needed
 * 3. Place bet on casino contract
 * 4. Monitor transaction
 * 5. Handle all edge cases
 * 
 * Supports all casino games:
 * - Roulette (0-36, 35:1 payout)
 * - Dice (1-6, 5:1 payout)
 * - Coin Flip (Heads/Tails, 1.95:1 payout)
 * - High/Low (Over/Under 3.5, 1.9:1 payout)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, Hex, formatUnits, decodeEventLog } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/config/constants";

// ============================================================================
// TYPES
// ============================================================================

export enum CasinoGame {
	ROULETTE = 0,
	DICE = 1,
	COIN_FLIP = 2,
	HIGH_LOW_DICE = 3,
}

export enum GameResult {
	WIN = 0,
	LOSS = 1,
}

export interface CasinoBetState {
	isPending: boolean;
	isConfirming: boolean;
	isApproving: boolean;
	error: string | null;
	errorCode: string | null;
	txHash: string | null;
	betId: string | null;
	result: {
		outcome: GameResult | null;
		payout: string | null;
		randomNumber: number | null;
	} | null;
	status: "idle" | "approval" | "pending" | "confirming" | "success" | "error";
}

export interface CasinoBetActions {
	placeBet: (
		game: CasinoGame,
		amount: number,
		prediction: number
	) => Promise<{ success: boolean; betId?: string; result?: any }>;
	approveUSDT: () => Promise<boolean>;
	reset: () => void;
}

export type UseCasinoBetReturn = CasinoBetState & CasinoBetActions;

// ============================================================================
// GAME LIMITS & CONFIG
// ============================================================================

const GAME_LIMITS = {
	[CasinoGame.ROULETTE]: { min: 1, max: 100, predictions: { min: 0, max: 36 } },
	[CasinoGame.DICE]: { min: 1, max: 200, predictions: { min: 1, max: 6 } },
	[CasinoGame.COIN_FLIP]: { min: 1, max: 500, predictions: { min: 0, max: 1 } },
	[CasinoGame.HIGH_LOW_DICE]: { min: 1, max: 1000, predictions: { min: 0, max: 1 } },
};

const GAME_NAMES = {
	[CasinoGame.ROULETTE]: "Roulette",
	[CasinoGame.DICE]: "Dice",
	[CasinoGame.COIN_FLIP]: "Coin Flip",
	[CasinoGame.HIGH_LOW_DICE]: "High/Low Dice",
};

const COOLDOWN_SECONDS = 3;

// ============================================================================
// ABI
// ============================================================================

const CASINO_ABI = [
	{
		inputs: [
			{ name: "_gameType", type: "uint8" },
			{ name: "_amount", type: "uint256" },
			{ name: "_prediction", type: "uint256" },
		],
		name: "placeBet",
		outputs: [{ name: "betId", type: "uint256" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ name: "_player", type: "address" }],
		name: "lastBetTimestamp",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, name: "player", type: "address" },
			{ indexed: true, name: "betId", type: "uint256" },
			{ indexed: false, name: "gameType", type: "uint8" },
			{ indexed: false, name: "prediction", type: "uint256" },
			{ indexed: false, name: "result", type: "uint256" },
			{ indexed: false, name: "outcome", type: "uint8" },
			{ indexed: false, name: "payout", type: "uint256" },
		],
		name: "BetResult",
		type: "event",
	},
] as const;

const USDT_ABI = [
	{
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		name: "approve",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		name: "allowance",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ name: "account", type: "address" }],
		name: "balanceOf",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

// ============================================================================
// LOGGER
// ============================================================================

function logInfo(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [useCasinoBet] ${message}`, context || "");
}

function logError(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] [useCasinoBet] ❌ ${message}`, context || "");
}

// ============================================================================
// HOOK
// ============================================================================

export function useCasinoBet(): UseCasinoBetReturn {
	const { address: userAddress } = useAccount();
	const publicClient = usePublicClient();
	const { data: walletClient } = useWalletClient();

	const [state, setState] = useState<CasinoBetState>({
		isPending: false,
		isConfirming: false,
		isApproving: false,
		error: null,
		errorCode: null,
		txHash: null,
		betId: null,
		result: null,
		status: "idle",
	});

	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			if (abortRef.current) {
				abortRef.current.abort();
			}
		};
	}, []);

	// ====== Reset ======
	const reset = useCallback(() => {
		setState({
			isPending: false,
			isConfirming: false,
			isApproving: false,
			error: null,
			errorCode: null,
			txHash: null,
			betId: null,
			result: null,
			status: "idle",
		});
	}, []);

	// ====== Set Error ======
	const setError = useCallback((message: string, code?: string) => {
		setState((prev) => ({
			...prev,
			error: message,
			errorCode: code || null,
			status: "error",
			isPending: false,
			isConfirming: false,
			isApproving: false,
		}));
	}, []);

	// ====== Validate Inputs ======
	const validateInputs = useCallback(
		(game: CasinoGame, amount: number, prediction: number): { isValid: boolean; error?: string } => {
			if (!userAddress) {
				return { isValid: false, error: "Wallet not connected" };
			}

			if (!Object.values(CasinoGame).includes(game)) {
				return { isValid: false, error: "Invalid game type" };
			}

			const limits = GAME_LIMITS[game];

			if (amount < limits.min) {
				return { isValid: false, error: `Minimum bet is ${limits.min} USDT` };
			}

			if (amount > limits.max) {
				return { isValid: false, error: `Maximum bet is ${limits.max} USDT for ${GAME_NAMES[game]}` };
			}

			if (prediction < limits.predictions.min || prediction > limits.predictions.max) {
				return {
					isValid: false,
					error: `Invalid prediction for ${GAME_NAMES[game]}. Must be ${limits.predictions.min}-${limits.predictions.max}`,
				};
			}

			return { isValid: true };
		},
		[userAddress]
	);

	// ====== Check USDT Balance ======
	const checkBalance = useCallback(
		async (amount: number): Promise<boolean> => {
			if (!publicClient || !userAddress) return false;

			try {
				const balance = (await publicClient.readContract({
					address: CONTRACT_ADDRESSES.USDT as Hex,
					abi: USDT_ABI,
					functionName: "balanceOf",
					args: [userAddress],
				})) as bigint;

				const amountWei = parseUnits(amount.toString(), 6);
				return balance >= amountWei;
			} catch (error) {
				logError("Failed to check balance", error);
				return false;
			}
		},
		[publicClient, userAddress]
	);

	// ====== Check Cooldown ======
	const checkCooldown = useCallback(async (): Promise<{ canBet: boolean; remaining: number }> => {
		if (!publicClient || !userAddress) return { canBet: false, remaining: 0 };

		try {
			const lastBetTime = (await publicClient.readContract({
				address: CONTRACT_ADDRESSES.CASINO as Hex,
				abi: CASINO_ABI,
				functionName: "lastBetTimestamp",
				args: [userAddress],
			})) as bigint;

			const now = Math.floor(Date.now() / 1000);
			const lastBet = Number(lastBetTime);
			const timeSince = now - lastBet;
			const remaining = Math.max(0, COOLDOWN_SECONDS - timeSince);

			return { canBet: remaining === 0, remaining };
		} catch (error) {
			logError("Failed to check cooldown", error);
			return { canBet: true, remaining: 0 };
		}
	}, [publicClient, userAddress]);

	// ====== Approve USDT ======
	const approveUSDT = useCallback(async (): Promise<boolean> => {
		if (!userAddress || !walletClient) {
			setError("Wallet not connected");
			return false;
		}

		setState((prev) => ({ ...prev, isApproving: true, status: "approval", error: null }));

		try {
			logInfo("Requesting USDT approval");

			const hash = await walletClient.writeContract({
				address: CONTRACT_ADDRESSES.USDT as Hex,
				abi: USDT_ABI,
				functionName: "approve",
				args: [CONTRACT_ADDRESSES.CASINO as Hex, BigInt("1000000000000")], // Approve 1M USDT
			});

			logInfo("Waiting for approval confirmation", { hash });

			if (!publicClient) {
				setError("Public client not available");
				return false;
			}

			const receipt = await publicClient.waitForTransactionReceipt({ hash });

			if (receipt.status === "success") {
				setState((prev) => ({ ...prev, isApproving: false, status: "idle" }));
				logInfo("USDT approved successfully");
				return true;
			} else {
				setError("Approval transaction failed");
				return false;
			}
		} catch (error: any) {
			logError("Approval error", error);
			setError(error.message || "Failed to approve USDT");
			return false;
		}
	}, [userAddress, walletClient, publicClient, setError]);

	// ====== Place Bet ======
	const placeBet = useCallback(
		async (
			game: CasinoGame,
			amount: number,
			prediction: number
		): Promise<{ success: boolean; betId?: string; result?: any }> => {
			const startTime = Date.now();

			// Validate inputs
			const validation = validateInputs(game, amount, prediction);
			if (!validation.isValid) {
				setError(validation.error!);
				return { success: false };
			}

			if (!walletClient || !publicClient) {
				setError("Wallet not connected");
				return { success: false };
			}

			// Check balance
			const hasBalance = await checkBalance(amount);
			if (!hasBalance) {
				setError(`Insufficient USDT balance. Need ${amount} USDT`);
				return { success: false };
			}

			// Check cooldown
			const { canBet, remaining } = await checkCooldown();
			if (!canBet) {
				setError(`Please wait ${remaining} seconds before next bet`);
				return { success: false };
			}

			// Check allowance
			try {
				const allowance = (await publicClient.readContract({
					address: CONTRACT_ADDRESSES.USDT as Hex,
					abi: USDT_ABI,
					functionName: "allowance",
					args: [userAddress as `0x${string}`, CONTRACT_ADDRESSES.CASINO as Hex],
				})) as bigint;

				const amountWei = parseUnits(amount.toString(), 6);

				if (allowance < amountWei) {
					setError("Please approve USDT spending first");
					return { success: false };
				}
			} catch (error) {
				logError("Failed to check allowance", error);
				setError("Failed to check USDT approval");
				return { success: false };
			}

			setState((prev) => ({ ...prev, isPending: true, status: "pending", error: null }));

			try {
				logInfo("Placing casino bet", { game: GAME_NAMES[game], amount, prediction });

				const amountWei = parseUnits(amount.toString(), 6);

				const hash = await walletClient.writeContract({
					address: CONTRACT_ADDRESSES.CASINO as Hex,
					abi: CASINO_ABI,
					functionName: "placeBet",
					args: [game, amountWei, BigInt(prediction)],
				});

				setState((prev) => ({ ...prev, txHash: hash, isConfirming: true, isPending: false }));

				logInfo("Waiting for bet confirmation", { hash });

				const receipt = await publicClient.waitForTransactionReceipt({ hash });

				if (receipt.status === "success") {
					// Parse logs to get bet result using viem's decodeEventLog
					let betId: string | null = null;
					let resultData: any = null;

					// Find BetResult event in logs
					for (const log of receipt.logs) {
						// Check if this is from our casino contract
						if (log.address.toLowerCase() === CONTRACT_ADDRESSES.CASINO.toLowerCase()) {
							try {
								// Decode the BetResult event
								const decoded = decodeEventLog({
									abi: CASINO_ABI,
									data: log.data,
									topics: log.topics,
								});

								if (decoded.eventName === "BetResult") {
									const args = decoded.args as any;
									
									resultData = {
										outcome: Number(args.outcome), // 0 = WIN, 1 = LOSS
										payout: args.payout > 0n ? (Number(args.payout) / 1000000).toFixed(2) : null,
										randomNumber: Number(args.result),
									};
									
									betId = args.betId?.toString() || null;
									
									logInfo("Bet result decoded", resultData);
									break;
								}
							} catch (parseError) {
								logError("Failed to decode bet result", parseError);
							}
						}
					}

					const duration = Date.now() - startTime;
					logInfo("Bet placed successfully", { betId, duration, result: resultData });

					setState((prev) => ({
						...prev,
						status: "success",
						isConfirming: false,
						betId,
						result: resultData,
					}));

					return { success: true, betId: betId || undefined, result: resultData };
				} else {
					setError("Bet transaction failed");
					return { success: false };
				}
			} catch (error: any) {
				logError("Bet placement error", error);
				setError(error.message || "Failed to place bet");
				return { success: false };
			}
		},
		[userAddress, walletClient, publicClient, validateInputs, checkBalance, checkCooldown, setError]
	);

	return {
		// State
		...state,
		// Actions
		placeBet,
		approveUSDT,
		reset,
	};
}

// ============================================================================
// HELPER: Get Error Message
// ============================================================================

export function getCasinoErrorMessage(error: string | null, errorCode: string | null): string {
	if (!error) return "";

	// Cooldown errors
	if (error.includes("Cooldown")) {
		return "⏳ Please wait a few seconds between bets";
	}

	// Balance errors
	if (error.includes("Insufficient USDT") || error.includes("balance")) {
		return "💰 Insufficient USDT balance. Mint some test USDT first!";
	}

	// Approval errors
	if (error.includes("approve") || error.includes("allowance")) {
		return "🔐 Please approve USDT spending for the casino";
	}

	// Bet limit errors
	if (error.includes("minimum") || error.includes("minimum")) {
		return error;
	}

	if (error.includes("maximum") || error.includes("max")) {
		return error;
	}

	// House balance errors
	if (error.includes("house balance")) {
		return "🏦 Casino is low on funds. Try a smaller bet or different game.";
	}

	// Network errors
	if (error.includes("network") || error.includes("timeout")) {
		return "🌐 Network error. Please try again.";
	}

	// User rejection
	if (error.includes("rejected") || error.includes("denied")) {
		return "❌ Transaction rejected by user";
	}

	return error;
}
