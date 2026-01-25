"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { mainnet, arbitrum } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";

import { projectId, wagmiAdapter, monadTestnet } from "@/lib/config/appkit";

const metadata = {
    name: "Bet Bazzar",
    description: "Bet Bazzar — Blockchain Betting Platform",
    url: "https://betbazzar.vercel.app/",
    icons: ["https://betbazzar.vercel.app/icon.png"],
};

// createAppKit must run before any useAppKit hook
createAppKit({
    adapters: [wagmiAdapter],
    networks: [monadTestnet, mainnet, arbitrum],
    defaultNetwork: monadTestnet,
    projectId,
    metadata,
    features: { analytics: true },
});

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}
