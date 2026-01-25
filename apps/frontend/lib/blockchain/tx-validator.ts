/**
 * Transaction Validator
 * 
 * Validates PredictionMarket contract transactions:
 * - Decodes function calls from transaction data
 * - Extracts bet parameters from contract interaction
 * - Verifies transaction receipt and events
 * - Validates bet data matches user input
 */

import { Hex, TransactionReceipt } from "viem";
import {
	publicClient,
	validateTransactionOnChain,
	getTransactionDetails,
} from "./viem-client";
import { CONTRACT_ADDRESSES, BET_LIMITS } from "@/lib/config/constants";
import { BetChoice } from "@/lib/types/prediction-market";

// ============================================================================
// PREDICTION MARKET ABI (RELEVANT PARTS)
// ============================================================================

/**
 * Function signatures for decoding
 * placeBet(BetChoice choice, uint256 amount)
 */
const FUNCTION_SELECTORS = {
	PLACE_BET: "0x4cf088d9", // keccak256("placeBet(uint8,uint256)")
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface DecodedBetTransaction {
	isValid: boolean;
	choice?: BetChoice;
	amount?: bigint;
	error?: string;
}

export interface ValidatedBetTransaction {
	isValid: boolean;
	choice?: BetChoice;
	amount?: number; // In USDT
	amountWei?: bigint; // In smallest unit
	txHash: string;
	blockNumber?: number | null;
	receipt?: TransactionReceipt | null;
	gasUsed?: bigint;
	status?: "pending" | "success" | "failed" | "not_found";
	errors: string[];
	warnings: string[];
}

export interface BetTransactionDetails {
	from: string;
	to: string;
	data: string;
	value: bigint;
	gas: bigint;
	gasPrice: bigint;
	gasUsed?: bigint;
	blockNumber?: number;
	status?: "success" | "failed";
}

// ============================================================================
// DECODING FUNCTIONS
// ============================================================================

/**
 * Decode placeBet transaction data
 * Extracts choice and amount from transaction input
 */
export function decodePlaceBetTransaction(
	transactionData: Hex
): DecodedBetTransaction {
	try {
		// Check function selector
		const functionSelector = transactionData.slice(0, 10) as Hex;

		if (functionSelector !== FUNCTION_SELECTORS.PLACE_BET) {
			return {
				isValid: false,
				error: "Not a placeBet transaction",
			};
		}

		// Extract parameters (remove "0x" and function selector)
		const params = transactionData.slice(10);

		if (params.length !== 128) {
			// 2 uint256 params = 64 chars each = 128 chars total
			return {
				isValid: false,
				error: "Invalid transaction data length",
			};
		}

		// Parse choice (first 32 bytes / 64 chars)
		const choiceHex = params.slice(0, 64);
		const choiceBigInt = BigInt(`0x${choiceHex}`);

		// choice should be 0 (YES) or 1 (NO)
		if (choiceBigInt !== 0n && choiceBigInt !== 1n) {
			return {
				isValid: false,
				error: "Invalid bet choice value",
			};
		}

		const choice = choiceBigInt === 0n ? BetChoice.YES : BetChoice.NO;

		// Parse amount (next 32 bytes / 64 chars)
		const amountHex = params.slice(64, 128);
		const amount = BigInt(`0x${amountHex}`);

		// Validate amount is reasonable
		if (amount < BET_LIMITS.MIN_BET_WEI || amount > BET_LIMITS.MAX_BET_WEI) {
			return {
				isValid: false,
				error: `Amount ${amount} outside bet limits`,
			};
		}

		return {
			isValid: true,
			choice,
			amount,
		};
	} catch (error) {
		return {
			isValid: false,
			error: `Failed to decode transaction: ${(error as Error).message}`,
		};
	}
}

/**
 * Validate decoded bet matches user input
 */
export function validateDecodedBet(
	decoded: DecodedBetTransaction,
	userChoice: BetChoice,
	userAmount: number
): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!decoded.isValid || !decoded.choice || !decoded.amount) {
		errors.push("Transaction could not be decoded");
		return { isValid: false, errors };
	}

	// Check choice matches
	if (decoded.choice !== userChoice) {
		errors.push(
			`Bet choice mismatch: transaction has ${decoded.choice}, user selected ${userChoice}`
		);
	}

	// Check amount matches (allow 1 wei tolerance for rounding)
	const expectedAmount = BigInt(userAmount * 10 ** BET_LIMITS.USDT_DECIMALS);
	const amountDiff = decoded.amount > expectedAmount
		? decoded.amount - expectedAmount
		: expectedAmount - decoded.amount;

	if (amountDiff > 1n) {
		errors.push(
			`Bet amount mismatch: transaction has ${decoded.amount}, user input ${expectedAmount}`
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// ============================================================================
// RECEIPT VALIDATION
// ============================================================================

/**
 * Validate transaction receipt
 */
export function validateTransactionReceipt(
	receipt: TransactionReceipt | null | undefined,
	gasLimit?: bigint
): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!receipt) {
		errors.push("No transaction receipt found");
		return { isValid: false, errors };
	}

	// Check status
	if (receipt.status !== "success") {
		errors.push(
			`Transaction reverted or failed (status: ${receipt.status})`
		);
	}

	// Check contract address
	if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESSES.PREDICTION_MARKET.toLowerCase()) {
		errors.push(
			`Transaction was not sent to prediction market contract (received: ${receipt.to})`
		);
	}

	// Check gas usage (shouldn't use all gas)
	if (receipt.gasUsed && gasLimit && receipt.gasUsed > gasLimit * BigInt(95) / BigInt(100)) {
		errors.push("Transaction used suspiciously high amount of gas");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Extract logs from receipt
 */
export function extractReceiptLogs(receipt: TransactionReceipt | null) {
	if (!receipt || !receipt.logs) {
		return [];
	}

	return receipt.logs.map((log) => ({
		address: log.address,
		topics: log.topics,
		data: log.data,
		blockNumber: log.blockNumber,
		transactionIndex: log.transactionIndex,
		logIndex: log.logIndex,
	}));
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Fully validate a bet transaction
 * Comprehensive checks on-chain and locally
 */
export async function validateBetTransaction(
	txHash: Hex,
	userChoice: BetChoice,
	userAmount: number
): Promise<ValidatedBetTransaction> {
	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		// Step 1: Validate on blockchain
		const onChainValidation = await validateTransactionOnChain(txHash);

		if (!onChainValidation.isValid) {
			errors.push(onChainValidation.error || "Transaction failed on-chain");
			return {
				isValid: false,
				txHash,
				status: onChainValidation.status,
				errors,
				warnings,
			};
		}

		const receipt = onChainValidation.receipt;

		// Step 2: Get full transaction details
		const txDetails = await getTransactionDetails(txHash);

		if (!txDetails || !txDetails.data) {
			errors.push("Could not retrieve transaction data");
			return {
				isValid: false,
				txHash,
				receipt,
				blockNumber: onChainValidation.blockNumber || undefined,
				status: "success",
				errors,
				warnings,
			};
		}

		// Step 3: Validate receipt with gas limit
		const receiptValidation = validateTransactionReceipt(receipt, txDetails.gas);
		errors.push(...receiptValidation.errors);

		if (!receiptValidation.isValid) {
			return {
				isValid: false,
				txHash,
				receipt,
				blockNumber: onChainValidation.blockNumber || undefined,
				status: "failed",
				errors,
				warnings,
			};
		}

		// Step 4: Decode bet parameters
		const decoded = decodePlaceBetTransaction(txDetails.data);

		if (!decoded.isValid) {
			errors.push(decoded.error || "Could not decode bet transaction");
			return {
				isValid: false,
				txHash,
				receipt,
				blockNumber: onChainValidation.blockNumber || undefined,
				status: "success",
				errors,
				warnings,
			};
		}

		// Step 5: Validate decoded data matches user input
		const decodeValidation = validateDecodedBet(decoded, userChoice, userAmount);
		errors.push(...decodeValidation.errors);

		// Convert amount to USDT (from wei)
		const amountUsdt = Number(decoded.amount) / 10 ** BET_LIMITS.USDT_DECIMALS;

		// Step 6: Check gas usage for warnings
		if (txDetails.gasUsed && txDetails.gasPrice) {
			const gasCost = txDetails.gasUsed * txDetails.gasPrice;
			const gasCostUsdt = Number(gasCost) / 10 ** 18; // CRO to native

			// Warn if gas cost is more than 1% of bet amount
			if (gasCostUsdt > amountUsdt * 0.01) {
				warnings.push(
					`High gas cost (~${gasCostUsdt.toFixed(4)} CRO)`
				);
			}
		}

		// Step 7: Check confirmations
		if (receipt && txDetails.blockNumber) {
			const currentBlock = await publicClient.getBlockNumber();
			const confirmations = currentBlock - receipt.blockNumber;

			if (confirmations < 1) {
				warnings.push("Transaction not yet confirmed");
			} else if (confirmations < 3) {
				warnings.push(`Only ${confirmations} confirmation(s)`);
			}
		}

		return {
			isValid: errors.length === 0,
			choice: decoded.choice,
			amount: amountUsdt,
			amountWei: decoded.amount,
			txHash,
			blockNumber: onChainValidation.blockNumber,
			receipt,
			gasUsed: txDetails.gasUsed,
			status: "success",
			errors,
			warnings,
		};
	} catch (error) {
		errors.push(
			`Unexpected error validating transaction: ${(error as Error).message}`
		);

		return {
			isValid: false,
			txHash,
			status: "not_found",
			errors,
			warnings,
		};
	}
}

/**
 * Quick validation (fast checks only)
 * For immediate feedback before full validation
 */
export async function quickValidateTransaction(
	txHash: Hex
): Promise<{
	isValid: boolean;
	status: "pending" | "success" | "failed" | "not_found";
	confirmations?: number;
	error?: string;
}> {
	try {
		const validation = await validateTransactionOnChain(txHash);

		if (!validation.isValid) {
			return {
				isValid: false,
				status: validation.status,
				error: validation.error,
			};
		}

		// Get confirmation count
		let confirmations = 0;
		if (validation.receipt) {
			const currentBlock = await publicClient.getBlockNumber();
			confirmations = Number(currentBlock) - Number(validation.receipt.blockNumber);
		}

		return {
			isValid: true,
			status: "success",
			confirmations,
		};
	} catch (error) {
		return {
			isValid: false,
			status: "not_found",
			error: (error as Error).message,
		};
	}
}

/**
 * Monitor transaction until confirmed or failed
 */
export async function monitorTransaction(
	txHash: Hex,
	userChoice: BetChoice,
	userAmount: number,
	onProgress?: (status: string, confirmations: number) => void,
	maxWaitTime: number = 300000 // 5 minutes
): Promise<ValidatedBetTransaction> {
	const startTime = Date.now();

	return new Promise((resolve) => {
		const checkTransaction = async () => {
			// Check timeout
			if (Date.now() - startTime > maxWaitTime) {
				resolve({
					isValid: false,
					txHash,
					status: "not_found",
					errors: ["Transaction did not confirm within 5 minutes"],
					warnings: [],
				});
				return;
			}

			try {
				const validation = await validateTransactionOnChain(txHash);

				if (!validation.isValid) {
					if (validation.status === "pending") {
						// Still pending, check again
						if (validation.receipt && onProgress) {
							const currentBlock = await publicClient.getBlockNumber();
							const confirmations = Number(currentBlock) - Number(validation.receipt.blockNumber);
							onProgress("pending", confirmations);
						} else if (onProgress) {
							onProgress("pending", 0);
						}

						setTimeout(checkTransaction, 3000);
						return;
					} else {
						// Failed or not found
						resolve({
							isValid: false,
							txHash,
							status: validation.status,
							errors: [validation.error || "Transaction failed"],
							warnings: [],
						});
						return;
					}
				}

				// Transaction successful, do full validation
				if (onProgress) {
					const currentBlock = await publicClient.getBlockNumber();
					const confirmations = Number(currentBlock) - Number(validation.receipt?.blockNumber || 0);
					onProgress("validating", confirmations);
				}

				const result = await validateBetTransaction(txHash, userChoice, userAmount);
				resolve(result);
			} catch (error) {
				if (Date.now() - startTime > maxWaitTime) {
					resolve({
						isValid: false,
						txHash,
						status: "not_found",
						errors: ["Timeout waiting for transaction"],
						warnings: [],
					});
				} else {
					setTimeout(checkTransaction, 3000);
				}
			}
		};

		checkTransaction();
	});
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format validation errors for user display
 */
export function formatValidationErrors(errors: string[]): string {
	if (errors.length === 0) return "";
	if (errors.length === 1) return errors[0];
	return `${errors[0]} (+ ${errors.length - 1} more errors)`;
}

/**
 * Get user-friendly message for transaction status
 */
export function getTransactionStatusMessage(
	status: "pending" | "success" | "failed" | "not_found"
): string {
	const messages = {
		pending: "Transaction is pending. Please wait...",
		success: "Transaction confirmed!",
		failed: "Transaction failed on-chain.",
		not_found: "Transaction not found on-chain.",
	};

	return messages[status];
}
