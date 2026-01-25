/**
 * GET /api/markets/live-stats?marketId=xxx&walletAddress=0x...
 * 
 * Server-Sent Events (SSE) endpoint for real-time market updates
 * Streams pool updates every 2 seconds
 * 
 * Query parameters:
 * - marketId: string (required) - Market ID to stream
 * - walletAddress: string (optional) - User's wallet for personalized updates
 * 
 * Emits SSE events:
 * - POOL_UPDATE: {yesPool, noPool, yesPercent, noPercent, totalBets, timestamp}
 * - MARKET_UPDATE: {status, winner, timeRemaining, timestamp}
 * - ERROR: {message, code, timestamp}
 * 
 * Usage (client-side):
 * const eventSource = new EventSource(
 *   `/api/markets/live-stats?marketId=btc-100k&walletAddress=0x...`
 * );
 * 
 * eventSource.addEventListener("POOL_UPDATE", (e) => {
 *   const data = JSON.parse(e.data);
 *   console.log(`Pool: YES ${data.yesPercent}% / NO ${data.noPercent}%`);
 * });
 * 
 * eventSource.onerror = () => {
 *   console.log("Connection closed");
 *   eventSource.close();
 * };
 */

import { BET_LIMITS } from "@/lib/config/constants";
import { db } from "@/lib/db/client";
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

interface ActiveConnection {
    marketId: string;
    walletAddress?: string;
    connectedAt: number;
    lastHeartbeat: number;
}

const activeConnections = new Map<string, ActiveConnection>();

function generateConnectionId(): string {
    return `sse-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function registerConnection(
    connId: string,
    marketId: string,
    walletAddress?: string
) {
    activeConnections.set(connId, {
        marketId,
        walletAddress,
        connectedAt: Date.now(),
        lastHeartbeat: Date.now(),
    });
}

function unregisterConnection(connId: string) {
    activeConnections.delete(connId);
}

function updateHeartbeat(connId: string) {
    const conn = activeConnections.get(connId);
    if (conn) {
        conn.lastHeartbeat = Date.now();
    }
}

// Cleanup stale connections every 30 seconds
if (typeof window === "undefined") {
    setInterval(() => {
        const now = Date.now();
        const timeout = 120000; // 2 minutes

        for (const [connId, conn] of activeConnections.entries()) {
            if (now - conn.lastHeartbeat > timeout) {
                unregisterConnection(connId);
                logInfo("Stale connection cleaned up", { connId, marketId: conn.marketId });
            }
        }
    }, 30000);
}

// ============================================================================
// LOGGER
// ============================================================================

interface LogContext {
    connId?: string;
    marketId?: string;
    walletAddress?: string;
    event?: string;
    error?: string;
    duration?: number;
    activeConnections?: number;
}

function logInfo(message: string, context: Partial<LogContext>) {
    const timestamp = new Date().toISOString();
    const activeCount = activeConnections.size;
    console.log(
        `[${timestamp}] [LIVE-STATS] ${message} (${activeCount} connections)`,
        JSON.stringify({ ...context, activeConnections: activeCount })
    );
}

function logError(message: string, context: Partial<LogContext>) {
    const timestamp = new Date().toISOString();
    console.error(
        `[${timestamp}] [LIVE-STATS] ❌ ${message}`,
        JSON.stringify(context)
    );

    // TODO: Integrate with Sentry
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(new Error(message), { extra: context });
    // }
}

// ============================================================================
// SSE UTILITIES
// ============================================================================

/**
 * Format data as SSE event
 */
function formatSSEEvent(
    eventType: string,
    data: Record<string, any>
): string {
    return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Format error message as SSE event
 */
function formatSSEError(
    message: string,
    code: string,
    timestamp: number = Date.now()
): string {
    return formatSSEEvent("ERROR", {
        message,
        code,
        timestamp,
    });
}

/**
 * Send heartbeat to keep connection alive
 */
function formatSSEHeartbeat(timestamp: number = Date.now()): string {
    return formatSSEEvent("HEARTBEAT", {
        timestamp,
        message: "Connection alive",
    });
}

// ============================================================================
// DATA FORMATTING
// ============================================================================

/**
 * Format USDT amount from wei to display
 */
function formatUSDT(weiAmount: bigint): string {
    const divisor = BigInt(10 ** BET_LIMITS.USDT_DECIMALS);
    const integerPart = weiAmount / divisor;
    const fractionalPart = weiAmount % divisor;

    const fractionalStr = fractionalPart
        .toString()
        .padStart(BET_LIMITS.USDT_DECIMALS, "0")
        .replace(/0+$/, "");

    if (fractionalStr === "") {
        return integerPart.toString();
    }

    return `${integerPart}.${fractionalStr}`;
}

/**
 * Calculate pool percentages
 */
function calculatePoolPercentages(
    yesPool: bigint,
    noPool: bigint
): { yesPercent: number; noPercent: number } {
    const total = yesPool + noPool;

    if (total === 0n) {
        return { yesPercent: 0, noPercent: 0 };
    }

    const yesPercent = Number((yesPool * BigInt(10000)) / total) / 100;
    const noPercent = Number((noPool * BigInt(10000)) / total) / 100;

    return { yesPercent, noPercent };
}

/**
 * Validate market ID
 */
function isValidMarketId(id: string): boolean {
    return /^[a-zA-Z0-9\-]{1,100}$/.test(id);
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

function validateRequest(request: NextRequest): {
    isValid: boolean;
    marketId?: string;
    walletAddress?: string;
    error?: string;
    status?: number;
} {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");
    const walletAddress = searchParams.get("walletAddress");

    // Validate market ID
    if (!marketId) {
        return {
            isValid: false,
            error: "marketId query parameter is required",
            status: 400,
        };
    }

    if (!isValidMarketId(marketId)) {
        return {
            isValid: false,
            error: "Invalid market ID format",
            status: 400,
        };
    }

    // Validate wallet address if provided
    if (walletAddress && !isAddress(walletAddress)) {
        return {
            isValid: false,
            error: "Invalid wallet address format",
            status: 400,
        };
    }

    return {
        isValid: true,
        marketId,
        walletAddress: walletAddress || undefined,
    };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
    const connId = generateConnectionId();
    const startTime = Date.now();

    try {
        // ====== STEP 1: Validate request ======
        const validation = validateRequest(request);

        if (!validation.isValid) {
            return new NextResponse(validation.error, {
                status: validation.status || 400,
                headers: {
                    "Content-Type": "text/plain",
                },
            });
        }

        const { marketId, walletAddress } = validation;

        logInfo("SSE connection requested", {
            connId,
            marketId,
            walletAddress: walletAddress?.slice(0, 8),
        });

        // ====== STEP 2: Verify market exists ======
        const market = await db.market.findUnique({
            where: { marketId: marketId! },
        });

        if (!market) {
            logError("Market not found", {
                connId,
                marketId,
                error: "MARKET_NOT_FOUND",
            });

            return new NextResponse(
                formatSSEError("Market not found", "MARKET_NOT_FOUND"),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    },
                }
            );
        }

        // ====== STEP 3: Register connection ======
        registerConnection(connId, marketId!, walletAddress);

        logInfo("SSE connection established", {
            connId,
            marketId,
            walletAddress: walletAddress?.slice(0, 8),
        });

        // ====== STEP 4: Create streaming response ======
        const encoder = new TextEncoder();
        let isStreamClosed = false;

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial market state
                    let prevYesPool = market.yesPool;
                    let prevNoPool = market.noPool;

                    // Poll interval (every 2 seconds)
                    const pollInterval = setInterval(async () => {
                        if (isStreamClosed) {
                            clearInterval(pollInterval);
                            return;
                        }

                        try {
                            // Update heartbeat
                            updateHeartbeat(connId);

                            // Fetch current market state
                            const currentMarket = await db.market.findUnique({
                                where: { marketId: marketId! },
                            });

                            if (!currentMarket) {
                                controller.enqueue(
                                    encoder.encode(
                                        formatSSEError(
                                            "Market was deleted",
                                            "MARKET_DELETED"
                                        )
                                    )
                                );
                                clearInterval(pollInterval);
                                controller.close();
                                return;
                            }

                            // Check if pools changed
                            if (
                                currentMarket.yesPool !== prevYesPool ||
                                currentMarket.noPool !== prevNoPool ||
                                currentMarket.status !== market.status
                            ) {
                                prevYesPool = currentMarket.yesPool;
                                prevNoPool = currentMarket.noPool;

                                // Fetch updated bet count
                                const totalBets = await db.bet.count({
                                    where: { marketId: marketId! },
                                });

                                // Calculate percentages
                                const { yesPercent, noPercent } =
                                    calculatePoolPercentages(
                                        currentMarket.yesPool,
                                        currentMarket.noPool
                                    );

                                // Send pool update
                                controller.enqueue(
                                    encoder.encode(
                                        formatSSEEvent("POOL_UPDATE", {
                                            marketId,
                                            yesPool: formatUSDT(currentMarket.yesPool),
                                            noPool: formatUSDT(currentMarket.noPool),
                                            totalPool: formatUSDT(
                                                currentMarket.yesPool +
                                                currentMarket.noPool
                                            ),
                                            yesPercent: Number(yesPercent.toFixed(2)),
                                            noPercent: Number(noPercent.toFixed(2)),
                                            totalBets,
                                            timestamp: Date.now(),
                                        })
                                    )
                                );

                                // If market status changed, send market update
                                if (currentMarket.status !== market.status) {
                                    const timeRemaining = Math.max(
                                        0,
                                        Math.floor(
                                            (currentMarket.endDate.getTime() -
                                                Date.now()) /
                                            1000
                                        )
                                    );

                                    controller.enqueue(
                                        encoder.encode(
                                            formatSSEEvent("MARKET_UPDATE", {
                                                marketId,
                                                status: currentMarket.status,
                                                winner: currentMarket.winner,
                                                timeRemaining,
                                                hasEnded: timeRemaining === 0,
                                                timestamp: Date.now(),
                                            })
                                        )
                                    );
                                }
                            } else {
                                // Send heartbeat to keep connection alive
                                controller.enqueue(
                                    encoder.encode(
                                        formatSSEHeartbeat(Date.now())
                                    )
                                );
                            }
                        } catch (error) {
                            logError("Error polling market", {
                                connId,
                                marketId,
                                error: (error as Error).message,
                            });

                            controller.enqueue(
                                encoder.encode(
                                    formatSSEError(
                                        "Error polling market",
                                        "POLL_ERROR"
                                    )
                                )
                            );
                        }
                    }, 2000);

                    // Handle disconnection
                    request.signal.addEventListener("abort", () => {
                        isStreamClosed = true;
                        clearInterval(pollInterval);
                        unregisterConnection(connId);

                        const duration = Date.now() - startTime;
                        logInfo("SSE connection closed", {
                            connId,
                            marketId,
                            duration,
                        });
                    });
                } catch (error) {
                    logError("Error in SSE stream", {
                        connId,
                        marketId,
                        error: (error as Error).message,
                    });

                    controller.enqueue(
                        encoder.encode(
                            formatSSEError(
                                "Internal server error",
                                "INTERNAL_ERROR"
                            )
                        )
                    );
                    controller.close();
                }
            },
        });

        // ====== STEP 5: Return streaming response ======
        return new NextResponse(stream, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                // CORS headers
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
            },
        });
    } catch (error) {
        logError("Unexpected error in SSE handler", {
            connId,
            error: (error as Error).message,
        });

        unregisterConnection(connId);

        return new NextResponse(
            formatSSEError("Internal server error", "INTERNAL_ERROR"),
            {
                status: 500,
                headers: {
                    "Content-Type": "text/event-stream",
                },
            }
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
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    });
}

// ============================================================================
// METRICS & MONITORING
// ============================================================================

/**
 * TODO: Add connection metrics
 * 
 * Track:
 * - Active SSE connections
 * - Connection duration
 * - Messages sent per connection
 * - Disconnection reasons
 * - Error rate
 */

/**
 * TODO: Add health check endpoint
 * 
 * GET /api/markets/live-stats/health
 * Returns: {active_connections, uptime, latency}
 */

/**
 * TODO: Add request deduplication
 * 
 * If same market is requested multiple times,
 * share the same polling interval instead of polling N times
 */