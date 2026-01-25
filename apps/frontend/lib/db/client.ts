import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 * 
 * In Next.js development, hot-reloading can cause multiple Prisma client
 * instances to be created, which is inefficient and can cause issues.
 * 
 * This singleton pattern ensures only one Prisma client exists throughout
 * the application lifecycle.
 * 
 * Usage:
 * import { db } from "@/lib/db/client";
 * 
 * const market = await db.market.findUnique({
 *   where: { marketId: "some-market-id" }
 * });
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
    globalForPrisma.prisma ||
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the current market or null if none exists
 */
export async function getCurrentMarket() {
    try {
        const market = await db.market.findFirst({
            where: {
                status: {
                    in: ["ACTIVE", "CLOSED"],
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return market;
    } catch (error) {
        console.error("Error fetching current market:", error);
        return null;
    }
}

/**
 * Get market by ID
 */
export async function getMarketById(marketId: string) {
    try {
        const market = await db.market.findUnique({
            where: { marketId },
        });

        return market;
    } catch (error) {
        console.error(`Error fetching market ${marketId}:`, error);
        return null;
    }
}

/**
 * Get all bets for a wallet on a specific market
 */
export async function getUserBetsForMarket(
    walletAddress: string,
    marketId: string
) {
    try {
        const bets = await db.bet.findMany({
            where: {
                walletAddress,
                marketId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return bets;
    } catch (error) {
        console.error(
            `Error fetching bets for wallet ${walletAddress}:`,
            error
        );
        return [];
    }
}

/**
 * Get all bets for a wallet (across all markets)
 */
export async function getAllUserBets(walletAddress: string) {
    try {
        const bets = await db.bet.findMany({
            where: { walletAddress },
            include: {
                market: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return bets;
    } catch (error) {
        console.error(
            `Error fetching all bets for wallet ${walletAddress}:`,
            error
        );
        return [];
    }
}

/**
 * Get bet count for a wallet on a specific market
 */
export async function getUserBetCount(
    walletAddress: string,
    marketId: string
) {
    try {
        const count = await db.bet.count({
            where: {
                walletAddress,
                marketId,
            },
        });

        return count;
    } catch (error) {
        console.error(
            `Error counting bets for wallet ${walletAddress}:`,
            error
        );
        return 0;
    }
}

/**
 * Get total amount bet by wallet on a market
 */
export async function getUserTotalBetAmount(
    walletAddress: string,
    marketId: string
) {
    try {
        const result = await db.bet.aggregate({
            where: {
                walletAddress,
                marketId,
            },
            _sum: {
                amount: true,
            },
        });

        return result._sum.amount || BigInt(0);
    } catch (error) {
        console.error(
            `Error summing bets for wallet ${walletAddress}:`,
            error
        );
        return BigInt(0);
    }
}

/**
 * Get market pool information
 */
export async function getMarketPoolInfo(marketId: string) {
    try {
        const market = await db.market.findUnique({
            where: { marketId },
        });

        if (!market) {
            return null;
        }

        const totalPool = market.yesPool + market.noPool;
        const yesPercent =
            totalPool > 0n
                ? Number((market.yesPool * BigInt(100)) / totalPool)
                : 0;
        const noPercent =
            totalPool > 0n
                ? Number((market.noPool * BigInt(100)) / totalPool)
                : 0;

        return {
            marketId: market.marketId,
            yesPool: market.yesPool,
            noPool: market.noPool,
            totalPool,
            yesPercent,
            noPercent,
        };
    } catch (error) {
        console.error(`Error fetching pool info for market ${marketId}:`, error);
        return null;
    }
}

/**
 * Get all bets for a market
 */
export async function getMarketBets(marketId: string) {
    try {
        const bets = await db.bet.findMany({
            where: { marketId },
            orderBy: {
                createdAt: "desc",
            },
        });

        return bets;
    } catch (error) {
        console.error(`Error fetching bets for market ${marketId}:`, error);
        return [];
    }
}

/**
 * Check if wallet is flagged
 */
export async function isWalletFlagged(walletAddress: string) {
    try {
        const flagged = await db.flaggedWallet.findUnique({
            where: { wallet: walletAddress },
        });

        return flagged ? flagged.isActive : false;
    } catch (error) {
        console.error(
            `Error checking if wallet is flagged ${walletAddress}:`,
            error
        );
        return false;
    }
}

/**
 * Get flagged wallet details
 */
export async function getFlaggedWalletDetails(walletAddress: string) {
    try {
        const flagged = await db.flaggedWallet.findUnique({
            where: { wallet: walletAddress },
        });

        return flagged;
    } catch (error) {
        console.error(
            `Error fetching flagged wallet details ${walletAddress}:`,
            error
        );
        return null;
    }
}

/**
 * Get recent pool snapshots for a market
 */
export async function getMarketPoolSnapshots(
    marketId: string,
    limit: number = 50
) {
    try {
        const snapshots = await db.poolSnapshot.findMany({
            where: { marketId },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        return snapshots;
    } catch (error) {
        console.error(
            `Error fetching pool snapshots for market ${marketId}:`,
            error
        );
        return [];
    }
}

/**
 * Get bet history for a specific bet (audit trail)
 */
export async function getBetHistory(betId: string) {
    try {
        const history = await db.betHistory.findMany({
            where: { betId },
            orderBy: {
                createdAt: "asc",
            },
        });

        return history;
    } catch (error) {
        console.error(`Error fetching history for bet ${betId}:`, error);
        return [];
    }
}

/**
 * Get all history for a wallet on a market (for auditing)
 */
export async function getWalletMarketHistory(
    walletAddress: string,
    marketId: string
) {
    try {
        const history = await db.betHistory.findMany({
            where: {
                wallet: walletAddress,
                marketId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return history;
    } catch (error) {
        console.error(
            `Error fetching history for wallet ${walletAddress}:`,
            error
        );
        return [];
    }
}

/**
 * Detect suspicious wallet patterns
 * Returns bets in current market with velocity indicators
 */
export async function detectWalletVelocity(
    walletAddress: string,
    marketId: string
) {
    try {
        // Get all bets from this wallet in the last hour
        const oneHourAgo = new Date(Date.now() - 3600000);

        const recentBets = await db.bet.findMany({
            where: {
                walletAddress,
                marketId,
                createdAt: {
                    gte: oneHourAgo,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            betCount: recentBets.length,
            bets: recentBets,
            isHighVelocity: recentBets.length >= 3, // 3+ bets in 1 hour
        };
    } catch (error) {
        console.error(
            `Error detecting velocity for wallet ${walletAddress}:`,
            error
        );
        return {
            betCount: 0,
            bets: [],
            isHighVelocity: false,
        };
    }
}

/**
 * Get wallet concentration for a market
 */
export async function getWalletConcentration(
    walletAddress: string,
    marketId: string
) {
    try {
        const market = await db.market.findUnique({
            where: { marketId },
        });

        if (!market) {
            return null;
        }

        const walletTotal = await getUserTotalBetAmount(walletAddress, marketId);
        const totalPool = market.yesPool + market.noPool;

        const concentrationPercent =
            totalPool > 0n
                ? Number((walletTotal * BigInt(100)) / totalPool)
                : 0;

        return {
            walletTotal,
            totalPool,
            concentrationPercent,
            isOverCap: concentrationPercent > 10, // 10% cap
        };
    } catch (error) {
        console.error(
            `Error getting concentration for wallet ${walletAddress}:`,
            error
        );
        return null;
    }
}