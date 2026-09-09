"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  onSearch?: () => void;
  currency?: "PKR" | "USD";
  onCurrencyChange?: (currency: "PKR" | "USD") => void;
  tripsCount?: number | null;
  user?: { full_name?: string | null } | null;
  onPlanTrip?: () => void;
}

type NavLink = {
  href: string;
  label: string;
  icon: string;
  anchor?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/places", label: "Destinations", icon: "place" },
  { href: "/recommendations", label: "Recommendations", icon: "auto_awesome" },
  { href: "/assistant", label: "Assistant", icon: "smart_toy" },
];

const NAV_ITEM_BASE =
  "px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-sm font-medium";
const NAV_ITEM_ACTIVE =
  "bg-surface-container text-on-surface font-semibold shadow-xs";
const NAV_ITEM_INACTIVE =
  "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60";

export default function Navbar({
  onSearch,
  currency,
  onCurrencyChange,
  tripsCount,
  user,
  onPlanTrip,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string, anchor?: boolean) => {
    if (anchor) return pathname === "/explore" && hash === "#map";
    if (href === "/explore") return pathname === "/explore" && hash !== "#map";
    if (href === "/places")
      return pathname === "/places" || pathname.startsWith("/places/");
    if (href === "/recommendations") return pathname === "/recommendations";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const closeDrawer = () => setMobileOpen(false);

  const myTripsActive = pathname.startsWith("/trips");

  const ctaBase =
    "inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-glow hover:-translate-y-0.5 cursor-pointer whitespace-nowrap";
  const ctaClass = ctaBase;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-2.5 sm:px-8 py-2.5 sm:py-3.5 transition-all">
      <div className="max-w-[1440px] mx-auto bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/70 rounded-2xl shadow-luxury px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo - Text Only */}
        <Link
          className="shrink-0 focus:outline-none"
          href="/"
        >
          <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-on-surface">
            Wander<span className="text-secondary">AI</span>
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className={`${NAV_ITEM_BASE} ${
                isActive(link.href, link.anchor)
                  ? NAV_ITEM_ACTIVE
                  : NAV_ITEM_INACTIVE
              }`}
              href={link.href}
            >
              <span className="material-symbols-outlined text-lg text-secondary">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Action Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {onSearch && (
            <button
              onClick={onSearch}
              className="p-1.5 sm:p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container/80 transition-all cursor-pointer"
              title="Search (⌘K)"
              type="button"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">search</span>
            </button>
          )}

          {currency && onCurrencyChange && (
            <div className="hidden md:flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant/70 text-[11px] font-semibold">
              <button
                onClick={() => onCurrencyChange("PKR")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  currency === "PKR"
                    ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                PKR
              </button>
              <button
                onClick={() => onCurrencyChange("USD")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
              >
                USD
              </button>
            </div>
          )}

          <Link
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              myTripsActive
                ? "bg-surface-container-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            href="/trips"
          >
            <span>My Trips</span>
            {tripsCount != null && (
              <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                {tripsCount}
              </span>
            )}
          </Link>

          {onPlanTrip ? (
            <button onClick={onPlanTrip} className={ctaClass} type="button">
              <span>✨</span>
              <span className="hidden xs:inline">Plan Trip</span>
            </button>
          ) : (
            <Link href="/planner" className={ctaClass}>
              <span>✨</span>
              <span className="hidden xs:inline">Plan Trip</span>
            </Link>
          )}

          {user === null ? (
            <Link
              href="/login"
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-1.5 py-1 whitespace-nowrap hidden sm:inline"
            >
              Log In
            </Link>
          ) : (
            <Link
              href="/profile"
              className="flex items-center pl-1 border-l border-outline-variant/60 cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {user?.full_name?.charAt(0) || "WA"}
              </div>
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Toggle Navigation"
            type="button"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden max-w-[1440px] mx-auto mt-2 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/80 rounded-2xl shadow-luxury p-3.5 flex flex-col gap-1 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeDrawer}
              className={`py-2.5 px-3 rounded-xl transition-colors text-sm font-semibold flex items-center gap-2.5 ${
                isActive(link.href, link.anchor)
                  ? "bg-surface-container text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
              }`}
            >
              <span className="material-symbols-outlined text-lg text-secondary">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          ))}

          <div className="h-px bg-outline-variant/60 my-1" />

          <Link
            href="/trips"
            onClick={closeDrawer}
            className={`py-2.5 px-3 rounded-xl transition-colors text-sm font-semibold ${
              myTripsActive
                ? "bg-surface-container text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
            }`}
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-secondary">route</span>
                <span>My Trips</span>
              </span>
              {tripsCount != null && (
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                  {tripsCount}
                </span>
              )}
            </span>
          </Link>

          {currency && onCurrencyChange && (
            <div className="flex items-center justify-between py-2 px-3 bg-surface-container-low rounded-xl text-xs font-semibold my-1">
              <span className="text-on-surface-variant">Currency Display:</span>
              <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant/70 text-xs">
                <button
                  onClick={() => onCurrencyChange("PKR")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    currency === "PKR"
                      ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  PKR
                </button>
                <button
                  onClick={() => onCurrencyChange("USD")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    currency === "USD"
                      ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  USD
                </button>
              </div>
            </div>
          )}

          {user ? (
            <Link
              href="/profile"
              onClick={closeDrawer}
              className="py-2.5 px-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container/60 flex items-center justify-between"
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-secondary">person</span>
                <span>My Profile</span>
              </span>
              <span className="text-xs text-on-surface-variant">{user.full_name || "Account"}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={closeDrawer}
              className="py-2.5 px-3 rounded-xl text-sm font-semibold text-secondary hover:bg-secondary/10 flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-lg text-secondary">login</span>
              <span>Log In / Sign Up</span>
            </Link>
          )}

          {onPlanTrip ? (
            <button
              onClick={() => {
                closeDrawer();
                onPlanTrip();
              }}
              className={`${ctaClass} w-full mt-2 py-3`}
              type="button"
            >
              <span>✨</span>
              <span>Plan Trip with AI</span>
            </button>
          ) : (
            <Link
              href="/planner"
              onClick={closeDrawer}
              className={`${ctaClass} w-full mt-2 py-3`}
            >
              <span>✨</span>
              <span>Plan Trip with AI</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}