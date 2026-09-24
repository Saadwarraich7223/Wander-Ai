"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { sanitizeEmail } from "@/lib/sanitize";
import AuthShell from "@/components/auth/AuthShell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  // Validate redirect parameter to prevent open redirect vulnerabilities
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//") && !redirectParam.includes("/login")
      ? redirectParam
      : "/explore";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = sanitizeEmail(email);

    try {
      const res = await api.post("/auth/login", { email: cleanEmail, password });
      authStorage.setTokens(res.data);

      const userRes = await api.get("/users/me");
      authStorage.setUser(userRes.data);

      router.push(safeRedirect);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {/* Header & Subtitle */}
      <div className="space-y-1.5 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          Welcome Back
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          Sign in to access your trips, saved places, and AI travel recommendations.
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-semibold">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-on-surface">
            Email Address
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-lg">
              mail
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-outline-variant/80 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-on-surface placeholder:text-on-surface-variant/50 font-sans"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-semibold text-on-surface">
              Password
            </label>
            <Link href="#" className="text-xs text-secondary font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-lg">
              lock
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-11 pl-11 pr-11 text-sm rounded-xl border border-outline-variant/80 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-on-surface font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2 pt-0.5">
          <input
            id="remember-me"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary/20 accent-secondary cursor-pointer"
          />
          <label htmlFor="remember-me" className="text-xs font-medium text-on-surface-variant select-none cursor-pointer">
            Remember this device for 30 days
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1.5 h-11 rounded-xl bg-secondary hover:bg-secondary-dark text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In</span>
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-3 text-xs text-on-surface-variant">
        <span>Don&apos;t have an account? </span>
        <Link
          href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : "/register"}
          className="font-bold text-secondary hover:underline"
        >
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-secondary animate-spin">progress_activity</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}