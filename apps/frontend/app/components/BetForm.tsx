/**
 * BetForm Component
 * 
 * Complete bet placement form with:
 * 1. Choice selection (YES/NO)
 * 2. Amount input with real-time validation
 * 3. Validation feedback (errors + warnings)
 * 4. Approval flow for USDT
 * 5. Transaction monitoring
 * 6. Success/error states
 * 7. Cooldown countdown
 * 8. Responsive design
 * 
 * Usage:
 * <BetForm marketId="btc-100k" onSuccess={() => refetchBets()} />
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { BetChoice } from "@/lib/types/prediction-market";
import { useContractBet, getErrorMessage } from "@/lib/hooks/useContractBet";
import { usePredictionMarket } from "@/lib/hooks/usePredictionMarket";
import { useBetValidation, useValidationSummary, formatCooldownDisplay, getPoolPercentColor, calculateExpectedPayout } from "@/lib/hooks/useBetValidation";
import { BET_LIMITS } from "@/lib/config/constants";

// ============================================================================
// TYPES
// ============================================================================

export interface BetFormProps {
	marketId: string;
	onSuccess?: (betId: string) => void;
	onError?: (error: string) => void;
	disabled?: boolean;
	className?: string;
}

interface FormState {
	choice: BetChoice | null;
	amount: string; // String for input control
	showAdvanced: boolean;
}

// ============================================================================
// LOGGER
// ============================================================================

function logInfo(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [BetForm] ${message}`, context || "");
}

function logError(message: string, context?: any) {
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] [BetForm] ❌ ${message}`, context || "");
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BetForm: React.FC<BetFormProps> = ({
	marketId,
	onSuccess,
	onError,
	disabled = false,
	className = "",
}) => {
	// Hooks
	const { market, isLoading: marketLoading, error: marketError } =
		usePredictionMarket(marketId);
	const {
		placeBet,
		approveUSDT,
		isPending,
		isConfirming,
		isApproving,
		error: contractError,
		errorCode,
		txHash,
		status,
		reset: resetBet,
	} = useContractBet();

	// Local state
	const [form, setForm] = useState<FormState>({
		choice: null,
		amount: "",
		showAdvanced: false,
	});

	// Validation
	const amountNum = form.amount ? parseFloat(form.amount) : 0;
	const validation = useBetValidation({
		choice: form.choice,
		amount: amountNum,
		marketId,
		marketStatus: market?.status || "CLOSED",
		marketEndDate: market?.endDate ? new Date(market.endDate) : new Date(),
		userBetCount: 0, // TODO: Fetch from user state
		userTotalBets: 0, // TODO: Fetch from user state
		userLastBetTime: null, // TODO: Fetch from user state
		userRecentBetTimes: [], // TODO: Fetch from user state
		marketYesPool: market ? parseFloat(market.yesPool) : 0,
		marketNoPool: market ? parseFloat(market.noPool) : 0,
		userIsFlagged: false, // TODO: Fetch from user state
	});

	const summary = useValidationSummary(validation);
	const payout = form.choice && amountNum > 0
		? calculateExpectedPayout(
			amountNum,
			market ? parseFloat(market.yesPool) : 0,
			market ? parseFloat(market.noPool) : 0,
			form.choice,
			BET_LIMITS.HOUSE_FEE_PERCENT
		)
		: null;

	// ====== Handlers ======

	const handleChoiceChange = useCallback(
		(choice: BetChoice) => {
			setForm((prev) => ({
				...prev,
				choice: prev.choice === choice ? null : choice,
			}));
			logInfo("Choice selected", { choice });
		},
		[]
	);

	const handleAmountChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			let value = e.target.value;

			// Only allow integers
			if (value && !/^\d+$/.test(value)) {
				return;
			}

			// Remove leading zeros
			value = value.replace(/^0+(?=\d)/, "") || value;

			// Limit to max bet
			if (value && parseInt(value) > BET_LIMITS.MAX_BET) {
				value = BET_LIMITS.MAX_BET.toString();
			}

			setForm((prev) => ({
				...prev,
				amount: value,
			}));

			logInfo("Amount changed", { amount: value });
		},
		[]
	);

	const handleMaxClick = useCallback(() => {
		const maxBet = Math.min(
			BET_LIMITS.MAX_BET,
			validation.maxBetByPoolCap
		);
		setForm((prev) => ({
			...prev,
			amount: maxBet.toString(),
		}));
		logInfo("Max button clicked", { maxBet });
	}, [validation.maxBetByPoolCap]);

	const handleApprove = useCallback(async () => {
		try {
			logInfo("Approval requested", {});
			const approved = await approveUSDT();

			if (approved) {
				toast.success("USDT approved for betting");
			} else {
				const msg = getErrorMessage(contractError || "Approval failed", errorCode);
				toast.error(msg);
				onError?.(msg);
			}
		} catch (error) {
			const msg = (error as Error).message || "Approval failed";
			logError("Approval error", { error: msg });
			toast.error(msg);
			onError?.(msg);
		}
	}, [approveUSDT, contractError, errorCode, onError]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!form.choice || !amountNum) {
				toast.error("Please select a choice and amount");
				return;
			}

			if (!validation.isValid) {
				const msg = validation.errors[0]?.message || "Validation failed";
				toast.error(msg);
				return;
			}

			try {
				logInfo("Bet submission started", {
					choice: form.choice,
					amount: amountNum,
				});

				const result = await placeBet(form.choice, amountNum, marketId);

				if (result.success) {
					toast.success(`Bet placed! ID: ${result.betId}`);
					setForm({ choice: null, amount: "", showAdvanced: false });
					onSuccess?.(result.betId || "");

					logInfo("✅ Bet placed successfully", {
						choice: form.choice,
						amount: amountNum,
						betId: result.betId,
					});
				} else {
					const msg = getErrorMessage(contractError || "Bet failed", errorCode);
					toast.error(msg);
					onError?.(msg);

					logError("Bet submission failed", {
						choice: form.choice,
						amount: amountNum,
						error: msg,
					});
				}
			} catch (error) {
				const msg = (error as Error).message || "Unknown error";
				logError("Unexpected error placing bet", { error: msg });
				toast.error(msg);
				onError?.(msg);
			}
		},
		[form.choice, amountNum, marketId, placeBet, validation, contractError, errorCode, onSuccess, onError]
	);

	const handleReset = useCallback(() => {
		setForm({ choice: null, amount: "", showAdvanced: false });
		resetBet();
		logInfo("Form reset", {});
	}, [resetBet]);

	// ====== Show loading state ======
	if (marketLoading) {
		return (
			<div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
				<div className="space-y-4 animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-32" />
					<div className="h-10 bg-gray-200 rounded" />
					<div className="h-10 bg-gray-200 rounded" />
					<div className="h-10 bg-gray-200 rounded w-24" />
				</div>
			</div>
		);
	}

	// ====== Show error state ======
	if (marketError || !market) {
		return (
			<div className={`rounded-lg border border-red-200 bg-red-50 p-6 ${className}`}>
				<h3 className="text-red-900 font-semibold mb-2">Unable to Load Market</h3>
				<p className="text-red-700 text-sm">{marketError || "Market not found"}</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
				>
					Retry
				</button>
			</div>
		);
	}

	const isSubmitting = isPending || isConfirming;
	const isFormDisabled = disabled || isSubmitting || isApproving || !validation.isValid;

	return (
		<div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-xl font-bold text-gray-900">Place a Bet</h2>
				<p className="text-sm text-gray-600 mt-1">
					{market.status === "ACTIVE"
						? "Choose your prediction"
						: `Market is ${market.status.toLowerCase()}`}
				</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Choice Selection */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-3">
						Prediction
					</label>
					<div className="grid grid-cols-2 gap-3">
						<button
							type="button"
							onClick={() => handleChoiceChange(BetChoice.YES)}
							disabled={isFormDisabled}
							className={`p-4 rounded-lg border-2 transition-colors font-semibold ${
								form.choice === BetChoice.YES
									? "border-green-500 bg-green-50 text-green-700"
									: "border-gray-200 bg-white text-gray-700 hover:border-green-300"
							} ${isFormDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
						>
							<div className="text-lg">✓</div>
							<div className="mt-1">Yes</div>
							<div className="text-xs mt-1 opacity-75">{market.yesPercent.toFixed(1)}%</div>
						</button>

						<button
							type="button"
							onClick={() => handleChoiceChange(BetChoice.NO)}
							disabled={isFormDisabled}
							className={`p-4 rounded-lg border-2 transition-colors font-semibold ${
								form.choice === BetChoice.NO
									? "border-red-500 bg-red-50 text-red-700"
									: "border-gray-200 bg-white text-gray-700 hover:border-red-300"
							} ${isFormDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
						>
							<div className="text-lg">✗</div>
							<div className="mt-1">No</div>
							<div className="text-xs mt-1 opacity-75">{market.noPercent.toFixed(1)}%</div>
						</button>
					</div>
				</div>

				{/* Amount Input */}
				<div>
					<div className="flex justify-between items-center mb-3">
						<label className="block text-sm font-medium text-gray-700">
							Amount (USDT)
						</label>
						<span className="text-xs text-gray-600">
							Min: ${BET_LIMITS.MIN_BET} | Max: ${validation.maxBetAllowed}
						</span>
					</div>

					<div className="flex gap-2">
						<input
							type="text"
							inputMode="numeric"
							value={form.amount}
							onChange={handleAmountChange}
							placeholder="Enter amount"
							disabled={isFormDisabled}
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						/>
						<button
							type="button"
							onClick={handleMaxClick}
							disabled={isFormDisabled}
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium text-sm"
						>
							Max
						</button>
					</div>

					{/* Amount Feedback */}
					{amountNum > 0 && (
						<div className="mt-2 p-3 rounded-lg bg-gray-50">
							{validation.isAmountValid ? (
								<p className="text-sm text-green-700">✓ Amount is valid</p>
							) : (
								<p className="text-sm text-red-700">✗ Invalid amount</p>
							)}
						</div>
					)}
				</div>

				{/* Validation Status */}
				{form.choice && amountNum > 0 && (
					<div className={`p-4 rounded-lg border-2 ${
						validation.isValid
							? "border-green-200 bg-green-50"
							: "border-red-200 bg-red-50"
					}`}>
						<div className={`text-sm font-semibold mb-2 ${
							validation.isValid ? "text-green-700" : "text-red-700"
						}`}>
							{summary.statusIcon} {summary.statusText}
						</div>

						{/* Errors */}
						{validation.errors.length > 0 && (
							<div className="space-y-1 mb-3">
								{validation.errors.map((error, i) => (
									<p key={i} className="text-sm text-red-700">
										• {error.message}
									</p>
								))}
							</div>
						)}

						{/* Warnings */}
						{validation.warnings.length > 0 && (
							<div className="space-y-1 mb-3">
								{validation.warnings.map((warning, i) => (
									<p key={i} className="text-sm text-yellow-700">
										⚠ {warning.message}
									</p>
								))}
							</div>
						)}

						{/* Status Checks */}
						<div className="space-y-1 text-xs">
							<div className={validation.isCooldownOk ? "text-green-700" : "text-red-700"}>
								{validation.isCooldownOk
									? "✓ No cooldown"
									: `✗ Wait ${formatCooldownDisplay(validation.cooldownRemaining)}`}
							</div>
							<div className={validation.isBetCountOk ? "text-green-700" : "text-red-700"}>
								✓ {validation.betsRemaining}/10 bets remaining
							</div>
							<div className={validation.isPoolCapOk ? "text-green-700" : "text-red-700"}>
								Pool exposure: <span className={getPoolPercentColor(validation.walletPoolPercent)}>
									{validation.walletPoolPercent.toFixed(1)}%
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Expected Payout */}
				{payout && (
					<div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
						<p className="text-xs text-gray-600 mb-2">If {form.choice} wins:</p>
						<div className="text-lg font-bold text-blue-700">
							${payout.netPayout.toFixed(2)}
						</div>
						<p className="text-xs text-gray-600 mt-2">
							User share: {payout.userShare.toFixed(1)}% of winning pool
						</p>
						{payout.houseFee > 0 && (
							<p className="text-xs text-gray-500 mt-1">
								After 5% fee: ${payout.houseFee.toFixed(2)}
							</p>
						)}
					</div>
				)}

				{/* Error Message */}
				{contractError && (
					<div className="p-4 rounded-lg bg-red-50 border border-red-200">
						<p className="text-sm text-red-700 font-semibold">Error</p>
						<p className="text-sm text-red-600 mt-1">{contractError}</p>
						{errorCode && (
							<p className="text-xs text-red-500 mt-1">Code: {errorCode}</p>
						)}
					</div>
				)}

				{/* Transaction Status */}
				{txHash && (
					<div className={`p-4 rounded-lg border-2 ${
						status === "success"
							? "border-green-200 bg-green-50"
							: "border-blue-200 bg-blue-50"
					}`}>
						<div className={`text-sm font-semibold ${
							status === "success" ? "text-green-700" : "text-blue-700"
						}`}>
							{status === "success"
								? "✓ Bet Confirmed"
								: "⟳ Processing Transaction"}
						</div>
						<p className="text-xs text-gray-600 mt-2 break-all">
							{txHash}
						</p>
					</div>
				)}

				{/* Advanced Options */}
				<div>
					<button
						type="button"
						onClick={() => setForm((prev) => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
						className="text-xs text-gray-600 hover:text-gray-900 underline"
					>
						{form.showAdvanced ? "Hide" : "Show"} Details
					</button>

					{form.showAdvanced && (
						<div className="mt-3 space-y-2 text-xs text-gray-600 p-3 rounded-lg bg-gray-50">
							<p>Market ID: <code className="text-gray-700">{marketId}</code></p>
							<p>Status: <code className="text-gray-700">{market.status}</code></p>
							<p>Total Bets: <code className="text-gray-700">{market.totalBets}</code></p>
							<p>Pool: YES ${parseFloat(market.yesPool).toFixed(2)} / NO ${parseFloat(market.noPool).toFixed(2)}</p>
						</div>
					)}
				</div>

				{/* Buttons */}
				<div className="flex gap-3 pt-4 border-t border-gray-200">
					{isApproving ? (
						<button
							type="button"
							disabled
							className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							⟳ Approving USDT...
						</button>
					) : isSubmitting ? (
						<button
							type="button"
							disabled
							className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isPending ? "⟳ Signing..." : "⟳ Confirming..."}
						</button>
					) : (
						<>
							<button
								type="button"
								onClick={handleApprove}
								className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Approve USDT
							</button>
							<button
								type="submit"
								disabled={isFormDisabled}
								className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Place Bet
							</button>
						</>
					)}

					{(contractError || txHash) && (
						<button
							type="button"
							onClick={handleReset}
							className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
						>
							Clear
						</button>
					)}
				</div>

				{/* Disclaimer */}
				<p className="text-xs text-gray-500 text-center pt-2">
					By placing a bet, you agree to our terms. 5% house fee applies to winnings.
				</p>
			</form>
		</div>
	);
};

export default BetForm;
