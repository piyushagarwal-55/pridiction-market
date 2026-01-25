/**
 * useSSE Hook
 * 
 * Manages Server-Sent Events connections with:
 * 1. Connection lifecycle management
 * 2. Event subscription/unsubscription
 * 3. Auto-reconnection with exponential backoff
 * 4. Circuit breaker for repeated failures
 * 5. Heartbeat monitoring
 * 6. Error recovery
 * 7. Graceful cleanup on unmount
 * 
 * Usage:
 * const sse = useSSE(`/api/markets/live-stats?marketId=${id}`);
 * 
 * sse.on("POOL_UPDATE", (data) => {
 *   console.log("Pool updated:", data);
 * });
 * 
 * sse.on("ERROR", (error) => {
 *   console.error("SSE error:", error);
 * });
 * 
 * // Cleanup on unmount is automatic
 */

import { useState, useCallback, useRef, useEffect } from "react";

// ============================================================================
// TYPES
// ============================================================================

export type SSEEventType =
	| "POOL_UPDATE"
	| "MARKET_UPDATE"
	| "HEARTBEAT"
	| "ERROR"
	| string;

export type SSEEventHandler<T = any> = (data: T) => void;

export interface SSEEvent<T = any> {
	type: SSEEventType;
	data: T;
	timestamp: number;
}

export interface UseSSEState {
	isConnected: boolean;
	isConnecting: boolean;
	error: string | null;
	errorCode: string | null;
	lastEvent: SSEEvent | null;
	lastEventTime: number | null;
	reconnectAttempts: number;
	connectionTime: number | null; // Timestamp of connection
	totalMessagesReceived: number;
}

export interface UseSSEActions {
	connect: () => void;
	disconnect: () => void;
	reconnect: () => void;
	on: <T = any>(
		eventType: SSEEventType,
		handler: SSEEventHandler<T>
	) => () => void; // Returns unsubscribe function
	off: (eventType: SSEEventType, handler: SSEEventHandler) => void;
	removeAllListeners: (eventType?: SSEEventType) => void;
	reset: () => void;
}

export type UseSSEReturn = UseSSEState & UseSSEActions;

// ============================================================================
// CONFIGURATION
// ============================================================================

interface SSEConfig {
	maxRetries?: number; // Maximum reconnection attempts
	initialBackoff?: number; // Initial backoff in ms
	maxBackoff?: number; // Maximum backoff in ms
	backoffMultiplier?: number; // Exponential backoff multiplier
	heartbeatTimeout?: number; // Timeout if no heartbeat received
	enableLogging?: boolean; // Enable console logging
}

const DEFAULT_CONFIG: Required<SSEConfig> = {
	maxRetries: 10,
	initialBackoff: 1000, // 1 second
	maxBackoff: 30000, // 30 seconds
	backoffMultiplier: 2,
	heartbeatTimeout: 45000, // 45 seconds
	enableLogging: process.env.NODE_ENV === "development",
};

// ============================================================================
// LOGGER
// ============================================================================

class SSELogger {
	constructor(private enabled: boolean, private tag: string) {}

	info(message: string, context?: any) {
		if (!this.enabled) return;
		const timestamp = new Date().toISOString();
		console.log(
			`[${timestamp}] [${this.tag}] ${message}`,
			context || ""
		);
	}

	error(message: string, context?: any) {
		const timestamp = new Date().toISOString();
		console.error(
			`[${timestamp}] [${this.tag}] ❌ ${message}`,
			context || ""
		);
	}

	warn(message: string, context?: any) {
		if (!this.enabled) return;
		const timestamp = new Date().toISOString();
		console.warn(
			`[${timestamp}] [${this.tag}] ⚠️  ${message}`,
			context || ""
		);
	}
}

// ============================================================================
// HOOK
// ============================================================================

export function useSSE(
	url: string,
	config: SSEConfig = {}
): UseSSEReturn {
	const finalConfig = { ...DEFAULT_CONFIG, ...config };
	const logger = new SSELogger(
		finalConfig.enableLogging,
		`useSSE[${url.split("?")[0]}]`
	);

	// State
	const [state, setState] = useState<UseSSEState>({
		isConnected: false,
		isConnecting: false,
		error: null,
		errorCode: null,
		lastEvent: null,
		lastEventTime: null,
		reconnectAttempts: 0,
		connectionTime: null,
		totalMessagesReceived: 0,
	});

	// Refs
	const eventSourceRef = useRef<EventSource | null>(null);
	const listenersRef = useRef<Map<SSEEventType, Set<SSEEventHandler>>>(
		new Map()
	);
	const mountedRef = useRef(true);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastHeartbeatRef = useRef<number>(Date.now());
	const circuitBreakerRef = useRef({
		failures: 0,
		isOpen: false,
		openedAt: 0,
	});

	// ====== Helper: Calculate backoff with jitter ======
	const getBackoffDelay = useCallback(
		(attempt: number): number => {
			const exponentialDelay = Math.min(
				finalConfig.initialBackoff *
					Math.pow(finalConfig.backoffMultiplier, attempt),
				finalConfig.maxBackoff
			);

			// Add jitter (±10%)
			const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
			return Math.max(100, exponentialDelay + jitter);
		},
		[
			finalConfig.initialBackoff,
			finalConfig.maxBackoff,
			finalConfig.backoffMultiplier,
		]
	);

	// ====== Helper: Check circuit breaker ======
	const isCircuitBreakerOpen = useCallback((): boolean => {
		const breaker = circuitBreakerRef.current;

		// If open, check if cooldown period has passed
		if (breaker.isOpen) {
			const timeSinceOpen = Date.now() - breaker.openedAt;
			const cooldownPeriod = Math.min(
				finalConfig.maxBackoff * 2,
				60000
			);

			if (timeSinceOpen > cooldownPeriod) {
				// Reset breaker after cooldown
				breaker.isOpen = false;
				breaker.failures = 0;
				logger.info("Circuit breaker reset");
			}
		}

		return breaker.isOpen;
	}, [finalConfig.maxBackoff, logger]);

	// ====== Helper: Record failure ======
	const recordFailure = useCallback(() => {
		const breaker = circuitBreakerRef.current;
		breaker.failures++;

		if (breaker.failures >= finalConfig.maxRetries) {
			breaker.isOpen = true;
			breaker.openedAt = Date.now();
			logger.warn("Circuit breaker opened after max retries", {
				failures: breaker.failures,
			});
		}
	}, [finalConfig.maxRetries, logger]);

	// ====== Helper: Clear heartbeat timeout ======
	const clearHeartbeatTimeout = useCallback(() => {
		if (heartbeatTimeoutRef.current) {
			clearTimeout(heartbeatTimeoutRef.current);
			heartbeatTimeoutRef.current = null;
		}
	}, []);

	// ====== Helper: Setup heartbeat timeout ======
	const setupHeartbeatTimeout = useCallback(() => {
		clearHeartbeatTimeout();

		heartbeatTimeoutRef.current = setTimeout(() => {
			logger.warn("Heartbeat timeout - reconnecting", {
				lastHeartbeat: Date.now() - lastHeartbeatRef.current,
			});

			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}

			reconnect();
		}, finalConfig.heartbeatTimeout);
	}, [finalConfig.heartbeatTimeout, logger, clearHeartbeatTimeout]);

	// ====== Helper: Emit event to listeners ======
	const emitEvent = useCallback(
		<T,>(type: SSEEventType, data: T) => {
			const listeners = listenersRef.current.get(type);
			if (listeners) {
				listeners.forEach((handler) => {
					try {
						handler(data);
					} catch (error) {
						logger.error("Error in SSE event listener", {
							type,
							error: (error as Error).message,
						});
					}
				});
			}
		},
		[logger]
	);

	// ====== Main: Connect to SSE ======
	const connect = useCallback(() => {
		if (!mountedRef.current) return;

		// Check circuit breaker
		if (isCircuitBreakerOpen()) {
			logger.error("Cannot connect - circuit breaker open", {});
			setState((prev) => ({
				...prev,
				error: "Too many connection failures. Please try again later.",
				errorCode: "CIRCUIT_BREAKER_OPEN",
			}));
			return;
		}

		if (state.isConnected || state.isConnecting) {
			logger.warn("Already connected or connecting", {});
			return;
		}

		setState((prev) => ({
			...prev,
			isConnecting: true,
			error: null,
			errorCode: null,
		}));

		try {
			logger.info("Connecting to SSE", { url });

			const eventSource = new EventSource(url);
			eventSourceRef.current = eventSource;

			// ====== Setup connection handlers ======
			eventSource.onopen = () => {
				if (!mountedRef.current) return;

				logger.info("✅ SSE connected", {});

				setState((prev) => ({
					...prev,
					isConnected: true,
					isConnecting: false,
					error: null,
					errorCode: null,
					connectionTime: Date.now(),
					reconnectAttempts: 0,
				}));

				// Reset circuit breaker on successful connection
				circuitBreakerRef.current.failures = 0;
				circuitBreakerRef.current.isOpen = false;

				// Setup heartbeat timeout
				setupHeartbeatTimeout();

				lastHeartbeatRef.current = Date.now();
			};

			// ====== Default handlers (override with .on()) ======

			// Pool updates
			eventSource.addEventListener(
				"POOL_UPDATE",
				(event: Event) => {
					if (!mountedRef.current) return;

					try {
						const data = JSON.parse(
							(event as MessageEvent).data
						);
						lastHeartbeatRef.current = Date.now();
						setupHeartbeatTimeout();

						setState((prev) => ({
							...prev,
							lastEvent: {
								type: "POOL_UPDATE",
								data,
								timestamp: Date.now(),
							},
							lastEventTime: Date.now(),
							totalMessagesReceived: prev.totalMessagesReceived + 1,
						}));

						emitEvent("POOL_UPDATE", data);
					} catch (error) {
						logger.error("Error parsing POOL_UPDATE", {
							error: (error as Error).message,
						});
					}
				}
			);

			// Market updates
			eventSource.addEventListener(
				"MARKET_UPDATE",
				(event: Event) => {
					if (!mountedRef.current) return;

					try {
						const data = JSON.parse(
							(event as MessageEvent).data
						);
						lastHeartbeatRef.current = Date.now();
						setupHeartbeatTimeout();

						setState((prev) => ({
							...prev,
							lastEvent: {
								type: "MARKET_UPDATE",
								data,
								timestamp: Date.now(),
							},
							lastEventTime: Date.now(),
							totalMessagesReceived: prev.totalMessagesReceived + 1,
						}));

						emitEvent("MARKET_UPDATE", data);
					} catch (error) {
						logger.error("Error parsing MARKET_UPDATE", {
							error: (error as Error).message,
						});
					}
				}
			);

			// Heartbeat (keep-alive)
			eventSource.addEventListener(
				"HEARTBEAT",
				(event: Event) => {
					if (!mountedRef.current) return;

					try {
						lastHeartbeatRef.current = Date.now();
						setupHeartbeatTimeout();

						const data = JSON.parse(
							(event as MessageEvent).data
						);

						setState((prev) => ({
							...prev,
							totalMessagesReceived: prev.totalMessagesReceived + 1,
						}));

						emitEvent("HEARTBEAT", data);
					} catch (error) {
						logger.error("Error parsing HEARTBEAT", {
							error: (error as Error).message,
						});
					}
				}
			);

			// Errors from server
			eventSource.addEventListener(
				"ERROR",
				(event: Event) => {
					if (!mountedRef.current) return;

					try {
						const data = JSON.parse(
							(event as MessageEvent).data
						);

						logger.error("Server sent error", {
							code: data.code,
							message: data.message,
						});

						emitEvent("ERROR", data);
					} catch (error) {
						logger.error("Error parsing server ERROR", {
							error: (error as Error).message,
						});
					}
				}
			);

			// ====== Connection errors ======
			eventSource.onerror = () => {
				if (!mountedRef.current) return;

				logger.warn("SSE connection error", {
					readyState: eventSource.readyState,
				});

				clearHeartbeatTimeout();
				eventSource.close();

				setState((prev) => ({
					...prev,
					isConnected: false,
					isConnecting: false,
					error: "Connection lost",
					errorCode: "CONNECTION_LOST",
				}));

				recordFailure();

				// Auto-reconnect if not at max retries
				if (state.reconnectAttempts < finalConfig.maxRetries) {
					const backoffDelay = getBackoffDelay(
						state.reconnectAttempts
					);

					logger.info("Scheduling reconnection", {
						attempts: state.reconnectAttempts + 1,
						delay: backoffDelay,
					});

					reconnectTimeoutRef.current = setTimeout(() => {
						if (mountedRef.current) {
							reconnect();
						}
					}, backoffDelay);

					setState((prev) => ({
						...prev,
						reconnectAttempts: prev.reconnectAttempts + 1,
					}));
				} else {
					logger.error("Max reconnection attempts reached", {
						attempts: state.reconnectAttempts,
					});

					setState((prev) => ({
						...prev,
						error: "Could not connect after multiple attempts",
						errorCode: "MAX_RETRIES_EXCEEDED",
					}));

					recordFailure();
				}
			};
		} catch (error) {
			logger.error("Error connecting to SSE", {
				error: (error as Error).message,
			});

			setState((prev) => ({
				...prev,
				isConnecting: false,
				error: (error as Error).message,
				errorCode: "CONNECTION_ERROR",
			}));

			recordFailure();
		}
	}, [
		url,
		state.isConnected,
		state.isConnecting,
		state.reconnectAttempts,
		isCircuitBreakerOpen,
		logger,
		emitEvent,
		setupHeartbeatTimeout,
		getBackoffDelay,
		clearHeartbeatTimeout,
		recordFailure,
		finalConfig.maxRetries,
	]);

	// ====== Disconnect ======
	const disconnect = useCallback(() => {
		logger.info("Disconnecting from SSE", {});

		clearHeartbeatTimeout();

		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		setState({
			isConnected: false,
			isConnecting: false,
			error: null,
			errorCode: null,
			lastEvent: null,
			lastEventTime: null,
			reconnectAttempts: 0,
			connectionTime: null,
			totalMessagesReceived: 0,
		});
	}, [logger, clearHeartbeatTimeout]);

	// ====== Reconnect ======
	const reconnect = useCallback(() => {
		logger.info("Reconnecting to SSE", {});
		disconnect();
		setTimeout(() => {
			if (mountedRef.current) {
				connect();
			}
		}, 100);
	}, [logger, disconnect, connect]);

	// ====== Event listeners ======
	const on = useCallback(
		<T,>(
			eventType: SSEEventType,
			handler: SSEEventHandler<T>
		): (() => void) => {
			if (!listenersRef.current.has(eventType)) {
				listenersRef.current.set(eventType, new Set());
			}

			listenersRef.current.get(eventType)!.add(handler as SSEEventHandler);

			// Return unsubscribe function
			return () => {
				const listeners = listenersRef.current.get(eventType);
				if (listeners) {
					listeners.delete(handler as SSEEventHandler);
				}
			};
		},
		[]
	);

	const off = useCallback(
		(eventType: SSEEventType, handler: SSEEventHandler) => {
			const listeners = listenersRef.current.get(eventType);
			if (listeners) {
				listeners.delete(handler);
			}
		},
		[]
	);

	const removeAllListeners = useCallback(
		(eventType?: SSEEventType) => {
			if (eventType) {
				listenersRef.current.delete(eventType);
			} else {
				listenersRef.current.clear();
			}
		},
		[]
	);

	const reset = useCallback(() => {
		logger.info("Resetting SSE state", {});
		disconnect();
		circuitBreakerRef.current = {
			failures: 0,
			isOpen: false,
			openedAt: 0,
		};
	}, [logger, disconnect]);

	// ====== Auto-connect on mount ======
	useEffect(() => {
		mountedRef.current = true;
		connect();

		return () => {
			mountedRef.current = false;
			disconnect();
		};
	}, [url, connect, disconnect]);

	return {
		// State
		isConnected: state.isConnected,
		isConnecting: state.isConnecting,
		error: state.error,
		errorCode: state.errorCode,
		lastEvent: state.lastEvent,
		lastEventTime: state.lastEventTime,
		reconnectAttempts: state.reconnectAttempts,
		connectionTime: state.connectionTime,
		totalMessagesReceived: state.totalMessagesReceived,

		// Actions
		connect,
		disconnect,
		reconnect,
		on,
		off,
		removeAllListeners,
		reset,
	};
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get connection status text
 */
export function getSSEStatusText(sse: UseSSEReturn): string {
	if (sse.isConnected) {
		return "Connected";
	}

	if (sse.isConnecting) {
		return "Connecting...";
	}

	if (sse.reconnectAttempts > 0) {
		return `Reconnecting (${sse.reconnectAttempts} attempts)...`;
	}

	if (sse.errorCode === "CIRCUIT_BREAKER_OPEN") {
		return "Too many failures - waiting to retry";
	}

	return sse.error || "Disconnected";
}

/**
 * Get connection status color
 */
export function getSSEStatusColor(sse: UseSSEReturn): string {
	if (sse.isConnected) {
		return "text-green-600";
	}

	if (sse.isConnecting || sse.reconnectAttempts > 0) {
		return "text-yellow-600";
	}

	return "text-red-600";
}

/**
 * Format connection uptime
 */
export function formatSSEUptime(connectionTime: number | null): string {
	if (!connectionTime) return "Not connected";

	const uptime = Date.now() - connectionTime;
	const seconds = Math.floor((uptime / 1000) % 60);
	const minutes = Math.floor((uptime / 1000 / 60) % 60);
	const hours = Math.floor((uptime / 1000 / 60 / 60) % 24);

	if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	}

	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}

	return `${seconds}s`;
}
