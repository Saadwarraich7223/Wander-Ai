"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";
import AuthShell from "@/components/auth/AuthShell";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//") && !redirectParam.includes("/register")
      ? redirectParam
      : "/onboarding";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checks = [
    password.length >= 8,
    /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password),
    /[A-Z]/.test(password) || /[a-z]/.test(password),
  ];
  const metCount = checks.filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanName = sanitizeText(fullName);
    const cleanEmail = sanitizeEmail(email);

    try {
      await api.post("/auth/register", { name: cleanName, email: cleanEmail, password });

      const loginRes = await api.post("/auth/login", { email: cleanEmail, password });
      authStorage.setTokens(loginRes.data);

      const userRes = await api.get("/users/me");
      authStorage.setUser(userRes.data);

      router.push(safeRedirect);
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please check your inputs."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {/* Header & Subtitle */}
      <div className="space-y-1.5 mb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          Create Your Account
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          Join WanderAI for smart, algorithmic travel planning and spatial intelligence.
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-semibold">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="full-name" className="block text-xs font-semibold text-on-surface">
            Full Name
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-lg">
              person
            </span>
            <input
              id="full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Saad Khan"
              className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border border-outline-variant/80 bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-on-surface placeholder:text-on-surface-variant/50 font-sans"
            />
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold text-on-surface">
            Password
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-lg">
              lock
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

          {/* Strength Meter Bar */}
          {password && (
            <div className="pt-1.5 space-y-1">
              <div className="grid grid-cols-3 gap-1.5 h-1.5">
                <div
                  className={`rounded-full transition-colors ${metCount >= 1 ? "bg-amber-400" : "bg-outline-variant/40"
                    }`}
                />
                <div
                  className={`rounded-full transition-colors ${metCount >= 2 ? "bg-emerald-400" : "bg-outline-variant/40"
                    }`}
                />
                <div
                  className={`rounded-full transition-colors ${metCount >= 3 ? "bg-emerald-500" : "bg-outline-variant/40"
                    }`}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Password strength:{" "}
                <strong className="text-on-surface font-semibold">
                  {metCount === 1 ? "Weak" : metCount === 2 ? "Good" : metCount === 3 ? "Strong" : "Very Weak"}
                </strong>
              </p>
            </div>
          )}
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-11 rounded-xl bg-secondary hover:bg-secondary-dark text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <span>Create Free Account</span>
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center pt-3 text-xs text-on-surface-variant">
        <span>Already have an account? </span>
        <Link
          href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login"}
          className="font-bold text-secondary hover:underline"
        >
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-secondary animate-spin">progress_activity</span>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}