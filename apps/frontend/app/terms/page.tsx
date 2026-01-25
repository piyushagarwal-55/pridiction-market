import Link from "next/link"

export default function TermsPage() {
    return (
        <main className="relative min-h-screen overflow-hidden">
            {/* Atmosphere */}
            <div className="absolute inset-0 bg-[#1F3D2B]" />
            <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_35%,rgba(243,235,221,0.10),rgba(31,61,43,0.70),rgba(10,14,12,0.95))]" />

            {/* Film grain + vignette (hero-only, no styled-jsx) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.10] mix-blend-overlay"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 3px)",
                    filter: "blur(0.25px)",
                }}
            />
            <div
                className="absolute pointer-events-none"
                style={{
                    inset: "-20px",
                    background:
                        "radial-gradient(1200px 700px at 50% 35%, transparent 35%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.65) 100%)",
                }}
            />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[920px] items-center px-6 py-16">
                <div className="w-full">
                    {/* Header */}
                    <div className="text-center">
                        <p className="text-[11px] tracking-[0.38em] uppercase text-[#B08D57]/85">
                            Bet Bazzar • Terms of Entry
                        </p>

                        <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-[0.10em] text-[#F3EBDD] drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
                            The Covenant
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#D8CFC0]/80">
                            Bet Bazzar is a decentralized betting platform. By using the platform, you consent to the rules below.
                        </p>

                        <div className="mx-auto mt-8 h-px w-48 bg-[#B08D57]/35" />
                    </div>

                    {/* Content card */}
                    <div className="mt-10 rounded-[28px] p-8 md:p-12 backdrop-blur-md shadow-[0_40px_120px_rgba(0,0,0,0.55)] bg-[linear-gradient(135deg,rgba(10,14,12,0.60),rgba(10,14,12,0.22))] ring-1 ring-[#B08D57]/15">
                        <div className="relative rounded-2xl border border-[#B08D57]/60 p-7 md:p-10">
                            <div className="pointer-events-none absolute inset-[10px] rounded-2xl border border-[#C2A14D]/25" />

                            {/* Warm spotlight */}
                            <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(194,161,77,0.18),rgba(194,161,77,0.00)_70%)] blur-2xl" />

                            <div className="space-y-10">
                                <section>
                                    <h2 className="text-[12px] tracking-[0.44em] uppercase text-[#C2A14D]/90">Preamble</h2>
                                    <p className="mt-4 text-sm leading-relaxed text-[#D8CFC0]/80">
                                        The Haus is governed by three pillars: composure, discretion, and craft.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-[12px] tracking-[0.44em] uppercase text-[#C2A14D]/90">Discretion</h2>
                                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#D8CFC0]/80">
                                        <li>Keep the identities, strategies, and conversations of other members private.</li>
                                        <li>Do not publish, stream, or broadcast private rooms, invitations, or internal material.</li>
                                        <li>Respect boundaries, some doors are meant to stay closed.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-[12px] tracking-[0.44em] uppercase text-[#C2A14D]/90">Conduct in the Lodge</h2>
                                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#D8CFC0]/80">
                                        <li>No harassment, threats, doxxing, or coercion.</li>
                                        <li>No scams, fraud, or coordinated market manipulation efforts through Bet Bazzar.</li>
                                        <li>Keep discourse sharp and civil; arrogance is noise.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-[12px] tracking-[0.44em] uppercase text-[#C2A14D]/90">Risk & Responsibility</h2>
                                    <p className="mt-4 text-sm leading-relaxed text-[#D8CFC0]/80">
                                        Wagering is risk. Loss is possible. Nothing on Bet Bazzar is financial advice.
                                    </p>
                                    <p className="mt-4 text-sm leading-relaxed text-[#D8CFC0]/70">
                                        Legal gambling age and local regulations are your responsibility.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-[12px] tracking-[0.44em] uppercase text-[#C2A14D]/90">Access & Removal</h2>
                                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#D8CFC0]/80">
                                        <li>Entry is by invitation, and it can be revoked without notice.</li>
                                        <li>The Haus may limit access, freeze features, or block accounts to protect members and integrity.</li>
                                        <li>Attempts to bypass security or probe private systems will result in immediate removal.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-[12px] tracking-[0.44em] uppercase text-[#C2A14D]/90">The Mark</h2>
                                    <p className="mt-4 text-sm leading-relaxed text-[#D8CFC0]/80">
                                        Symbols and marks of Bet Bazzar are traditional. Use them with respect.
                                    </p>
                                </section>

                                <section className="pt-2">
                                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                                        <div className="h-px w-full max-w-md bg-[#B08D57]/20" />
                                        <p className="text-xs italic text-[#D8CFC0]/55">“Enter with quiet hands. Leave with a clear ledger.”</p>

                                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                            <Link
                                                href="/"
                                                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-xs uppercase tracking-[0.30em] text-[#F3EBDD] border border-[#B08D57]/70 bg-[linear-gradient(180deg,rgba(194,161,77,0.14),rgba(176,141,87,0.05))] hover:border-[#C2A14D]/90 transition"
                                            >
                                                Return to the door
                                            </Link>

                                            <Link
                                                href="/responsible-gaming"
                                                className="text-[11px] tracking-[0.28em] uppercase text-[#D8CFC0]/55 hover:text-[#C2A14D] transition-colors"
                                            >
                                                Responsible
                                            </Link>
                                            <span className="text-[#B08D57]/35">•</span>
                                            <Link
                                                href="/contact"
                                                className="text-[11px] tracking-[0.28em] uppercase text-[#D8CFC0]/55 hover:text-[#C2A14D] transition-colors"
                                            >
                                                Contact
                                            </Link>
                                        </div>

                                        <p className="pt-4 text-center text-[11px] tracking-[0.30em] uppercase text-[#B08D57]/60">
                                            Est. 2026 • By invitation
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
