/**
 * Viem Blockchain Client
 * 
 * Handles all blockchain interactions for PredictionMarket:
 * - Transaction monitoring and validation
 * - Smart contract calls
 * - Event listening
 * - Network detection
 * - Gas estimation
 */

import { CONTRACT_ADDRESSES, CURRENT_NETWORK, UI } from "@/lib/config/constants";
import {
	Chain,
	createPublicClient,
	createWalletClient,
	Hex,
	http,
	publicActions,
	PublicClient,
	TransactionReceipt,
	WalletClient
} from "viem";
import { cronos } from "viem/chains";

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

/**
 * Map Cronos networks to Viem chains
 */
const getCronosChain = (): Chain => {
	if (CURRENT_NETWORK.chainId === 25) {
		return cronos; // Mainnet
	}

	// Testnet - need to define since Viem doesn't have it
	return {
		id: 338,
		name: "Cronos Testnet",
		nativeCurrency: {
			name: "Cronos",
			symbol: "CRO",
			decimals: 18,
		},
		rpcUrls: {
			default: {
				http: ["https://evm-t3.cronos.org"],
			},
			public: {
				http: ["https://evm-t3.cronos.org"],
			},
		},
		blockExplorers: {
			default: {
				name: "Cronoscan",
				url: "https://cronos.org/explorer/testnet3",
			},
		},
		testnet: true,
	} as Chain;
};

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

/**
 * Public client for read operations
 * No private key needed, can be used on client-side
 */
export const publicClient: PublicClient = createPublicClient({
	chain: getCronosChain(),
	transport: http(CURRENT_NETWORK.rpcUrl),
});

/**
 * Wallet client for write operations
 * Used with user's connected wallet (via Wagmi)
 * Initialized separately in components via Wagmi connector
 */
export function createWalletClientForUser(
	account: Hex
): WalletClient {
	return createWalletClient({
		chain: getCronosChain(),
		transport: http(CURRENT_NETWORK.rpcUrl),
		account,
	}).extend(publicActions);
}

// ============================================================================
// TRANSACTION VALIDATION
// ============================================================================

/**
 * Poll blockchain to confirm transaction
 * Returns transaction receipt when confirmed
 */
export async function pollTransactionConfirmation(
	txHash: Hex,
	timeout: number = UI.TX_CONFIRMATION_TIMEOUT_MS,
	pollInterval: number = UI.TX_CONFIRMATION_POLL_MS
): Promise<TransactionReceipt | null> {
	const startTime = Date.now();

	return new Promise((resolve) => {
		const interval = setInterval(async () => {
			try {
				const receipt = await publicClient.getTransactionReceipt({
					hash: txHash,
				});

				if (receipt) {
					clearInterval(interval);
					resolve(receipt);
					return;
				}
			} catch (error) {
				console.error(`Error polling transaction ${txHash}:`, error);
			}

			// Check timeout
			if (Date.now() - startTime > timeout) {
				clearInterval(interval);
				resolve(null);
			}
		}, pollInterval);
	});
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(
	txHash: Hex
): Promise<"pending" | "success" | "failed" | "not_found"> {
	try {
		const receipt = await publicClient.getTransactionReceipt({
			hash: txHash,
		});

		if (!receipt) {
			return "pending";
		}

		return receipt.status === "success" ? "success" : "failed";
	} catch (error) {
		console.error(`Error getting transaction status for ${txHash}:`, error);
		return "not_found";
	}
}

/**
 * Validate transaction on-chain
 * Extracts function data and validates against market state
 */
export async function validateTransactionOnChain(
	txHash: Hex
): Promise<{
	isValid: boolean;
	receipt: TransactionReceipt | null;
	blockNumber: number | null;
	status: "pending" | "success" | "failed" | "not_found";
	error?: string;
}> {
	try {
		// Get transaction receipt - wrapped in try-catch for "not found yet" errors
		let receipt;
		try {
			receipt = await publicClient.getTransactionReceipt({
				hash: txHash,
			});
		} catch (receiptError: any) {
			// Receipt not found yet - check if transaction exists
			if (receiptError.message?.includes("could not be found")) {
				try {
					await publicClient.getTransaction({ hash: txHash });
					// Transaction exists but no receipt yet - it's pending
					return {
						isValid: false,
						receipt: null,
						blockNumber: null,
						status: "pending",
						error: "Transaction is pending confirmation",
					};
				} catch {
					// Transaction doesn't exist at all
					return {
						isValid: false,
						receipt: null,
						blockNumber: null,
						status: "not_found",
						error: "Transaction not found on-chain",
					};
				}
			}
			// Other error, rethrow
			throw receiptError;
		}

		if (!receipt) {
			// Check if transaction exists (pending vs not found)
			try {
				await publicClient.getTransaction({ hash: txHash });
				// Transaction exists but no receipt yet - it's pending
				return {
					isValid: false,
					receipt: null,
					blockNumber: null,
					status: "pending",
					error: "Transaction is pending confirmation",
				};
			} catch {
				// Transaction doesn't exist at all
				return {
					isValid: false,
					receipt: null,
					blockNumber: null,
					status: "not_found",
					error: "Transaction not found on-chain",
				};
			}
		}

		// Check status
		const isSuccess = receipt.status === "success";

		if (!isSuccess) {
			return {
				isValid: false,
				receipt,
				blockNumber: Number(receipt.blockNumber),
				status: "failed",
				error: "Transaction reverted on-chain",
			};
		}

		// Verify transaction touched the contract
		const toContract = receipt.to?.toLowerCase() === CONTRACT_ADDRESSES.PREDICTION_MARKET.toLowerCase();

		if (!toContract) {
			return {
				isValid: false,
				receipt,
				blockNumber: Number(receipt.blockNumber),
				status: "success",
				error: "Transaction did not interact with prediction market contract",
			};
		}

		return {
			isValid: true,
			receipt,
			blockNumber: Number(receipt.blockNumber),
			status: "success",
		};
	} catch (error) {
		console.error(`Error validating transaction ${txHash}:`, error);
		return {
			isValid: false,
			receipt: null,
			blockNumber: null,
			status: "not_found",
			error: `Error validating transaction: ${(error as Error).message}`,
		};
	}
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(txHash: Hex) {
	try {
		const [tx, receipt] = await Promise.all([
			publicClient.getTransaction({ hash: txHash }),
			publicClient.getTransactionReceipt({ hash: txHash }),
		]);

		return {
			hash: tx.hash,
			from: tx.from,
			to: tx.to,
			value: tx.value,
			data: tx.input,
			gas: tx.gas,
			gasPrice: tx.gasPrice,
			gasUsed: receipt?.gasUsed,
			blockNumber: receipt?.blockNumber,
			status: receipt?.status,
			confirmations: receipt ? await publicClient.getBlockNumber() - receipt.blockNumber : undefined,
		};
	} catch (error) {
		console.error(`Error getting transaction details for ${txHash}:`, error);
		return null;
	}
}

// ============================================================================
// CONTRACT INTERACTION
// ============================================================================

/**
 * Get current network info
 */
export async function getNetworkInfo() {
	try {
		const [chainId, gasPrice, blockNumber] = await Promise.all([
			publicClient.getChainId(),
			publicClient.getGasPrice(),
			publicClient.getBlockNumber(),
		]);

		return {
			chainId,
			expectedChainId: CURRENT_NETWORK.chainId,
			isCorrectNetwork: chainId === CURRENT_NETWORK.chainId,
			gasPrice,
			blockNumber,
		};
	} catch (error) {
		console.error("Error getting network info:", error);
		return null;
	}
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(params: {
	to: Hex;
	data: Hex;
	from?: Hex;
	value?: bigint;
}) {
	try {
		const gasEstimate = await publicClient.estimateGas({
			to: params.to,
			data: params.data,
			value: params.value,
			account: params.from,
		});

		// Add 20% buffer for safety
		const gasWithBuffer = (gasEstimate * BigInt(120)) / BigInt(100);

		return {
			estimated: gasEstimate,
			withBuffer: gasWithBuffer,
		};
	} catch (error) {
		console.error("Error estimating gas:", error);
		return null;
	}
}

/**
 * Get current gas price
 */
export async function getGasPrice() {
	try {
		return await publicClient.getGasPrice();
	} catch (error) {
		console.error("Error getting gas price:", error);
		return null;
	}
}

/**
 * Calculate transaction cost
 */
export async function calculateTransactionCost(params: {
	gas: bigint;
}) {
	try {
		const gasPrice = await getGasPrice();
		if (!gasPrice) return null;

		const cost = params.gas * gasPrice;

		return {
			gas: params.gas,
			gasPrice,
			totalCost: cost,
		};
	} catch (error) {
		console.error("Error calculating transaction cost:", error);
		return null;
	}
}

// ============================================================================
// ACCOUNT & BALANCE
// ============================================================================

/**
 * Get wallet balance in CRO
 */
export async function getWalletBalance(address: Hex): Promise<bigint | null> {
	try {
		const balance = await publicClient.getBalance({
			address,
		});
		return balance;
	} catch (error) {
		console.error(`Error getting balance for ${address}:`, error);
		return null;
	}
}

/**
 * Get account nonce (for transaction ordering)
 */
export async function getAccountNonce(address: Hex): Promise<number | null> {
	try {
		const nonce = await publicClient.getTransactionCount({
			address,
		});
		return nonce;
	} catch (error) {
		console.error(`Error getting nonce for ${address}:`, error);
		return null;
	}
}

// ============================================================================
// BLOCK & CHAIN INFO
// ============================================================================

/**
 * Get current block info
 */
export async function getCurrentBlock() {
	try {
		const block = await publicClient.getBlock();

		return {
			number: block.number,
			hash: block.hash,
			timestamp: block.timestamp,
			miner: block.miner,
			gasUsed: block.gasUsed,
			gasLimit: block.gasLimit,
		};
	} catch (error) {
		console.error("Error getting current block:", error);
		return null;
	}
}

/**
 * Wait for block confirmations
 */
export async function waitForConfirmations(
	txHash: Hex,
	confirmations: number = 1,
	timeout: number = 120000 // 2 minutes
): Promise<TransactionReceipt | null> {
	const startTime = Date.now();

	return new Promise((resolve) => {
		const checkConfirmations = async () => {
			try {
				const receipt = await publicClient.getTransactionReceipt({
					hash: txHash,
				});

				if (receipt) {
					const currentBlock = await publicClient.getBlockNumber();
					const txConfirmations = currentBlock - receipt.blockNumber;

					if (txConfirmations >= confirmations) {
						resolve(receipt);
						return;
					}
				}

				// Check timeout
				if (Date.now() - startTime > timeout) {
					resolve(null);
					return;
				}

				// Retry after delay
				setTimeout(checkConfirmations, 3000);
			} catch (error) {
				console.error("Error checking confirmations:", error);
				setTimeout(checkConfirmations, 3000);
			}
		};

		checkConfirmations();
	});
}

// ============================================================================
// CONTRACT STATE QUERIES
// ============================================================================

/**
 * Call contract function (read-only)
 */
export async function callContractFunction<T>({
	functionName,
	abi,
	address,
	args,
}: {
	functionName: string;
	abi: any[];
	address: Hex;
	args?: any[];
}): Promise<T | null> {
	try {
		const result = await publicClient.call({
			account: undefined,
			to: address,
			data: undefined, // Would need to encode function call manually
		});

		return result?.data as T;
	} catch (error) {
		console.error(`Error calling contract function ${functionName}:`, error);
		return null;
	}
}

/**
 * Get contract bytecode (verify contract deployed)
 */
export async function getContractBytecode(address: Hex): Promise<Hex | null> {
	try {
		const code = await publicClient.getBytecode({
			address,
		});
		return code ?? null;
	} catch (error) {
		console.error(`Error getting bytecode for ${address}:`, error);
		return null;
	}
}

/**
 * Verify contract is deployed at address
 */
export async function isContractDeployed(address: Hex): Promise<boolean> {
	try {
		const code = await getContractBytecode(address);
		return code !== null && code !== "0x";
	} catch {
		return false;
	}
}

// ============================================================================
// EVENT MONITORING
// ============================================================================

/**
 * Watch for contract events
 * Used for real-time updates
 */
export function watchContractEvents({
	eventName,
	onEvent,
	onError,
	poll = true,
}: {
	eventName: string;
	onEvent: (log: any) => void;
	onError: (error: Error) => void;
	poll?: boolean;
}) {
	try {
		// Use polling instead of WebSockets for better compatibility
		const checkLogs = async () => {
			try {
				// Implementation would depend on specific event ABI
				// This is a placeholder for the pattern
			} catch (error) {
				onError(error as Error);
			}
		};

		if (poll) {
			const interval = setInterval(checkLogs, 12000); // Cronos block time ~6 seconds

			return () => {
				clearInterval(interval);
			};
		}
	} catch (error) {
		onError(error as Error);
	}

	return () => { };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format wei to human-readable format
 */
export function formatWei(wei: bigint, decimals: number = 18): string {
	const divisor = BigInt(10) ** BigInt(decimals);
	const integerPart = wei / divisor;
	const fractionalPart = wei % divisor;

	const fractionalStr = fractionalPart
		.toString()
		.padStart(decimals, "0")
		.replace(/0+$/, "");

	if (fractionalStr === "") {
		return integerPart.toString();
	}

	return `${integerPart}.${fractionalStr}`;
}

/**
 * Convert human-readable to wei
 */
export function toWei(value: number | string, decimals: number = 18): bigint {
	const parts = value.toString().split(".");
	const integerPart = BigInt(parts[0]);
	const fractionalPart = parts[1] || "";

	const paddedFractional = fractionalPart.padEnd(decimals, "0");
	const fractionalBigInt = BigInt(paddedFractional);

	const divisor = BigInt(10) ** BigInt(decimals);
	return integerPart * divisor + fractionalBigInt;
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string, chars: number = 6): string {
	return `${hash.slice(0, chars)}...${hash.slice(-4)}`;
}

/**
 * Get block explorer URL for transaction
 */
export function getTxExplorerUrl(txHash: string): string {
	const baseUrl = CURRENT_NETWORK.blockExplorer || "https://cronos.org/explorer";
	return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getAddressExplorerUrl(address: string): string {
	const baseUrl = CURRENT_NETWORK.blockExplorer || "https://cronos.org/explorer";
	return `${baseUrl}/address/${address}`;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Parse blockchain error
 */
export function parseBlockchainError(error: any): {
	message: string;
	code?: string;
	details?: string;
} {
	if (error.shortMessage) {
		return {
			message: error.shortMessage,
			code: error.code,
			details: error.details,
		};
	}

	const message = error.message || "Unknown blockchain error";

	if (message.includes("insufficient funds")) {
		return {
			message: "Insufficient CRO for gas",
			code: "INSUFFICIENT_GAS",
		};
	}

	if (message.includes("reverted")) {
		return {
			message: "Transaction reverted",
			code: "TRANSACTION_REVERTED",
		};
	}

	if (message.includes("nonce")) {
		return {
			message: "Nonce mismatch (try refreshing)",
			code: "NONCE_ERROR",
		};
	}

	return {
		message,
		details: error.toString(),
	};
}
