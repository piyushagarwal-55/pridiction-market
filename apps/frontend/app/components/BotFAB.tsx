"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BotFAB() {
  const pathname = usePathname();
  
  // Don't show on bot pages themselves
  if (pathname.startsWith('/bot')) {
    return null;
  }

  return (
    <Link
      href="/bot/dashboard"
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-5 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-110 group"
      title="AI Bot Dashboard"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-pulse">🤖</span>
        <span className="hidden group-hover:block text-sm font-bold whitespace-nowrap pr-2">
          AI Bot
        </span>
      </div>
    </Link>
  );
}
