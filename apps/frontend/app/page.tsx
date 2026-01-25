"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

export default function Home() {
    const router = useRouter()
    const [knockSequence, setKnockSequence] = useState<number[]>([])
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [doorShaking, setDoorShaking] = useState(false)
    const [smokeEffect, setSmokeEffect] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const updateScale = () => {
            if (contentRef.current) {
                const container = contentRef.current
                const windowHeight = window.innerHeight
                const contentHeight = container.scrollHeight
                const scaleY = (windowHeight - 32) / contentHeight
                const scale = Math.min(scaleY, 1)

                container.style.setProperty('--scale-factor', scale.toString())
            }
        }

        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [])

    const secretPattern = [1, 1, 1]

    const knockText = useMemo(() => {
        if (knockSequence.length > 0 && knockSequence.length < 3) {
            const remaining = 3 - knockSequence.length
            return `Knock ${remaining} more time${remaining > 1 ? "s" : ""}...`
        }
        return "Those who know, knock thrice..."
    }, [knockSequence])

    const handleKnock = () => {
        const newSequence = [...knockSequence, 1]
        setKnockSequence(newSequence)
        setDoorShaking(true)
        setTimeout(() => setDoorShaking(false), 200)

        if (newSequence.length === 3) {
            if (JSON.stringify(newSequence) === JSON.stringify(secretPattern)) {
                setIsAuthenticated(true)
                setSmokeEffect(true)
                setTimeout(() => router.push("/prediction"), 1200)
            } else {
                setTimeout(() => setKnockSequence([]), 1000)
            }
        }
    }

    const handleSlipInside = () => {
        setSmokeEffect(true)
        setTimeout(() => router.push("/prediction"), 800)
    }

    return (
        <main className="relative h-screen overflow-hidden">
            {/* Base atmosphere - New vibrant blue/purple theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
            <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_35%,rgba(59,130,246,0.15),rgba(139,92,246,0.10),rgba(15,23,42,0.95))]" />

            {/* Subtle wallpaper + deco geometry */}
            <div className="absolute inset-0 opacity-[0.15] mix-blend-soft-light wallpaper" />
            <div className="absolute inset-0 opacity-[0.15] deco-lines" />

            {/* Film grain + vignette (hero-only) */}
            <div className="absolute inset-0 pointer-events-none film" />
            <div className="absolute inset-0 pointer-events-none vignette" />

            {/* Smoke overlay (gentle drift, not pulse) */}
            {smokeEffect && <div className="absolute inset-0 z-50 pointer-events-none smoke" />}

            {/* Content */}
            <div className="relative z-10 h-screen p-2 md:p-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                    ref={contentRef}
                    className="w-full max-w-[92vw] sm:max-w-[700px]"
                    style={{ transform: 'scale(var(--scale-factor, 1))', transformOrigin: 'center' }}
                >
                    {/* Plaque */}
                    <div
                        className={[
                            "rounded-[20px] p-4 md:p-6",
                            "backdrop-blur-md",
                            "shadow-[0_40px_120px_rgba(0,0,0,0.70)]",
                            "bg-[linear-gradient(135deg,rgba(30,41,59,0.70),rgba(15,23,42,0.40))]",
                            "ring-1 ring-[#3b82f6]/20",
                            doorShaking ? "shake" : "",
                        ].join(" ")}
                    >
                        {/* Blue/Purple double border */}
                        <div className="relative rounded-2xl border border-[#3b82f6]/60 p-1 md:p-4">
                            <div className="pointer-events-none absolute inset-[10px] rounded-2xl border border-[#8b5cf6]/30" />

                            {/* Blue spotlight */}
                            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.25),rgba(59,130,246,0.00)_70%)] blur-2xl" />

                            {/* Emblem + knock door */}
                            <div className="mx-auto flex w-full max-w-[400px] flex-col items-center">
                                <div className="rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#334155] pb-3 pt-1 px-1 ring-1 ring-[#3b82f6]/40 inline-block w-full border border-[#3b82f6]/20">
                                    <Image
                                        src="/EdenEden.png"
                                        alt="Bet Bazzar - Blockchain Betting"
                                        width={250}
                                        height={375}
                                        className="rounded-xl drop-shadow-[0_18px_40px_rgba(59,130,246,0.40)] cursor-pointer hover:scale-105 transition-transform duration-300 mx-auto w-full h-auto"
                                        style={{ backgroundColor: 'transparent', display: 'block' }}
                                        onClick={handleKnock}
                                        priority
                                    />

                                    {/* Title inside container */}
                                    <div className="mt-2 text-center px-2">
                                        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-[0.10em] text-[#f1f5f9] drop-shadow-[0_2px_10px_rgba(59,130,246,0.5)]">
                                            Bet Bazzar
                                        </h1>
                                        <p className="mt-1 text-[11px] sm:text-[12px] tracking-[0.52em] uppercase text-[#94a3b8]">
                                            Blockchain Betting
                                        </p>
                                    </div>

                                    <div className="mt-3 flex justify-center gap-2">
                                        {[0, 1, 2].map((i) => (
                                            <span
                                                key={i}
                                                className={[
                                                    "h-2 w-2 rounded-full transition-all duration-300",
                                                    knockSequence[i]
                                                        ? "bg-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.70)]"
                                                        : "bg-[#475569]/40",
                                                ].join(" ")}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mt-4 text-center">
                                    <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />

                                    <p className="mx-auto mt-3 max-w-md text-center text-xs leading-relaxed text-[#cbd5e1]">
                                        Automated Prediction Execution and Agentic Settlement
                                    </p>
                                </div>

                                {/* CTA */}
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <button
                                        onClick={handleSlipInside}
                                        className={`group relative inline-flex items-center justify-center rounded-full px-8 py-2.5
text-xs uppercase tracking-[0.35em] text-[#f1f5f9]
border border-[#3b82f6]/70
bg-[linear-gradient(180deg,rgba(59,130,246,0.20),rgba(139,92,246,0.10))]
shadow-[0_18px_55px_rgba(59,130,246,0.30)]
transition hover:border-[#8b5cf6]/90 hover:shadow-[0_18px_75px_rgba(139,92,246,0.40)]`}
                                    >
                                        <span className="absolute inset-0 rounded-full ring-1 ring-[#3b82f6]/20 group-hover:ring-[#8b5cf6]/30" />
                                        Enter Bet Bazzar
                                    </button>

                                    <p className="text-[10px] italic text-[#94a3b8]">{knockText}</p>
                                </div>

                            </div>

                            {/* Bottom links */}
                            <div className="mt-3 pt-3">
                                <div className="mx-auto mb-3 h-px w-full max-w-md bg-gradient-to-r from-transparent via-[#3b82f6]/30 to-transparent" />

                                <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px]">
                                    <Link
                                        href="/terms"
                                        className="tracking-[0.22em] uppercase text-[#94a3b8] hover:text-[#3b82f6] transition-colors"
                                    >
                                        Terms
                                    </Link>
                                    <span className="text-[#475569]">•</span>
                                    <Link
                                        href="/responsible-gaming"
                                        className="tracking-[0.22em] uppercase text-[#94a3b8] hover:text-[#3b82f6] transition-colors"
                                    >
                                        Responsible
                                    </Link>
                                    <span className="text-[#475569]">•</span>
                                    <Link
                                        href="/contact"
                                        className="tracking-[0.22em] uppercase text-[#94a3b8] hover:text-[#3b82f6] transition-colors"
                                    >
                                        Contact
                                    </Link>
                                </nav>

                                <p className="mt-3 text-center text-[10px] tracking-[0.30em] uppercase text-[#64748b]">
                                    Est. 2026 • By invitation
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Local CSS for texture/lines/smoke */}
            <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
        .shake {
          animation: shake 0.2s ease-in-out;
        }

        /* Wallpaper: soft, non-repeating feel */
        .wallpaper {
          background-image: radial-gradient(circle at 25% 20%, rgba(59, 130, 246, 0.08), transparent 55%),
            radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.10), transparent 60%),
            radial-gradient(circle at 40% 85%, rgba(6, 182, 212, 0.06), transparent 60%);
          filter: blur(0.2px);
        }

        /* Art-deco linework overlay */
        .deco-lines {
          background-image: linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.10) 1px, transparent 1px);
          background-size: 120px 120px;
          mask-image: radial-gradient(circle at 50% 40%, black 0%, transparent 72%);
        }

        /* Film grain + vignette (hero-only) */
        .film {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.1;
          mix-blend-mode: overlay;
          background-image: repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.035) 0 1px,
              transparent 1px 2px
            ),
            repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.035) 0 1px, transparent 1px 3px);
          filter: blur(0.25px);
        }

        .vignette {
          position: absolute;
          inset: -20px;
          pointer-events: none;
          background: radial-gradient(
            1200px 700px at 50% 35%,
            transparent 35%,
            rgba(0, 0, 0, 0.35) 70%,
            rgba(0, 0, 0, 0.65) 100%
          );
        }

        /* Smoke drift overlay */
        .smoke {
          background: radial-gradient(800px 420px at 30% 35%, rgba(59, 130, 246, 0.15), transparent 60%),
            radial-gradient(900px 520px at 70% 55%, rgba(139, 92, 246, 0.12), transparent 65%),
            radial-gradient(1000px 620px at 45% 80%, rgba(6, 182, 212, 0.10), transparent 70%);
          animation: drift 1.2s ease-out forwards;
        }
        @keyframes drift {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </main>
    )
}
