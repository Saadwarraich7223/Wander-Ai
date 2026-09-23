import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "404 — Waypoint Not Found | WanderAI",
  description: "The requested expedition page or waypoint could not be found. Explore verified destinations across Pakistan on WanderAI.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-2xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-mono font-semibold tracking-wider uppercase mb-6">
            <span className="material-symbols-outlined text-sm">explore_off</span>
            Waypoint Coordinates Unresolved
          </div>

          {/* Large Error Code */}
          <h1 className="font-display text-7xl sm:text-9xl font-extrabold tracking-tighter text-on-surface/15 mb-2 select-none">
            404
          </h1>

          {/* Title & Description */}
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight -mt-6 sm:-mt-10 mb-4">
            You’ve Stepped Off the Mapped Trail
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-lg mx-auto leading-relaxed mb-8">
            The route, destination, or expedition you’re searching for has shifted coordinates or does not exist on our topographic grid.
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-sm font-semibold transition-all shadow-sm hover:shadow-glow hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">home</span>
              Return to Basecamp
            </Link>

            <Link
              href="/places"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-display text-sm font-semibold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">place</span>
              Explore Destinations
            </Link>

            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-display text-sm font-semibold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">map</span>
              Interactive Map
            </Link>
          </div>

          {/* Recommended Waypoints */}
          <div className="bg-surface-container-low/70 border border-outline-variant/60 rounded-2xl p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface-variant">
                Verified Alternative Waypoints
              </span>
              <span className="text-xs text-secondary font-medium">Ready to Explore</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: "Hunza Valley", query: "hunza" },
                { name: "Skardu & Deosai", query: "skardu" },
                { name: "Lahore Heritage", query: "lahore" },
                { name: "Swat & Kalam", query: "swat" },
              ].map((item) => (
                <Link
                  key={item.query}
                  href={`/places?search=${item.query}`}
                  className="p-3 rounded-xl bg-surface-container-lowest hover:bg-white border border-outline-variant/50 hover:border-secondary/40 text-xs font-semibold text-on-surface hover:text-secondary transition-all flex items-center justify-between group shadow-2xs"
                >
                  <span>{item.name}</span>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:text-secondary group-hover:translate-x-0.5 transition-all">
                    arrow_forward
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="py-6 border-t border-outline-variant/40 text-center text-xs text-on-surface-variant">
        <p>© {new Date().getFullYear()} WanderAI Intelligence Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
