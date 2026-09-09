"use client";

import Link from "next/link";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-background text-on-surface select-none">
      {/* LEFT SIDE: Plain Background Form Container (5 cols on xl, 6 cols on lg) */}
      <div className="lg:col-span-6 xl:col-span-5 min-h-screen lg:h-full lg:max-h-full flex flex-col justify-between px-4 sm:px-12 lg:px-14 xl:px-16 py-6 sm:py-8 bg-background">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-medium text-xs group"
          >
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span>Back to home</span>
          </Link>

          {/* Clean Brand Logo */}
          <Link href="/" className="flex items-center gap-1">
            <span className="font-display font-extrabold text-xl tracking-tight text-on-surface">
              Wander<span className="text-secondary">AI</span>
            </span>
          </Link>
        </div>

        {/* Center Auth Form Content */}
        <div className="max-w-md w-full mx-auto my-auto py-2 shrink-0">
          {children}
        </div>

        {/* Footer info */}
        <div className="shrink-0 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>© 2026 WanderAI Inc.</span>
          <div className="flex items-center gap-3 font-medium">
            <a className="hover:text-on-surface transition-colors" href="#">
              Privacy
            </a>
            <span>·</span>
            <a className="hover:text-on-surface transition-colors" href="#">
              Terms
            </a>
            <span>·</span>
            <a className="hover:text-on-surface transition-colors" href="#">
              Support
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Cinematic Photography Split Hero (7 cols on xl, 6 cols on lg) */}
      <div className="hidden lg:relative lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between h-full p-10 xl:p-14 overflow-hidden bg-surface-container-high relative">
        {/* Full-Height Background Scenery Image */}
        <img
          alt="Hunza Valley and Passu Cones at golden hour"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 select-none pointer-events-none"
          src="https://lh3.googleusercontent.com/aida/AEtjO1UBoKP_M3uID4cxAsZm2o1_Aes6iDdg4uPdNMeyS-oAJWBkBQAwPQ8k8v1bOGCm9qtifZTTh6K4Cd9GgRYwWl_7gbESY4aIE1Mht9CHW_hcdYKViReZ2aXls2RKQZLywOcSXSO9M7BilN55y9Mtjgpq0uO3UdUzaSTTG9CF8IKz5KzD3_6d2X9zqYWXNWFmPmJKdGiy3INF4X3eoys0vmujzPVitAIxLsrLRvAG0bDf4iM3rVrqi3t2XnE"
        />

        {/* Dark Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold tracking-wide text-white">
              Pakistan &amp; Beyond
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs text-white font-medium">
            <span className="material-symbols-outlined text-sm text-amber-300">auto_awesome</span>
            <span>AI Powered 3.4</span>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 my-auto flex flex-col max-w-lg space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            Algorithmic Travel Intelligence
          </span>
          <h2 className="font-display text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            Discover Breathtaking Destinations with AI Precision
          </h2>
          <p className="text-sm text-white/90 leading-relaxed font-normal max-w-md drop-shadow-sm">
            Synthesize bespoke itineraries, real-time elevation telemetry, and personalized recommendations across alpine corridors.
          </p>

          {/* Frosted Telemetry Stat Pill */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-6 p-3.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl text-white">
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/60 tracking-wider">
                  Calibrated POIs
                </span>
                <span className="font-display text-base font-bold text-white">42,800+</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                  Passability Score
                </span>
                <span className="font-display text-base font-bold text-emerald-300">99.4%</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/60 tracking-wider">
                  AI Model
                </span>
                <span className="font-display text-base font-bold text-white">v3.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/20 text-white text-xs">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full ring-2 ring-black bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                SA
              </div>
              <div className="w-7 h-7 rounded-full ring-2 ring-black bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">
                HA
              </div>
              <div className="w-7 h-7 rounded-full ring-2 ring-black bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                MK
              </div>
            </div>
            <span>
              Trusted by <strong className="text-white font-bold">12,000+</strong> active travelers
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 font-medium">
            ⭐ 4.9/5 Rating
          </span>
        </div>
      </div>
    </div>
  );
}