import type { Metadata } from "next"
import { Playfair_Display, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/app/components/ui/sonner"
import { BotFAB } from "@/app/components/BotFAB"

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-space-grotesk",
})

const cormorantGaramond = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-cormorant-garamond",
})

export const metadata: Metadata = {
    title: "Bet Bazzar — Blockchain Betting",
    description:
        "Decentralized prediction markets and casino games on Monad. Place bets, win big, powered by blockchain.",
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://pridiction-market-frontend-nfrj.vercel.app',
        siteName: 'Bet Bazzar',
        title: 'Bet Bazzar — Blockchain Betting',
        description: 'Experience the future of web3 betting',
        images: [
            {
                url: 'https://pridiction-market-frontend-nfrj.vercel.app/Eden.png',
                width: 1200,
                height: 630,
                alt: 'Bet Bazzar',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Bet Bazzar — Blockchain Betting',
        description: 'Experience the future of web3 betting',
        images: ['https://pridiction-market-frontend-nfrj.vercel.app/Eden.png'],
    },
    other: {
        'fc:frame': JSON.stringify({
            version: '1',
            imageUrl: 'https://pridiction-market-frontend-nfrj.vercel.app/Eden.png',
            button: {
                title: 'Open mini app',
                action: {
                    type: 'launch_miniapp',
                    url: 'https://pridiction-market-frontend-nfrj.vercel.app',
                    name: 'Bet Bazzar',
                    splashImageUrl: 'https://pridiction-market-frontend-nfrj.vercel.app/splash.png',
                    splashBackgroundColor: '#6200EA',
                },
            },
        }),
    },
}

export const viewport = {
    width: "device-width",
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html
            lang="en"
            className={`${spaceGrotesk.variable} ${cormorantGaramond.variable}`}
        >
            <body className="font-sans antialiased">
                <Providers>{children}</Providers>
                <Toaster 
                    position="top-right"
                    expand={true}
                    richColors
                    closeButton
                />
                <BotFAB />
            </body>
        </html>
    )
}
