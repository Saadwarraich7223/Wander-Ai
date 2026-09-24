"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authStorage } from "@/lib/auth";

interface NavbarProps {
  onSearch?: () => void;
  currency?: "PKR" | "USD";
  onCurrencyChange?: (currency: "PKR" | "USD") => void;
  tripsCount?: number | null;
  user?: { name?: string | null; full_name?: string | null; email?: string | null; avatar_url?: string | null } | null;
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
  { href: "/itineraries", label: "Itineraries", icon: "alt_route" },
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
  const [currentUser, setCurrentUser] = useState<{
    name?: string | null;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    is_admin?: boolean;
    role?: string;
  } | null>(null);

  useEffect(() => {
    if (user !== undefined && user !== null) {
      setCurrentUser(user);
    } else {
      const stored = authStorage.getUser();
      setCurrentUser(stored);
    }

    // Refresh profile in background if access token is active
    if (authStorage.getAccessToken()) {
      import("@/lib/api").then(({ usersApi }) => {
        usersApi
          .getMe()
          .then((me) => {
            if (me) {
              setCurrentUser(me);
              authStorage.setUser(me);
            }
          })
          .catch(() => {});
      });
    }
  }, [user]);

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
    if (href === "/itineraries") return pathname.startsWith("/itineraries");
    if (href === "/recommendations") return pathname === "/recommendations";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const closeDrawer = () => setMobileOpen(false);

  const myTripsActive = pathname.startsWith("/trips");

  const ctaClass =
    "inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-glow hover:-translate-y-0.5 cursor-pointer whitespace-nowrap";

  const isLoggedIn = Boolean(
    authStorage.getAccessToken() ||
      (currentUser && (currentUser.name || currentUser.full_name || currentUser.email))
  );

  const isAdmin = Boolean(
    (currentUser as any)?.is_admin || (currentUser as any)?.role === "admin"
  );

  const displayName =
    currentUser?.name || currentUser?.full_name || currentUser?.email?.split("@")[0] || "Explorer";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-2.5 sm:px-8 py-2.5 sm:py-3.5 transition-all">
      <div className="max-w-[1440px] mx-auto bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/70 rounded-2xl shadow-luxury px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo - Text Only */}
        <Link
          className="shrink-0 focus:outline-none"
          href="/"
          prefetch={true}
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
              prefetch={true}
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

          {/* My Trips — Displayed ONLY for Logged-In Users */}
          {isLoggedIn && (
            <Link
              prefetch={true}
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
          )}

          {isAdmin && (
            <Link
              prefetch={true}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
              href="/admin"
              title="Destination Catalog & Admin Studio"
            >
              <span className="material-symbols-outlined text-sm text-emerald-600">admin_panel_settings</span>
              <span>Admin Studio</span>
            </Link>
          )}

          {/* Plan Trip CTA — Always shows clear text label */}
          {onPlanTrip ? (
            <button onClick={onPlanTrip} className={ctaClass} type="button">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Plan Trip</span>
            </button>
          ) : (
            <Link href="/planner" prefetch={true} className={ctaClass}>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Plan Trip</span>
            </Link>
          )}

          {isLoggedIn ? (
            <Link
              href="/profile"
              prefetch={true}
              className="flex items-center pl-1.5 border-l border-outline-variant/60 cursor-pointer group"
              title={displayName}
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={displayName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover group-hover:ring-2 group-hover:ring-secondary/40 transition-all"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs shadow-sm group-hover:ring-2 group-hover:ring-secondary/40 transition-all">
                  {userInitial}
                </div>
              )}
            </Link>
          ) : (
            <div className="flex items-center pl-1.5 border-l border-outline-variant/60">
              <Link
                href="/login"
                prefetch={true}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-semibold transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Sign In</span>
              </Link>
            </div>
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
              prefetch={true}
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

          {/* My Trips in Mobile Drawer — ONLY when logged in */}
          {isLoggedIn && (
            <Link
              href="/trips"
              prefetch={true}
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
          )}

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

          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                prefetch={true}
                onClick={closeDrawer}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container/60 flex items-center justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-secondary">person</span>
                  <span>My Profile</span>
                </span>
                <span className="text-xs text-on-surface-variant">{displayName}</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={true}
                  onClick={closeDrawer}
                  className="py-2.5 px-3 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-lg text-emerald-600">admin_panel_settings</span>
                    <span>Admin Studio</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 font-bold">PANEL</span>
                </Link>
              )}
            </>
          ) : (
            <div className="my-1">
              <Link
                href="/login"
                prefetch={true}
                onClick={closeDrawer}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold text-white bg-secondary hover:bg-secondary-dark flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Sign In to Account</span>
              </Link>
            </div>
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
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Plan Trip with AI</span>
            </button>
          ) : (
            <Link
              href="/planner"
              prefetch={true}
              onClick={closeDrawer}
              className={`${ctaClass} w-full mt-2 py-3`}
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Plan Trip with AI</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}