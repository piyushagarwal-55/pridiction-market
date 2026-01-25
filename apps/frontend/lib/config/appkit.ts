"use client";

import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arbitrum, mainnet } from "@reown/appkit/networks";
import { defineChain } from "viem";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID as string;

if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_REOWN_PROJECT_ID");
}

// Define Monad Testnet
export const monadTestnet = defineChain({
    id: 10143,
    name: "Monad Testnet",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    rpcUrls: {
        default: { http: ["https://testnet-rpc.monad.xyz"] },
    },
    blockExplorers: {
        default: { name: "Monad Explorer", url: "https://explorer.testnet.monad.xyz" },
    },
    testnet: true,
});

// Networks as a tuple for AppKit
export const networks = [monadTestnet, mainnet, arbitrum] as const;

// Create wagmi adapter with SSR support
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    ssr: true,
    projectId,
    networks: [monadTestnet, mainnet, arbitrum],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
