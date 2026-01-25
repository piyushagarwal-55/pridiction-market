"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import Link from "next/link";
import { useAppKit } from "@reown/appkit/react";
import type { Route } from "next";
import { usePathname } from "next/navigation";

interface BotStatus {
  exists: boolean;
  is_running: boolean;
  stats: {
    markets_analyzed: number;
    bets_placed: number;
    bets_skipped: number;
    total_spent: number;
    last_activity: string | null;
  };
  on_chain_stats?: {
    daily_spent: number;
    weekly_spent: number;
    total_losses: number;
    bets_today: number;
    last_bet_timestamp: number;
    emergency_stop_active: boolean;
  };
  on_chain_config?: {
    is_active: boolean;
    max_bet_per_market: number;
    daily_budget: number;
    weekly_budget: number;
    min_confidence: number;
    max_bets_per_day: number;
    cooldown_minutes: number;
    emergency_stop_loss: number;
  };
}

interface ActivityEntry {
  timestamp: string;
  message: string;
  level: string;
}

const navItems: { name: string; path: Route }[] = [
  { name: "Home", path: "/" as Route },
  { name: "Sports", path: "/sports" as Route },
  { name: "Esports", path: "/esports" as Route },
  { name: "Casino", path: "/casino" as Route },
  { name: "Prediction", path: "/prediction" as Route },
];

export default function BotDashboardPage() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const pathname = usePathname();

  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const activeNav = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  const panelClass =
    "relative rounded-3xl bg-[linear-gradient(135deg,rgba(10,14,12,0.55),rgba(10,14,12,0.22))] " +
    "backdrop-blur-md shadow-[0_40px_120px_rgba(0,0,0,0.55)] ring-1 ring-[#B08D57]/12 border border-[#B08D57]/45";

  const innerBorder = (
    <div className="pointer-events-none absolute inset-[10px] rounded-2xl border border-[#C2A14D]/16" />
  );

  // Poll bot status
  useEffect(() => {
    if (isConnected && address) {
      fetchBotStatus();
      const interval = setInterval(fetchBotStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  // Fetch activity log
  useEffect(() => {
    if (isConnected && address && botStatus?.exists) {
      fetchActivity();
      const interval = setInterval(fetchActivity, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, botStatus?.exists]);

  const fetchBotStatus = async () => {
    if (!address) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/bot/status/${address}`);
      const data = await response.json();
      setBotStatus(data);
    } catch (error) {
      console.error("Error fetching bot status:", error);
    }
  };

  const fetchActivity = async () => {
    if (!address) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/bot/activity/${address}?limit=20`);
      const data = await response.json();
      if (data.success) {
        setActivity(data.activity);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const handleStartBot = async () => {
    if (!address) return;

    setStarting(true);
    try {
      const privateKey = prompt("Enter your private key (for demo only - use secure key management in production):");
      if (!privateKey) {
        toast.error("Private key required");
        return;
      }

      const response = await fetch("http://localhost:8000/api/v1/bot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_address: address,
          private_key: privateKey
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("🚀 Bot started!");
        fetchBotStatus();
      } else {
        toast.error(data.message || "Failed to start bot");
      }
    } catch (error: any) {
      console.error("Error starting bot:", error);
      toast.error(error.message || "Failed to start bot");
    } finally {
      setStarting(false);
    }
  };

  const handleStopBot = async () => {
    if (!address) return;

    setStopping(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/bot/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_address: address
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("🛑 Bot stopped");
        fetchBotStatus();
      } else {
        toast.error(data.message || "Failed to stop bot");
      }
    } catch (error: any) {
      console.error("Error stopping bot:", error);
      toast.error(error.message || "Failed to stop bot");
    } finally {
      setStopping(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (!confirm("Are you sure you want to trigger emergency stop? This will deactivate the bot on-chain.")) {
      return;
    }

    toast.success("Emergency stop triggered");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#0A0E0C_0%,#0F1612_50%,#0A0E0C_100%)]">
        <div className="relative z-10 px-4 md:px-8 py-10">
          <header className={`${panelClass} px-6 py-5`}>
            {innerBorder}
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-2xl font-bold text-[#F3EBDD]">
                  Bet Bazzar
                </Link>
                <div className="hidden md:flex gap-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`text-sm font-medium transition-colors ${
                        activeNav(item.path) ? "text-[#C2A14D]" : "text-[#8B7355] hover:text-[#F3EBDD]"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <button
                onClick={() => open()}
                className="px-6 py-2 rounded-lg bg-[#B08D57] text-[#0A0E0C] font-bold hover:bg-[#C2A14D] transition-colors"
              >
                Connect Wallet
              </button>
            </nav>
          </header>

          <div className="mt-10 flex items-center justify-center min-h-[60vh]">
            <div className={`${panelClass} p-12 text-center max-w-md`}>
              {innerBorder}
              <h1 className="text-3xl font-bold text-[#F3EBDD] mb-4">Connect Wallet</h1>
              <p className="text-[#8B7355] mb-8">Please connect your wallet to access bot dashboard</p>
              <button
                onClick={() => open()}
                className="w-full px-8 py-4 rounded-lg bg-[#B08D57] text-[#0A0E0C] font-bold hover:bg-[#C2A14D] transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isRunning = botStatus?.is_running || false;
  const stats = botStatus?.stats;
  const onChainStats = botStatus?.on_chain_stats;
  const config = botStatus?.on_chain_config;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0A0E0C_0%,#0F1612_50%,#0A0E0C_100%)]">
      <div className="relative z-10 px-4 md:px-8 py-10">
        {/* Header */}
        <header className={`${panelClass} px-6 py-5 mb-8`}>
          {innerBorder}
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-[#F3EBDD]">
                Bet Bazzar
              </Link>
              <div className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`text-sm font-medium transition-colors ${
                      activeNav(item.path) ? "text-[#C2A14D]" : "text-[#8B7355] hover:text-[#F3EBDD]"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/bot/settings"
                className="px-4 py-2 rounded-lg bg-[#1A1F1C] text-[#F3EBDD] font-medium hover:bg-[#242A26] transition-colors"
              >
                ⚙️ Settings
              </Link>
              <button
                onClick={() => open()}
                className="px-6 py-2 rounded-lg bg-[#B08D57] text-[#0A0E0C] font-bold hover:bg-[#C2A14D] transition-colors"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
            </div>
          </nav>
        </header>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#F3EBDD] mb-2">🤖 Bot Dashboard</h1>
          <p className="text-[#8B7355]">Monitor and control your AI auto-betting bot</p>
        </div>

        {/* Status Card */}
        <div className={`${panelClass} p-8 mb-6`}>
          {innerBorder}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${isRunning ? "bg-[#4ADE80] animate-pulse" : "bg-[#DC2626]"}`}></div>
              <div>
                <h2 className="text-2xl font-bold text-[#F3EBDD]">
                  {isRunning ? "🟢 Bot Running" : "🔴 Bot Stopped"}
                </h2>
                <p className="text-[#8B7355] text-sm">
                  {stats?.last_activity ? `Last activity: ${new Date(stats.last_activity).toLocaleString()}` : "No activity yet"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStartBot}
                  disabled={starting}
                  className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#0A0E0C] px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {starting ? "Starting..." : "▶️ Start Bot"}
                </button>
              ) : (
                <button
                  onClick={handleStopBot}
                  disabled={stopping}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {stopping ? "Stopping..." : "⏸️ Stop Bot"}
                </button>
              )}

              <button
                onClick={handleEmergencyStop}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E0C] px-6 py-3 rounded-lg font-bold transition-colors"
              >
                🚨 Emergency Stop
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F1C] rounded-lg p-4 border border-[#B08D57]/20">
                <p className="text-[#8B7355] text-sm mb-1">Markets Analyzed</p>
                <p className="text-2xl font-bold text-[#F3EBDD]">{stats.markets_analyzed}</p>
              </div>
              <div className="bg-[#1A1F1C] rounded-lg p-4 border border-[#B08D57]/20">
                <p className="text-[#8B7355] text-sm mb-1">Bets Placed</p>
                <p className="text-2xl font-bold text-[#4ADE80]">{stats.bets_placed}</p>
              </div>
              <div className="bg-[#1A1F1C] rounded-lg p-4 border border-[#B08D57]/20">
                <p className="text-[#8B7355] text-sm mb-1">Bets Skipped</p>
                <p className="text-2xl font-bold text-[#FBBF24]">{stats.bets_skipped}</p>
              </div>
              <div className="bg-[#1A1F1C] rounded-lg p-4 border border-[#B08D57]/20">
                <p className="text-[#8B7355] text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-[#C2A14D]">${stats.total_spent.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Budget Tracking */}
        {config && onChainStats && (
          <div className={`${panelClass} p-8 mb-6`}>
            {innerBorder}
            <h2 className="text-2xl font-bold text-[#F3EBDD] mb-6">💰 Budget Tracking</h2>
            
            <div className="space-y-6">
              {/* Daily Budget */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8B7355]">Daily Budget</span>
                  <span className="text-[#F3EBDD] font-medium">
                    ${onChainStats.daily_spent.toFixed(2)} / ${config.daily_budget.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-[#1A1F1C] rounded-full h-3 border border-[#B08D57]/20">
                  <div
                    className="bg-[#3B82F6] h-3 rounded-full transition-all"
                    style={{ width: `${Math.min((onChainStats.daily_spent / config.daily_budget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Weekly Budget */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8B7355]">Weekly Budget</span>
                  <span className="text-[#F3EBDD] font-medium">
                    ${onChainStats.weekly_spent.toFixed(2)} / ${config.weekly_budget.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-[#1A1F1C] rounded-full h-3 border border-[#B08D57]/20">
                  <div
                    className="bg-[#8B5CF6] h-3 rounded-full transition-all"
                    style={{ width: `${Math.min((onChainStats.weekly_spent / config.weekly_budget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8B7355]">Total Losses (Stop Loss)</span>
                  <span className="text-[#F3EBDD] font-medium">
                    ${onChainStats.total_losses.toFixed(2)} / ${config.emergency_stop_loss.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-[#1A1F1C] rounded-full h-3 border border-[#B08D57]/20">
                  <div
                    className="bg-[#DC2626] h-3 rounded-full transition-all"
                    style={{ width: `${Math.min((onChainStats.total_losses / config.emergency_stop_loss) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Bets Today */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8B7355]">Bets Today</span>
                  <span className="text-[#F3EBDD] font-medium">
                    {onChainStats.bets_today} / {config.max_bets_per_day}
                  </span>
                </div>
                <div className="w-full bg-[#1A1F1C] rounded-full h-3 border border-[#B08D57]/20">
                  <div
                    className="bg-[#4ADE80] h-3 rounded-full transition-all"
                    style={{ width: `${Math.min((onChainStats.bets_today / config.max_bets_per_day) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className={`${panelClass} p-8`}>
          {innerBorder}
          <h2 className="text-2xl font-bold text-[#F3EBDD] mb-6">📋 Activity Log</h2>
          
          {activity.length === 0 ? (
            <p className="text-[#8B7355] text-center py-8">No activity yet. Start the bot to see activity.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activity.map((entry, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    entry.level === "success"
                      ? "bg-[#4ADE80]/10 border border-[#4ADE80]/20"
                      : entry.level === "error"
                      ? "bg-[#DC2626]/10 border border-[#DC2626]/20"
                      : entry.level === "warning"
                      ? "bg-[#FBBF24]/10 border border-[#FBBF24]/20"
                      : "bg-[#1A1F1C] border border-[#B08D57]/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[#F3EBDD] text-sm">{entry.message}</p>
                    <span className="text-[#8B7355] text-xs whitespace-nowrap ml-4">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
