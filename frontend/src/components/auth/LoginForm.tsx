"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Mail, Eye, EyeOff, RefreshCw, KeyRound, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DigiLockerModal } from "@/components/auth/DigiLockerModal";

interface LoginFormProps {
  roleHint: "rider" | "manager" | "admin";
  title: string;
  subtitle: string;
  demoCredentials: {
    email: string;
    password: string;
    label: string;
  };
  redirectPath: string;
}

export function LoginForm({
  roleHint,
  title,
  subtitle,
  demoCredentials,
  redirectPath,
}: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDigiLocker, setShowDigiLocker] = useState(false);

  // 2FA state

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifying2Fa, setVerifying2Fa] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const fillDemo = () => {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setError(null);
  };

  const isEmailFormatValid = email.trim() === "" || /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address (e.g. operator@trustshift.ai).");
      return;
    }

    setLoading(true);

    try {
      const res = await api.login({
        email: email.trim().toLowerCase(),
        password,
        role_hint: roleHint,
        device_fingerprint: "fp_browser_demo_" + roleHint,
        device_name: "Web Management Console",
      });

      if (res.requires_2fa && res.challenge_id) {
        setChallengeId(res.challenge_id);
        setSimulatedCode(res.simulated_code || null);
        if (res.simulated_code) {
          setOtpCode(res.simulated_code); // Pre-fill in dev mode for smooth demo
        }
      } else if (res.access_token && res.user) {
        login(res.user, res.access_token);
        router.push(redirectPath);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;

    setError(null);
    setVerifying2Fa(true);

    try {
      const res = await api.verifySecondFactor({
        challenge_id: challengeId,
        code: otpCode,
        device_fingerprint: "fp_browser_demo_" + roleHint,
        device_name: "Web Management Console",
        remember_device: rememberDevice,
      });

      login(res.user, res.access_token);
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setVerifying2Fa(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      {/* Dev Quick Fill Button */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-slate-700 block">{demoCredentials.label}</span>
          <span className="text-[11px] text-slate-400 font-mono">{demoCredentials.email}</span>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          Auto-Fill
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 animate-in fade-in">
          {error}
        </div>
      )}

      {/* DigiLocker Fast Sign-In Option for Riders */}
      {roleHint === "rider" && !challengeId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/digilocker/oauth?mode=login&redirect_uri=${encodeURIComponent(redirectPath)}`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 hover:from-sky-700 hover:to-indigo-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="h-5 w-5 rounded-md bg-white text-blue-700 font-black text-[11px] flex items-center justify-center shadow-xs">
                DL
              </div>
              <span>Sign In with DigiLocker Portal</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
            <button
              type="button"
              onClick={() => setShowDigiLocker(true)}
              className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
              title="Quick Pop-up Login"
            >
              Modal
            </button>
          </div>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative">
              Or sign in with email
            </span>
          </div>
        </div>

      )}

      {/* Primary Login Form */}
      {!challengeId ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
              {email.trim() !== "" && !isEmailFormatValid && (
                <span className="text-[10px] text-rose-500 font-medium">Invalid email format</span>
              )}
            </div>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@trustshift.ai"
                className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 transition-colors ${
                  email.trim() !== "" && !isEmailFormatValid
                    ? "border-rose-400 bg-rose-50/20 focus:ring-rose-500/20"
                    : "border-slate-300 focus:ring-indigo-500"
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-indigo-600 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In to Platform</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* 2FA Challenge Form */
        <form onSubmit={handle2FaSubmit} className="space-y-4 animate-in fade-in">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <KeyRound className="h-4 w-4 text-indigo-600" />
              <span>Two-Step Verification Required</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              A 6-digit security challenge has been dispatched to your registered authenticator.
            </p>
            {simulatedCode && (
              <div className="pt-1.5 text-[11px] border-t border-indigo-200/60 font-medium">
                <span className="text-slate-500">Simulated Development Code:</span>{" "}
                <b className="font-mono text-indigo-700 tracking-wider bg-white px-2 py-0.5 rounded-md border border-indigo-200 ml-1">
                  {simulatedCode}
                </b>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Verification Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full text-center tracking-widest text-lg font-mono py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              id="remember"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remember" className="cursor-pointer">
              Trust this device for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={verifying2Fa || otpCode.length < 6}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {verifying2Fa ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Validating Security Challenge...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Confirm & Open Session</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Switch role link */}
      <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
        <div>
          Looking for another role?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline font-semibold">
            Change Portal
          </Link>
        </div>
        {roleHint === "rider" && (
          <div>
            Need to register as a new rider?{" "}
            <Link href="/register/rider" className="text-indigo-600 hover:underline font-semibold">
              Onboard Here
            </Link>
          </div>
        )}
      </div>

      <DigiLockerModal
        isOpen={showDigiLocker}
        onClose={() => setShowDigiLocker(false)}
        mode="login"
        redirectPath={redirectPath}
      />
    </div>
  );
}

