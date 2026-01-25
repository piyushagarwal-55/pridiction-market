'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { BetSlip } from '../../../components/bet-ui/BetSlip'
import { LiveScore } from '../../../components/live/LiveScore'

export default function MarketDetail() {
    const params = useParams()
    const { isConnected } = useAccount()
    const sport = params.sport as string
    const marketId = params.marketId as string

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <Link
                    href="/"
                    className="font-medium transition-colors"
                    style={{ color: '#957DAD' }}
                >
                    Home
                </Link>
                <span style={{ color: '#C9A0DC' }}>›</span>
                <Link
                    href="/live"
                    className="font-medium transition-colors"
                    style={{ color: '#957DAD' }}
                >
                    Live
                </Link>
                <span style={{ color: '#C9A0DC' }}>›</span>
                <Link
                    href={`/${sport}`}
                    className="font-medium transition-colors"
                    style={{ color: '#957DAD' }}
                >
                    {sport.toUpperCase()}
                </Link>
                <span style={{ color: '#C9A0DC' }}>›</span>
                <Link
                    href={`/${sport}/markets`}
                    className="font-medium transition-colors"
                    style={{ color: '#957DAD' }}
                >
                    Markets
                </Link>
                <span style={{ color: '#C9A0DC' }}>›</span>
                <span className="font-bold" style={{ color: '#6B4C7A' }}>
                    {marketId.replace(/-/g, ' ').toUpperCase()}
                </span>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Live Score Section - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Live Score Card */}
                    <div
                        className="rounded-lg overflow-hidden"
                        style={{ border: '2px solid #FF6B9D' }}
                    >
                        <div
                            className="flex items-center justify-between px-3 py-1.5"
                            style={{ background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 100%)' }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white/90 tracking-wide">
                                    LIVE_SCORE.EXE
                                </span>
                                <span
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white"
                                >
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    LIVE
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                <div className="w-3 h-3 rounded-sm bg-pink-200"></div>
                            </div>
                        </div>
                        <div
                            className="p-6"
                            style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                        >
                            <LiveScore sport={sport} marketId={marketId} />
                        </div>
                    </div>

                    {/* Market Details Card */}
                    <div
                        className="rounded-lg overflow-hidden"
                        style={{ border: '2px solid #7EC8E3' }}
                    >
                        <div
                            className="flex items-center justify-between px-3 py-1.5"
                            style={{ background: 'linear-gradient(180deg, #7EC8E3 0%, #5BA4C9 100%)' }}
                        >
                            <span className="text-xs font-bold text-white/90 tracking-wide">
                                MARKET_DETAILS.DAT
                            </span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                <div className="w-3 h-3 rounded-sm bg-pink-300"></div>
                            </div>
                        </div>
                        <div
                            className="p-6"
                            style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                        >
                            <h2
                                className="text-xl font-bold mb-4"
                                style={{ color: '#6B4C7A' }}
                            >
                                {marketId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h2>

                            {/* Odds Selection */}
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <button
                                    className="p-5 rounded-xl text-center transition-all hover:scale-[1.03]"
                                    style={{
                                        background: 'rgba(126, 200, 227, 0.1)',
                                        border: '2px solid #7EC8E3'
                                    }}
                                >
                                    <p
                                        className="font-semibold mb-2"
                                        style={{ color: '#6B4C7A' }}
                                    >
                                        Team A
                                    </p>
                                    <div
                                        className="text-3xl font-black"
                                        style={{ color: '#7EC8E3' }}
                                    >
                                        1.92
                                    </div>
                                </button>
                                <button
                                    className="p-5 rounded-xl text-center transition-all hover:scale-[1.03]"
                                    style={{
                                        background: 'rgba(255, 107, 157, 0.1)',
                                        border: '2px solid #FF6B9D'
                                    }}
                                >
                                    <p
                                        className="font-semibold mb-2"
                                        style={{ color: '#6B4C7A' }}
                                    >
                                        Team B
                                    </p>
                                    <div
                                        className="text-3xl font-black"
                                        style={{ color: '#FF6B9D' }}
                                    >
                                        1.88
                                    </div>
                                </button>
                            </div>

                            {/* Market Stats */}
                            <div
                                className="p-4 rounded-xl"
                                style={{ background: '#F8E8F8' }}
                            >
                                <h3
                                    className="text-sm font-bold mb-3"
                                    style={{ color: '#6B4C7A' }}
                                >
                                    Market Statistics
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div
                                            className="text-lg font-bold"
                                            style={{ color: '#7EC8E3' }}
                                        >
                                            $1,234
                                        </div>
                                        <div
                                            className="text-xs"
                                            style={{ color: '#957DAD' }}
                                        >
                                            Total Volume
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div
                                            className="text-lg font-bold"
                                            style={{ color: '#FF6B9D' }}
                                        >
                                            156
                                        </div>
                                        <div
                                            className="text-xs"
                                            style={{ color: '#957DAD' }}
                                        >
                                            Total Bets
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div
                                            className="text-lg font-bold"
                                            style={{ color: '#957DAD' }}
                                        >
                                            0.8s
                                        </div>
                                        <div
                                            className="text-xs"
                                            style={{ color: '#957DAD' }}
                                        >
                                            Avg Settlement
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div
                        className="rounded-lg overflow-hidden"
                        style={{ border: '2px solid #E0BBE4' }}
                    >
                        <div
                            className="flex items-center justify-between px-3 py-1.5"
                            style={{ background: 'linear-gradient(180deg, #E0BBE4 0%, #C9A0DC 100%)' }}
                        >
                            <span className="text-xs font-bold text-white/90 tracking-wide">
                                RECENT_BETS.LOG
                            </span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                <div className="w-3 h-3 rounded-sm bg-pink-300"></div>
                            </div>
                        </div>
                        <div
                            className="p-4"
                            style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                        >
                            <div className="space-y-2">
                                {[
                                    { time: '12s ago', selection: 'Team A', amount: '$0.05', odds: '1.92' },
                                    { time: '34s ago', selection: 'Team B', amount: '$0.02', odds: '1.88' },
                                    { time: '1m ago', selection: 'Team A', amount: '$0.10', odds: '1.90' },
                                    { time: '2m ago', selection: 'Team B', amount: '$0.01', odds: '1.85' },
                                ].map((bet, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg"
                                        style={{ background: '#F8E8F8' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="text-xs"
                                                style={{ color: '#957DAD' }}
                                            >
                                                {bet.time}
                                            </span>
                                            <span
                                                className="font-semibold text-sm"
                                                style={{ color: '#6B4C7A' }}
                                            >
                                                {bet.selection}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="text-sm font-bold"
                                                style={{ color: '#7EC8E3' }}
                                            >
                                                {bet.odds}
                                            </span>
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                style={{ background: '#E8F4F8', color: '#5BA4C9' }}
                                            >
                                                {bet.amount}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bet Slip Sidebar - 1 column */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4">
                        <div
                            className="rounded-lg overflow-hidden"
                            style={{ border: '2px solid #FF6B9D' }}
                        >
                            <div
                                className="flex items-center justify-between px-3 py-1.5"
                                style={{ background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 100%)' }}
                            >
                                <span className="text-xs font-bold text-white/90 tracking-wide">
                                    BET_SLIP.EXE
                                </span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                    <div className="w-3 h-3 rounded-sm bg-white/40"></div>
                                    <div className="w-3 h-3 rounded-sm bg-pink-200"></div>
                                </div>
                            </div>
                            <div
                                className="p-4"
                                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                            >
                                {!isConnected ? (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-3 opacity-50">🔐</div>
                                        <p
                                            className="text-sm mb-4"
                                            style={{ color: '#957DAD' }}
                                        >
                                            Connect wallet to place bets
                                        </p>
                                        <button
                                            className="px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, #7EC8E3, #5BA4C9)',
                                                boxShadow: '0 4px 15px rgba(126, 200, 227, 0.35)'
                                            }}
                                        >
                                            Connect Wallet
                                        </button>
                                    </div>
                                ) : (
                                    <BetSlip
                                        marketId={marketId}
                                        sport={sport}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div
                            className="mt-4 rounded-lg overflow-hidden"
                            style={{ border: '2px solid #E0BBE4' }}
                        >
                            <div
                                className="px-3 py-1.5"
                                style={{ background: 'linear-gradient(180deg, #E0BBE4 0%, #C9A0DC 100%)' }}
                            >
                                <span className="text-xs font-bold text-white/90 tracking-wide">
                                    QUICK_INFO.TXT
                                </span>
                            </div>
                            <div
                                className="p-4 space-y-3"
                                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                            >
                                <div className="flex justify-between">
                                    <span
                                        className="text-xs"
                                        style={{ color: '#957DAD' }}
                                    >
                                        Min Bet
                                    </span>
                                    <span
                                        className="text-xs font-bold"
                                        style={{ color: '#6B4C7A' }}
                                    >
                                        $0.01
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span
                                        className="text-xs"
                                        style={{ color: '#957DAD' }}
                                    >
                                        Max Bet
                                    </span>
                                    <span
                                        className="text-xs font-bold"
                                        style={{ color: '#6B4C7A' }}
                                    >
                                        $1.00
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span
                                        className="text-xs"
                                        style={{ color: '#957DAD' }}
                                    >
                                        Settlement
                                    </span>
                                    <span
                                        className="text-xs font-bold"
                                        style={{ color: '#7EC8E3' }}
                                    >
                                        Chainlink Oracle
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span
                                        className="text-xs"
                                        style={{ color: '#957DAD' }}
                                    >
                                        Network
                                    </span>
                                    <span
                                        className="text-xs font-bold"
                                        style={{ color: '#FF6B9D' }}
                                    >
                                        Cronos
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}