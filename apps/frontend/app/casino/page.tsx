"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@/app/components/wallet/ConnectButton";
import { useAppKitAccount } from "@reown/appkit/react";
import { useCasinoBet, CasinoGame, getCasinoErrorMessage } from "@/lib/hooks/useCasinoBet";
import { toast } from "sonner";

// Casino games configuration
const casinoGames = [
    { 
        icon: "🎲", 
        name: "Roulette", 
        game: CasinoGame.ROULETTE, 
        minBet: 1, 
        maxBet: 100, 
        payout: "35:1",
        description: "Pick number 0-36",
        predictionRange: { min: 0, max: 36 }
    },
    { 
        icon: "🎯", 
        name: "Dice", 
        game: CasinoGame.DICE, 
        minBet: 1, 
        maxBet: 200, 
        payout: "5:1",
        description: "Roll 1-6",
        predictionRange: { min: 1, max: 6 }
    },
    { 
        icon: "🪙", 
        name: "Coin Flip", 
        game: CasinoGame.COIN_FLIP, 
        minBet: 1, 
        maxBet: 500, 
        payout: "1.95:1",
        description: "Heads (0) or Tails (1)",
        predictionRange: { min: 0, max: 1 },
        options: ["Heads", "Tails"]
    },
    { 
        icon: "🔝", 
        name: "High-Low", 
        game: CasinoGame.HIGH_LOW_DICE, 
        minBet: 1, 
        maxBet: 1000, 
        payout: "1.9:1",
        description: "Low (0) or High (1)",
        predictionRange: { min: 0, max: 1 },
        options: ["Low (1-3)", "High (4-6)"]
    },
];

const navItems: { name: string; path: Route }[] = [
    { name: "Home", path: "/" as Route },
    { name: "Sports", path: "/sports" as Route },
    { name: "Esports", path: "/esports" as Route },
    { name: "Casino", path: "/casino" as Route },
    { name: "Prediction", path: "/prediction" as Route },
];

export default function CasinoPage() {
    const pathname = usePathname();
    const { address: userAddress, isConnected } = useAppKitAccount();
    const { placeBet, approveUSDT, isPending, isConfirming, isApproving, error, result, reset } = useCasinoBet();

    // Game state
    const [selectedGame, setSelectedGame] = useState(0);
    const [betAmount, setBetAmount] = useState<string>("10");
    const [prediction, setPrediction] = useState<string>("7");
    const [currentTime, setCurrentTime] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    const currentGameConfig = casinoGames[selectedGame];

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
            setCurrentDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Reset prediction when game changes
    useEffect(() => {
        const config = casinoGames[selectedGame];
        setPrediction(config.predictionRange.min.toString());
    }, [selectedGame]);

    const handleApprove = useCallback(async () => {
        console.log("🔐 Approving USDT...", { isConnected, userAddress });
        
        if (!isConnected || !userAddress) {
            toast.error("Please connect your wallet first");
            return;
        }
        
        const success = await approveUSDT();
        if (success) {
            toast.success("✅ USDT Approved!", {
                description: "You can now place bets",
                style: {
                    background: 'linear-gradient(135deg, rgba(31, 61, 43, 0.95), rgba(10, 14, 12, 0.95))',
                    color: '#f3ebdd',
                    border: '1px solid #c2a14d',
                },
            });
        }
    }, [approveUSDT, isConnected, userAddress]);

    const handlePlaceBet = useCallback(async () => {
        console.log("🎰 Placing bet...", { 
            game: currentGameConfig.name, 
            amount: betAmount, 
            prediction,
            isConnected,
            userAddress 
        });

        if (!isConnected || !userAddress) {
            toast.error("Please connect your wallet first", {
                description: "Click the wallet button in the top right",
                style: {
                    background: '#1f3d2b',
                    color: '#f3ebdd',
                    border: '1px solid #c2a14d',
                },
            });
            return;
        }

        const amount = parseFloat(betAmount);
        const pred = parseInt(prediction);

        if (!amount || amount < currentGameConfig.minBet) {
            toast.error(`Minimum bet is ${currentGameConfig.minBet} USDT`);
            return;
        }

        if (amount > currentGameConfig.maxBet) {
            toast.error(`Maximum bet is ${currentGameConfig.maxBet} USDT`);
            return;
        }

        if (pred < currentGameConfig.predictionRange.min || pred > currentGameConfig.predictionRange.max) {
            toast.error(`Invalid prediction. Must be ${currentGameConfig.predictionRange.min}-${currentGameConfig.predictionRange.max}`);
            return;
        }

        const result = await placeBet(currentGameConfig.game, amount, pred);

        if (result.success) {
            toast.success("🎉 Bet Placed!", {
                description: `${currentGameConfig.name} • ${amount} USDT`,
                style: {
                    background: 'linear-gradient(135deg, rgba(31, 61, 43, 0.95), rgba(10, 14, 12, 0.95))',
                    color: '#f3ebdd',
                    border: '1px solid #c2a14d',
                },
                duration: 5000,
            });
        }
    }, [currentGameConfig, betAmount, prediction, isConnected, userAddress, placeBet]);

    const isActiveNav = (path: string) => {
        if (path === "/") return pathname === "/";
        return pathname?.startsWith(path);
    };

    const panelClass =
        "relative rounded-3xl bg-[linear-gradient(135deg,rgba(10,14,12,0.55),rgba(10,14,12,0.22))] " +
        "backdrop-blur-md shadow-[0_40px_120px_rgba(0,0,0,0.55)] ring-1 ring-[#B08D57]/12 border border-[#B08D57]/45";

    const innerBorder = <div className="pointer-events-none absolute inset-[10px] rounded-2xl border border-[#C2A14D]/16" />;

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-[#1F3D2B]" />
            <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_35%,rgba(243,235,221,0.10),rgba(31,61,43,0.65),rgba(10,14,12,0.92))]" />
            <div className="absolute inset-0 opacity-10 mix-blend-soft-light eh-wallpaper" />
            <div className="absolute inset-0 opacity-10 eh-decoLines" />

            <div className="relative z-10 px-4 md:px-8 py-10">
                <header className={`${panelClass} px-6 py-5`}>
                    {innerBorder}
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="min-w-0">
                            <Link href={"/" as Route} className="group inline-block">
                                <div className="flex items-baseline gap-3">
                                    <span className="font-serif text-2xl md:text-3xl tracking-[0.12em] text-[#F3EBDD]">
                                        Bet Bazzar
                                    </span>
                                    <span className="hidden sm:inline text-[11px] tracking-[0.45em] uppercase text-[#B08D57]/80">
                                        Blockchain Betting
                                    </span>
                                </div>
                                <div className="mt-1 text-[11px] tracking-[0.34em] uppercase text-[#D8CFC0]/50">
                                    Quiet Confidence • Reliable Odds
                                </div>
                            </Link>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full px-3 py-2 border border-[#B08D57]/30 bg-[#0A0E0C]/14">
                                    <span className="inline-block h-2 w-2 rounded-full bg-[#C2A14D] shadow-[0_0_18px_rgba(194,161,77,0.40)]" />
                                    <span className="text-[11px] tracking-[0.28em] uppercase text-[#D8CFC0]/70">
                                        Casino Live • {currentDate} • {currentTime}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <nav className="flex flex-wrap items-center gap-2">
                            {navItems.map((item) => {
                                const isActive = isActiveNav(item.path as string);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        className={[
                                            "relative rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em] transition border",
                                            isActive
                                                ? "border-[#C2A14D]/65 text-[#F3EBDD] bg-[linear-gradient(180deg,rgba(194,161,77,0.16),rgba(176,141,87,0.05))]"
                                                : "border-[#B08D57]/30 text-[#D8CFC0]/65 bg-[#0A0E0C]/10 hover:text-[#F3EBDD] hover:border-[#C2A14D]/45",
                                        ].join(" ")}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                            <ConnectButton />
                        </nav>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Game Selection */}
                        <div className={`${panelClass} p-6`}>
                            {innerBorder}
                            <h2 className="text-xl font-bold text-[#F3EBDD] mb-4">Select Game</h2>
                            <div className="space-y-3">
                                {casinoGames.map((game, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedGame(idx)}
                                        className={`w-full p-4 rounded-xl border transition ${
                                            selectedGame === idx
                                                ? "border-[#C2A14D] bg-[rgba(194,161,77,0.1)]"
                                                : "border-[#B08D57]/30 bg-[rgba(10,14,12,0.2)] hover:border-[#C2A14D]/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{game.icon}</span>
                                            <div className="text-left flex-1">
                                                <div className="font-bold text-[#F3EBDD]">{game.name}</div>
                                                <div className="text-xs text-[#D8CFC0]/60">{game.description}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-[#C2A14D]">{game.payout}</div>
                                                <div className="text-xs text-[#D8CFC0]/60">{game.minBet}-{game.maxBet} USDT</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Center: Betting Interface */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className={`${panelClass} p-6`}>
                                {innerBorder}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#F3EBDD]">{currentGameConfig.icon} {currentGameConfig.name}</h2>
                                        <p className="text-sm text-[#D8CFC0]/70 mt-1">{currentGameConfig.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-[#D8CFC0]/60">Payout</div>
                                        <div className="text-2xl font-bold text-[#C2A14D]">{currentGameConfig.payout}</div>
                                    </div>
                                </div>

                                {!isConnected ? (
                                    <div className="text-center py-12">
                                        <div className="text-[#D8CFC0]/60 mb-4">Connect your wallet to start betting</div>
                                        <ConnectButton />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Bet Amount */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-bold text-[#F3EBDD]">Bet Amount (USDT)</label>
                                                <span className="text-xs text-[#D8CFC0]/60">
                                                    Min: {currentGameConfig.minBet} • Max: {currentGameConfig.maxBet}
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                value={betAmount}
                                                onChange={(e) => setBetAmount(e.target.value)}
                                                min={currentGameConfig.minBet}
                                                max={currentGameConfig.maxBet}
                                                step="1"
                                                className="w-full px-4 py-3 rounded-xl border border-[#B08D57]/30 bg-[rgba(10,14,12,0.3)] text-[#F3EBDD] focus:border-[#C2A14D] focus:outline-none"
                                                placeholder={`${currentGameConfig.minBet}-${currentGameConfig.maxBet}`}
                                            />
                                        </div>

                                        {/* Prediction */}
                                        <div>
                                            <label className="text-sm font-bold text-[#F3EBDD] mb-2 block">Your Prediction</label>
                                            {currentGameConfig.options ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {currentGameConfig.options.map((option, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setPrediction(idx.toString())}
                                                            className={`p-4 rounded-xl border transition ${
                                                                prediction === idx.toString()
                                                                    ? "border-[#C2A14D] bg-[rgba(194,161,77,0.1)]"
                                                                    : "border-[#B08D57]/30 bg-[rgba(10,14,12,0.2)] hover:border-[#C2A14D]/50"
                                                            }`}
                                                        >
                                                            <div className="font-bold text-[#F3EBDD]">{option}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={prediction}
                                                    onChange={(e) => setPrediction(e.target.value)}
                                                    min={currentGameConfig.predictionRange.min}
                                                    max={currentGameConfig.predictionRange.max}
                                                    className="w-full px-4 py-3 rounded-xl border border-[#B08D57]/30 bg-[rgba(10,14,12,0.3)] text-[#F3EBDD] focus:border-[#C2A14D] focus:outline-none"
                                                    placeholder={`${currentGameConfig.predictionRange.min}-${currentGameConfig.predictionRange.max}`}
                                                />
                                            )}
                                        </div>

                                        {/* Error Display */}
                                        {error && (
                                            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30">
                                                <p className="text-sm text-red-400">{getCasinoErrorMessage(error, null)}</p>
                                            </div>
                                        )}

                                        {/* Result Display */}
                                        {result && (
                                            <div className={`p-6 rounded-xl border-2 ${
                                                result.outcome === 0 
                                                    ? "bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/50" 
                                                    : "bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/50"
                                            }`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="text-2xl font-bold text-white">
                                                        {result.outcome === 0 ? "🎉 YOU WON!" : "😔 YOU LOST"}
                                                    </div>
                                                    <button
                                                        onClick={reset}
                                                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="space-y-3 text-white">
                                                    <div className="flex justify-between items-center p-3 rounded-lg bg-black/20">
                                                        <span className="text-sm opacity-80">Your Prediction:</span>
                                                        <span className="font-bold text-lg">{prediction}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 rounded-lg bg-black/20">
                                                        <span className="text-sm opacity-80">Result:</span>
                                                        <span className="font-bold text-lg">{result.randomNumber}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 rounded-lg bg-black/20">
                                                        <span className="text-sm opacity-80">Bet Amount:</span>
                                                        <span className="font-bold text-lg">{betAmount} USDT</span>
                                                    </div>
                                                    {result.outcome === 0 && result.payout && (
                                                        <div className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30">
                                                            <span className="text-sm font-bold">💰 Payout:</span>
                                                            <span className="font-bold text-2xl text-green-400">{result.payout} USDT</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        reset();
                                                        setBetAmount("10");
                                                        setPrediction(currentGameConfig.predictionRange.min.toString());
                                                    }}
                                                    className="w-full mt-4 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition"
                                                >
                                                    Place Another Bet
                                                </button>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleApprove}
                                                disabled={isApproving}
                                                className="flex-1 px-6 py-4 rounded-xl border border-[#B08D57]/60 bg-[linear-gradient(180deg,rgba(176,141,87,0.14),rgba(176,141,87,0.04))] text-[#F3EBDD] font-bold hover:border-[#C2A14D] transition disabled:opacity-50"
                                            >
                                                {isApproving ? "Approving..." : "Approve USDT"}
                                            </button>
                                            <button
                                                onClick={handlePlaceBet}
                                                disabled={isPending || isConfirming || !betAmount || !prediction}
                                                className="flex-1 px-6 py-4 rounded-xl border border-[#C2A14D]/60 bg-[linear-gradient(180deg,rgba(194,161,77,0.14),rgba(194,161,77,0.04))] text-[#F3EBDD] font-bold hover:border-[#C2A14D] transition disabled:opacity-50"
                                            >
                                                {isPending ? "Signing..." : isConfirming ? "Confirming..." : "Place Bet"}
                                            </button>
                                        </div>

                                        <p className="text-xs text-center text-[#D8CFC0]/50">
                                            3 second cooldown between bets • House edge varies by game
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Game Info */}
                            <div className={`${panelClass} p-6`}>
                                {innerBorder}
                                <h3 className="text-lg font-bold text-[#F3EBDD] mb-4">How to Play</h3>
                                <div className="space-y-3 text-sm text-[#D8CFC0]/70">
                                    <div>
                                        <strong className="text-[#F3EBDD]">1. Select Game:</strong> Choose from Roulette, Dice, Coin Flip, or High/Low
                                    </div>
                                    <div>
                                        <strong className="text-[#F3EBDD]">2. Enter Amount:</strong> Bet between {currentGameConfig.minBet}-{currentGameConfig.maxBet} USDT
                                    </div>
                                    <div>
                                        <strong className="text-[#F3EBDD]">3. Make Prediction:</strong> {currentGameConfig.description}
                                    </div>
                                    <div>
                                        <strong className="text-[#F3EBDD]">4. Approve & Bet:</strong> Approve USDT once, then place bets
                                    </div>
                                    <div>
                                        <strong className="text-[#F3EBDD]">5. Win:</strong> Get {currentGameConfig.payout} payout if you win!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .eh-wallpaper {
                    background-image: radial-gradient(circle at 25% 20%, rgba(194, 161, 77, 0.06), transparent 55%),
                        radial-gradient(circle at 70% 60%, rgba(15, 92, 74, 0.07), transparent 60%);
                }
                .eh-decoLines {
                    background-image: linear-gradient(to right, rgba(176, 141, 87, 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(176, 141, 87, 0.2) 1px, transparent 1px);
                    background-size: 60px 60px;
                }
            `}</style>
        </div>
    );
}
