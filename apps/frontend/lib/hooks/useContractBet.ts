/**
 * useContractBet Hook
 * 
 * Manages the complete bet placement lifecycle:
 * 1. Check USDT approval
 * 2. Request approval if needed (user signs)
 * 3. Place bet on contract (user signs)
 * 4. Monitor transaction on blockchain
 * 5. Confirm bet via API
 * 6. Handle errors and retries
 * 
 * Usage:
 * const { placeBet, isPending, isConfirming, error, txHash } = useContractBet();
 * 
 * // User clicks "Place Bet"
 * await placeBet(BetChoice.YES, 100, marketId);
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, Hex, isAddress } from "viem";
import { BetChoice } from "@/lib/types/prediction-market";
import { BET_LIMITS, ERROR_CODES } from "@/lib/config/constants";
import {
	validateBetClientSide,
	getCooldownRemaining,
	getRemainigBetsAllowed,
	calculateWalletPoolPercent,
} from "@/lib/validation/bet-rules";
import { monitorTransaction } from "@/lib/blockchain/tx-validator";
import { CONTRACT_ADDRESSES } from "@/lib/config/constants";

// ============================================================================
// TYPES
// ============================================================================

export interface UseContractBetState {
	isPending: boolean; // Transaction pending on blockchain
	isConfirming: boolean; // API confirmation in progress
	isApproving: boolean; // USDT approval pending
	error: string | null;
	errorCode: string | null;
	txHash: string | null;
	status: "idle" | "approval" | "pending" | "confirming" | "success" | "error";
}

export interface UseContractBetActions {
	placeBet: (
		choice: BetChoice,
		amount: number,
		marketId: string
	) => Promise<{ success: boolean; betId?: string }>;
	approveUSDT: () => Promise<boolean>;
	reset: () => void;
}

export type UseContractBetReturn = UseContractBetState & UseContractBetActions;

// ============================================================================
// LOGGER
// ============================================================================

interface LogContext {
	choice?: string;
	amount?: number;
	marketId?: string;
	txHash?: string;
	error?: string;
	stage?: string;
	duration?: number;
	status?: string;
	confirmations?: number;
	betId?: string;
	attempt?: number;
	maxRetries?: number;
	elapsed?: number;
}

function logInfo(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [useContractBet] ${message}`, context);
}

function logError(message: string, context: Partial<LogContext>) {
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] [useContractBet] ❌ ${message}`, context);

	// TODO: Integrate with Sentry
	// if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
	//   Sentry.captureException(new Error(message), { extra: context });
	// }
}

// ============================================================================
// HOOK
// ============================================================================

export function useContractBet(): UseContractBetReturn {
	const { address: userAddress } = useAccount();
	const publicClient = usePublicClient();
	const { data: walletClient } = useWalletClient();

	// State
	const [state, setState] = useState<UseContractBetState>({
		isPending: false,
		isConfirming: false,
		isApproving: false,
		error: null,
		errorCode: null,
		txHash: null,
		status: "idle",
	});

	// Refs for cleanup
	const abortRef = useRef<AbortController | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (abortRef.current) {
				abortRef.current.abort();
			}
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// ====== Helper: Reset state ======
	const reset = useCallback(() => {
		setState({
			isPending: false,
			isConfirming: false,
			isApproving: false,
			error: null,
			errorCode: null,
			txHash: null,
			status: "idle",
		});
	}, []);

	// ====== Helper: Set error ======
	const setError = useCallback((message: string, code?: string) => {
		setState((prev) => ({
			...prev,
			error: message,
			errorCode: code || null,
			status: "error",
		}));
	}, []);

	// ====== Helper: Validate inputs ======
	const validateInputs = useCallback(
		(
			choice: unknown,
			amount: unknown,
			marketId: unknown
		): { isValid: boolean; error?: string } => {
			if (!userAddress) {
				return { isValid: false, error: "Wallet not connected" };
			}

			if (choice !== BetChoice.YES && choice !== BetChoice.NO) {
				return { isValid: false, error: "Invalid bet choice" };
			}

			if (typeof amount !== "number" || amount <= 0) {
				return { isValid: false, error: "Invalid bet amount" };
			}

			if (!marketId || typeof marketId !== "string") {
				return { isValid: false, error: "Invalid market ID" };
			}

			return { isValid: true };
		},
		[userAddress]
	);

	// ====== USDT Approval ======
	const approveUSDT = useCallback(async (): Promise<boolean> => {
		const startTime = Date.now();

		try {
			if (!userAddress || !walletClient) {
				setError("Wallet not connected", ERROR_CODES.WALLET_NOT_CONNECTED);
				return false;
			}

			setState((prev) => ({
				...prev,
				isApproving: true,
				status: "approval",
				error: null,
				errorCode: null,
			}));

			logInfo("Requesting USDT approval", { stage: "approval" });

			// Create abort controller for this operation
			abortRef.current = new AbortController();

			// Build approval transaction
			// This would use a contract write to call ERC20.approve()
			// For now, placeholder showing the pattern

			const approvalTxHash = await walletClient.writeContract({
				address: CONTRACT_ADDRESSES.USDT as Hex,
				abi: [
					{
						name: "approve",
						type: "function",
						inputs: [
							{ name: "spender", type: "address" },
							{ name: "amount", type: "uint256" },
						],
						outputs: [{ name: "", type: "bool" }],
					},
				],
				functionName: "approve",
				args: [
					CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
					BigInt(
						BET_LIMITS.MAX_BET *
							10 ** BET_LIMITS.USDT_DECIMALS
					),
				],
				account: userAddress,
			});

			logInfo("Approval transaction sent", {
				stage: "approval",
				txHash: approvalTxHash,
			});

			// Wait for confirmation with proper delays
			const maxWaitTime = 60000; // 1 minute
			const pollInterval = 3000; // 3 seconds
			const startWait = Date.now();

			// Initial delay to let transaction propagate
			await new Promise((resolve) => setTimeout(resolve, 2000));

			while (Date.now() - startWait < maxWaitTime) {
				if (abortRef.current?.signal.aborted) {
					logError("Approval cancelled", { stage: "approval" });
					return false;
				}

				try {
					const receipt = await publicClient?.getTransactionReceipt({
						hash: approvalTxHash,
					});

					if (receipt) {
						if (receipt.status === "success") {
							const duration = Date.now() - startTime;
							logInfo("✅ USDT approval confirmed", {
								stage: "approval",
								duration,
							});

							setState((prev) => ({
								...prev,
								isApproving: false,
							}));

							return true;
						} else {
							setError(
								"Approval transaction failed",
								ERROR_CODES.TX_FAILED
							);
							return false;
						}
					}
				} catch (receiptError) {
					// Receipt not found yet, continue polling
					logInfo("Waiting for approval confirmation...", {
						stage: "approval",
						elapsed: Date.now() - startWait,
					});
				}

				await new Promise((resolve) =>
					setTimeout(resolve, pollInterval)
				);
			}

			setError(
				"Approval transaction timeout",
				ERROR_CODES.TX_TIMEOUT
			);
			return false;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Approval failed";
			logError("Approval error", {
				stage: "approval",
				error: message,
			});
			setError(message, ERROR_CODES.APPROVAL_REQUIRED);
			return false;
		} finally {
			setState((prev) => ({
				...prev,
				isApproving: false,
			}));
		}
	}, [userAddress, walletClient, publicClient, setError]);

	// ====== Main: Place Bet ======
	const placeBet = useCallback(
		async (
			choice: BetChoice,
			amount: number,
			marketId: string
		): Promise<{ success: boolean; betId?: string }> => {
			const startTime = Date.now();

			try {
				// ====== STEP 1: Validate inputs ======
				const inputValidation = validateInputs(choice, amount, marketId);
				if (!inputValidation.isValid) {
					setError(inputValidation.error || "Invalid input");
					return { success: false };
				}

				logInfo("Bet placement started", {
					choice,
					amount,
					marketId,
				});

				// ====== STEP 2: Client-side validation ======
				// TODO: Fetch user's actual stats from API
				const clientValidation = validateBetClientSide({
					amount,
					cooldownRemaining: 0, // Would fetch from user state
					betCount: 0, // Would fetch from user state
					walletExposurePercent: 0, // Would calculate from market state
				});

				if (!clientValidation.isValid) {
					const errorMsg = clientValidation.errors[0].message;
					setError(errorMsg, clientValidation.errors[0].code);
					return { success: false };
				}

				// ====== STEP 3: Set pending state ======
				setState((prev) => ({
					...prev,
					isPending: true,
					status: "pending",
					error: null,
					errorCode: null,
					txHash: null,
				}));

				// ====== STEP 4: Call contract placeBet ======
				if (!userAddress || !walletClient) {
					setError(
						"Wallet not connected",
						ERROR_CODES.WALLET_NOT_CONNECTED
					);
					return { success: false };
				}

				logInfo("Calling placeBet on contract", {
					choice,
					amount,
					marketId,
				});

				const amountWei = BigInt(
					amount * 10 ** BET_LIMITS.USDT_DECIMALS
				);

				const txHash = await walletClient.writeContract({
					address: CONTRACT_ADDRESSES.PREDICTION_MARKET as Hex,
					abi: [
						{
							name: "placeBet",
							type: "function",
							inputs: [
								{ name: "choice", type: "uint8" },
								{ name: "amount", type: "uint256" },
							],
							outputs: [],
							stateMutability: "nonpayable",
						},
					],
					functionName: "placeBet",
					args: [choice === BetChoice.YES ? 0 : 1, amountWei],
					account: userAddress,
				});

				setState((prev) => ({
					...prev,
					txHash,
				}));

				logInfo("Bet transaction sent", { txHash, choice, amount });

				// ====== STEP 5: Monitor transaction ======
				logInfo("Monitoring transaction on blockchain", { txHash });

				const monitorResult = await monitorTransaction(
					txHash,
					choice,
					amount,
					(status, confirmations) => {
						logInfo("Transaction progress", {
							txHash,
							status,
							confirmations,
						});
					}
				);

				if (!monitorResult.isValid) {
					setError(
						monitorResult.errors[0] || "Transaction failed",
						ERROR_CODES.TX_FAILED
					);
					return { success: false };
				}

				logInfo("✅ Transaction confirmed on blockchain", {
					txHash,
					confirmations: 1,
				});

				// ====== STEP 6: Confirm via API ======
				setState((prev) => ({
					...prev,
					isPending: false,
					isConfirming: true,
					status: "confirming",
				}));

				logInfo("Confirming bet via API", {
					txHash,
					choice,
					amount,
					marketId,
				});

				const confirmResponse = await fetch("/api/bets/confirm", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						txHash,
						marketId,
						choice,
						amount,
						walletAddress: userAddress,
					}),
					signal: abortRef.current?.signal,
				});

				if (!confirmResponse.ok) {
					const errorData = await confirmResponse.json();
					setError(
						errorData.error || "Bet confirmation failed",
						errorData.code
					);
					return { success: false };
				}

				const confirmData = await confirmResponse.json();

				if (!confirmData.success) {
					setError(
						confirmData.error || "Bet confirmation failed",
						confirmData.code
					);
					return { success: false };
				}

				// ====== STEP 7: Success ======
				const duration = Date.now() - startTime;

				setState((prev) => ({
					...prev,
					isConfirming: false,
					status: "success",
					error: null,
					errorCode: null,
				}));

				logInfo("✅ Bet placed successfully", {
					choice,
					amount,
					marketId,
					txHash,
					betId: confirmData.betId,
					duration,
				});

				return {
					success: true,
					betId: confirmData.betId,
				};
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Unknown error placing bet";

				logError("Unexpected error placing bet", {
					choice,
					amount,
					marketId,
					error: message,
				});

				setError(message, ERROR_CODES.UNKNOWN_ERROR);

				// TODO: Report to Sentry
				// if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
				//   Sentry.captureException(error);
				// }

				return { success: false };
			}
		},
		[userAddress, walletClient, validateInputs, setError]
	);

	return {
		// State
		isPending: state.isPending,
		isConfirming: state.isConfirming,
		isApproving: state.isApproving,
		error: state.error,
		errorCode: state.errorCode,
		txHash: state.txHash,
		status: state.status,

		// Actions
		placeBet,
		approveUSDT,
		reset,
	};
}

// ============================================================================
// CUSTOM ERROR HANDLER
// ============================================================================

/**
 * Helper to display user-friendly error messages
 */
export function getErrorMessage(
	error: string,
	code: string | null
): string {
	if (code && code in ERROR_CODES) {
		// Return specific error message based on code
		const messages: Record<string, string> = {
			[ERROR_CODES.WALLET_NOT_CONNECTED]: "Please connect your wallet",
			[ERROR_CODES.WRONG_NETWORK]: "Please switch to Cronos network",
			[ERROR_CODES.INSUFFICIENT_BALANCE]: "Insufficient USDT balance",
			[ERROR_CODES.APPROVAL_REQUIRED]: "Please approve USDT spending",
			[ERROR_CODES.TX_FAILED]: "Transaction failed on blockchain",
			[ERROR_CODES.TX_TIMEOUT]: "Transaction took too long",
			[ERROR_CODES.MARKET_NOT_ACTIVE]: "Market is not accepting bets",
		};

		return messages[code] || error;
	}

	return error;
}

// ============================================================================
// RETRY HELPER
// ============================================================================

/**
 * Retry failed transaction confirmation
 */
export async function retryBetConfirmation(
	txHash: string,
	choice: BetChoice,
	amount: number,
	marketId: string,
	userAddress: string,
	maxRetries: number = 3
): Promise<{ success: boolean; betId?: string }> {
	let lastError: any;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			logInfo("Retrying bet confirmation", {
				txHash,
				attempt,
				maxRetries,
			});

			const response = await fetch("/api/bets/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					txHash,
					marketId,
					choice,
					amount,
					walletAddress: userAddress,
				}),
			});

			const data = await response.json();

			if (data.success) {
				logInfo("✅ Retry successful", {
					txHash,
					attempt,
					betId: data.betId,
				});
				return { success: true, betId: data.betId };
			}

			lastError = data;

			if (attempt < maxRetries) {
				// Exponential backoff
				const delay = Math.pow(2, attempt - 1) * 1000;
				await new Promise((resolve) =>
					setTimeout(resolve, delay)
				);
			}
		} catch (error) {
			lastError = error;

			if (attempt < maxRetries) {
				const delay = Math.pow(2, attempt - 1) * 1000;
				await new Promise((resolve) =>
					setTimeout(resolve, delay)
				);
			}
		}
	}

	logError("All retry attempts failed", {
		txHash,
		maxRetries,
		error: lastError?.message,
	});

	return {
		success: false,
	};
}
