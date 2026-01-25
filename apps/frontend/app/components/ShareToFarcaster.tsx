"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ShareToFarcasterProps {
  marketId: string;
  marketQuestion: string;
}

export function ShareToFarcaster({ marketId, marketQuestion }: ShareToFarcasterProps) {
  const [isCopied, setIsCopied] = useState(false);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const frameUrl = `${APP_URL}/api/frames/market/${marketId}`;
  const marketUrl = `${APP_URL}/prediction/${marketId}`;

  const handleShare = async () => {
    // Warpcast composer URL with pre-filled text
    const text = encodeURIComponent(
      `🎯 ${marketQuestion}\n\nBet on this prediction market on Bet Bazzar!\n\n${marketUrl}`
    );
    const warpcastUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${encodeURIComponent(frameUrl)}`;

    // Open Warpcast composer
    window.open(warpcastUrl, '_blank', 'noopener,noreferrer');

    toast.success("Opening Warpcast composer...", {
      description: "Share this market with your Farcaster followers!",
      style: {
        background: 'linear-gradient(135deg, rgba(31, 61, 43, 0.95), rgba(10, 14, 12, 0.95))',
        color: '#f3ebdd',
        border: '1px solid #c2a14d',
      },
    });
  };

  const handleCopyFrameUrl = async () => {
    try {
      await navigator.clipboard.writeText(frameUrl);
      setIsCopied(true);
      toast.success("Frame URL copied!", {
        description: "Paste this in any Farcaster client",
        style: {
          background: 'linear-gradient(135deg, rgba(31, 61, 43, 0.95), rgba(10, 14, 12, 0.95))',
          color: '#f3ebdd',
          border: '1px solid #c2a14d',
        },
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleShare}
        className="eh-action eh-action--yes flex items-center justify-center gap-2"
        type="button"
      >
        <span>🎯</span>
        <span>Share to Farcaster</span>
      </button>
      
      <button
        onClick={handleCopyFrameUrl}
        className="eh-action eh-action--no flex items-center justify-center gap-2"
        type="button"
      >
        <span>{isCopied ? '✅' : '📋'}</span>
        <span>{isCopied ? 'Copied!' : 'Copy Frame URL'}</span>
      </button>

      <p className="text-xs text-center text-[#d8cfc0]/60">
        Share this market as a Farcaster Frame. Users can bet directly from their feed!
      </p>
    </div>
  );
}
