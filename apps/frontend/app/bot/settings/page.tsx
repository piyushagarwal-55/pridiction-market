"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { CONTRACT_ADDRESSES } from "@/lib/config/constants";
import { useAppKit } from "@reown/appkit/react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const BOT_SETTINGS_ABI = [
  {
    name: "configureBotSettings",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_maxBetPerMarket", type: "uint256" },
      { name: "_dailyBudget", type: "uint256" },
      { name: "_weeklyBudget", type: "uint256" },
      { name: "_minConfidence", type: "uint256" },
      { name: "_maxBetsPerDay", type: "uint256" },
      { name: "_cooldownMinutes", type: "uint256" },
      { name: "_emergencyStopLoss", type: "uint256" },
      { name: "_allowedCategories", type: "string[]" }
    ],
    outputs: []
  },
  {
    name: "activateBot",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    name: "deactivateBot",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    name: "getBotConfig",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "isActive", type: "bool" },
      { name: "maxBetPerMarket", type: "uint256" },
      { name: "dailyBudget", type: "uint256" },
      { name: "weeklyBudget", type: "uint256" },
      { name: "minConfidence", type: "uint256" },
      { name: "maxBetsPerDay", type: "uint256" },
      { name: "cooldownMinutes", type: "uint256" },
      { name: "emergencyStopLoss", type: "uint256" }
    ]
  }
] as const;

const CATEGORIES = ["Sports", "Crypto", "Politics", "Entertainment", "Technology", "Finance"];

const navItems: { name: string; path: Route }[] = [
  { name: "Home", path: "/" as Route },
  { name: "Sports", path: "/sports" as Route },
  { name: "Esports", path: "/esports" as Route },
  { name: "Casino", path: "/casino" as Route },
  { name: "Prediction", path: "/prediction" as Route },
];

export default function BotSettingsPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { open } = useAppKit();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const pathname = usePathname();

  // Client-side only flag
  const [mounted, setMounted] = useState(false);

  // Form state
  const [maxBetPerMarket, setMaxBetPerMarket] = useState("50");
  const [dailyBudget, setDailyBudget] = useState("200");
  const [weeklyBudget, setWeeklyBudget] = useState("1000");
  const [minConfidence, setMinConfidence] = useState("70");
  const [maxBetsPerDay, setMaxBetsPerDay] = useState("10");
  const [cooldownMinutes, setCooldownMinutes] = useState("30");
  const [emergencyStopLoss, setEmergencyStopLoss] = useState("500");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Sports", "Crypto"]);

  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [botIsActive, setBotIsActive] = useState(false);
  const [activating, setActivating] = useState(false);

  // Set mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Settings saved on-chain!");
      setLoading(false);
      setActivating(false);
      loadConfig();
    }
  }, [isConfirmed]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || "Failed to save settings");
      setLoading(false);
      setActivating(false);
    }
  }, [writeError]);

  // Load existing config
  useEffect(() => {
    if (mounted && isConnected && address && publicClient) {
      loadConfig();
    }
  }, [mounted, isConnected, address, publicClient]);

  const loadConfig = async () => {
    // Temporarily disabled to fix build errors
    return;
    /*
    // Double check everything is ready
    if (!mounted || !address || !publicClient) {
      return;
    }

    setLoadingConfig(true);
    try {
      // Use type assertion to handle the publicClient type
      const client = publicClient as any;
      const config = await client.readContract({
        address: CONTRACT_ADDRESSES.BOT_SETTINGS as `0x${string}`,
        abi: BOT_SETTINGS_ABI,
        functionName: "getBotConfig",
        args: [address]
      }) as any[];

      setBotIsActive(config[0]);
      setMaxBetPerMarket(formatUnits(config[1], 6));
      setDailyBudget(formatUnits(config[2], 6));
      setWeeklyBudget(formatUnits(config[3], 6));
      setMinConfidence(config[4].toString());
      setMaxBetsPerDay(config[5].toString());
      setCooldownMinutes(config[6].toString());
      setEmergencyStopLoss(formatUnits(config[7], 6));

      toast.success("Settings loaded");
    } catch (error: any) {
      console.log("No existing config found");
    } finally {
      setLoadingConfig(false);
    }
    */
  };

  const handleSaveSettings = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect wallet");
      return;
    }

    const maxBet = parseFloat(maxBetPerMarket);
    const daily = parseFloat(dailyBudget);
    const weekly = parseFloat(weeklyBudget);
    const confidence = parseInt(minConfidence);
    const maxBets = parseInt(maxBetsPerDay);
    const cooldown = parseInt(cooldownMinutes);
    const stopLoss = parseFloat(emergencyStopLoss);

    if (maxBet < 5 || maxBet > 1000) {
      toast.error("Max bet must be between $5 and $1000");
      return;
    }

    if (confidence < 60 || confidence > 95) {
      toast.error("Confidence must be between 60% and 95%");
      return;
    }

    if (daily < maxBet) {
      toast.error("Daily budget must be >= max bet");
      return;
    }

    if (weekly < daily) {
      toast.error("Weekly budget must be >= daily budget");
      return;
    }

    if (maxBets < 1 || maxBets > 50) {
      toast.error("Max bets per day must be between 1 and 50");
      return;
    }

    if (cooldown < 5 || cooldown > 120) {
      toast.error("Cooldown must be between 5 and 120 minutes");
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error("Select at least one category");
      return;
    }

    setLoading(true);

    try {
      const maxBetWei = parseUnits(maxBetPerMarket, 6);
      const dailyWei = parseUnits(dailyBudget, 6);
      const weeklyWei = parseUnits(weeklyBudget, 6);
      const stopLossWei = parseUnits(emergencyStopLoss, 6);

      writeContract({
        address: CONTRACT_ADDRESSES.BOT_SETTINGS as `0x${string}`,
        abi: BOT_SETTINGS_ABI,
        functionName: "configureBotSettings",
        args: [
          maxBetWei,
          dailyWei,
          weeklyWei,
          BigInt(confidence),
          BigInt(maxBets),
          BigInt(cooldown),
          stopLossWei,
          selectedCategories
        ]
      });

      toast.info("Please confirm transaction in your wallet...");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
      setLoading(false);
    }
  };

  const handleActivateBot = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect wallet");
      return;
    }

    setActivating(true);
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.BOT_SETTINGS as `0x${string}`,
        abi: BOT_SETTINGS_ABI,
        functionName: "activateBot",
        args: []
      });

      toast.info("Please confirm activation in your wallet...");
    } catch (error: any) {
      console.error("Error activating bot:", error);
      toast.error(error.message || "Failed to activate bot");
      setActivating(false);
    }
  };

  const handleDeactivateBot = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect wallet");
      return;
    }

    setActivating(true);
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.BOT_SETTINGS as `0x${string}`,
        abi: BOT_SETTINGS_ABI,
        functionName: "deactivateBot",
        args: []
      });

      toast.info("Please confirm deactivation in your wallet...");
    } catch (error: any) {
      console.error("Error deactivating bot:", error);
      toast.error(error.message || "Failed to deactivate bot");
      setActivating(false);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
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
              <p className="text-[#8B7355] mb-8">Please connect your wallet to configure bot settings</p>
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
                href="/bot/dashboard"
                className="px-4 py-2 rounded-lg bg-[#1A1F1C] text-[#F3EBDD] font-medium hover:bg-[#242A26] transition-colors"
              >
                Dashboard
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
          <h1 className="text-4xl font-bold text-[#F3EBDD] mb-2">🤖 Bot Settings</h1>
          <p className="text-[#8B7355]">
            Configure your AI auto-betting bot. All settings are stored on-chain for transparency.
          </p>
        </div>

        {/* Bot Status Banner */}
        {botIsActive ? (
          <div className={`${panelClass} p-6 mb-8`}>
            {innerBorder}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#4ADE80] rounded-full animate-pulse"></div>
                <span className="text-[#4ADE80] font-medium">Bot is Active On-Chain</span>
              </div>
              <button
                onClick={handleDeactivateBot}
                disabled={activating}
                className="px-6 py-2 rounded-lg bg-[#DC2626] text-white font-medium hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
              >
                {activating ? "Deactivating..." : "Deactivate Bot"}
              </button>
            </div>
          </div>
        ) : (
          <div className={`${panelClass} p-6 mb-8`}>
            {innerBorder}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#FBBF24] rounded-full"></div>
                <span className="text-[#FBBF24] font-medium">Bot is Inactive - Activate to start betting</span>
              </div>
              <button
                onClick={handleActivateBot}
                disabled={activating}
                className="px-6 py-2 rounded-lg bg-[#4ADE80] text-[#0A0E0C] font-bold hover:bg-[#22C55E] transition-colors disabled:opacity-50"
              >
                {activating ? "Activating..." : "✅ Activate Bot"}
              </button>
            </div>
          </div>
        )}

        {loadingConfig && (
          <div className={`${panelClass} p-4 mb-6`}>
            {innerBorder}
            <p className="text-[#8B7355]">Loading your settings...</p>
          </div>
        )}

        {/* Settings Form */}
        <div className={`${panelClass} p-8`}>
          {innerBorder}
          <div className="space-y-8">
            {/* Bet Limits */}
            <div>
              <h2 className="text-2xl font-bold text-[#F3EBDD] mb-6">💰 Bet Limits</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#C2A14D] mb-2">
                    Max Bet Per Market (USDT)
                  </label>
                  <input
                    type="number"
                    value={maxBetPerMarket}
                    onChange={(e) => setMaxBetPerMarket(e.target.value)}
                    className="w-full bg-[#1A1F1C] border border-[#B08D57]/30 rounded-lg px-4 py-3 text-[#F3EBDD] focus:outline-none focus:border-[#C2A14D]"
                    min="5"
                    max="1000"
                  />
                  <p className="text-xs text-[#8B7355] mt-1">Min: $5, Max: $1000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C2A14D] mb-2">
                    Daily Budget (USDT)
                  </label>
                  <input
                    type="number"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(e.target.value)}
                    className="w-full bg-[#1A1F1C] border border-[#B08D57]/30 rounded-lg px-4 py-3 text-[#F3EBDD] focus:outline-none focus:border-[#C2A14D]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C2A14D] mb-2">
                    Weekly Budget (USDT)
                  </label>
                  <input
                    type="number"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(e.target.value)}
                    className="w-full bg-[#1A1F1C] border border-[#B08D57]/30 rounded-lg px-4 py-3 text-[#F3EBDD] focus:outline-none focus:border-[#C2A14D]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C2A14D] mb-2">
                    Emergency Stop Loss (USDT)
                  </label>
                  <input
                    type="number"
                    value={emergencyStopLoss}
                    onChange={(e) => setEmergencyStopLoss(e.target.value)}
                    className="w-full bg-[#1A1F1C] border border-[#B08D57]/30 rounded-lg px-4 py-3 text-[#F3EBDD] focus:outline-none focus:border-[#C2A14D]"
                  />
                  <p className="text-xs text-[#8B7355] mt-1">Bot stops if total losses exceed this amount</p>
                </div>
              </div>
            </div>

            {/* AI Settings */}
            <div className="border-t border-[#B08D57]/20 pt-8">
              <h2 className="text-2xl font-bold text-[#F3EBDD] mb-6">🧠 AI Settings</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#C2A14D] mb-2">
                  Minimum AI Confidence (%)
                </label>
                <input
                  type="range"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(e.target.value)}
                  className="w-full"
                  min="60"
                  max="95"
                />
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-[#8B7355]">60%</span>
                  <span className="text-[#C2A14D] font-bold">{minConfidence}%</span>
                  <span className="text-[#8B7355]">95%</span>
                </div>
                <p className="text-xs text-[#8B7355] mt-1">Only bet if AI is at least this confident</p>
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="border-t border-[#B08D57]/20 pt-8">
              <h2 className="text-2xl font-bold text-[#F3EBDD] mb-6">⏱️ Rate Limiting</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#C2A14D] mb-2">
                    Max Bets Per Day
                  </label>
                  <input
                    type="number"
                    value={maxBetsPerDay}
                    onChange={(e) => setMaxBetsPerDay(e.target.value)}
                    className="w-full bg-[#1A1F1C] border border-[#B08D57]/30 rounded-lg px-4 py-3 text-[#F3EBDD] focus:outline-none focus:border-[#C2A14D]"
                    min="1"
                    max="50"
                  />
                  <p className="text-xs text-[#8B7355] mt-1">Range: 1-50 bets</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C2A14D] mb-2">
                    Cooldown Between Bets (minutes)
                  </label>
                  <input
                    type="number"
                    value={cooldownMinutes}
                    onChange={(e) => setCooldownMinutes(e.target.value)}
                    className="w-full bg-[#1A1F1C] border border-[#B08D57]/30 rounded-lg px-4 py-3 text-[#F3EBDD] focus:outline-none focus:border-[#C2A14D]"
                    min="5"
                    max="120"
                  />
                  <p className="text-xs text-[#8B7355] mt-1">Range: 5-120 minutes</p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="border-t border-[#B08D57]/20 pt-8">
              <h2 className="text-2xl font-bold text-[#F3EBDD] mb-4">📂 Allowed Categories</h2>
              <p className="text-[#8B7355] text-sm mb-4">Select which market categories the bot can bet on</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedCategories.includes(category)
                        ? "bg-[#B08D57] text-[#0A0E0C]"
                        : "bg-[#1A1F1C] text-[#8B7355] hover:bg-[#242A26]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-[#B08D57]/20 pt-8">
              <button
                onClick={handleSaveSettings}
                disabled={loading || isPending || isConfirming}
                className="w-full bg-[#B08D57] text-[#0A0E0C] font-bold py-4 rounded-lg hover:bg-[#C2A14D] transition-colors disabled:opacity-50"
              >
                {isPending || isConfirming
                  ? isConfirming
                    ? "⏳ Confirming..."
                    : "⏳ Waiting for approval..."
                  : loading
                  ? "Saving..."
                  : "💾 Save Settings On-Chain"}
              </button>
              <p className="text-xs text-[#8B7355] text-center mt-2">
                Settings are stored on blockchain for transparency and security
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
