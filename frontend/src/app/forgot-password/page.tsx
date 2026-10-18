"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Mail, KeyRound, Lock, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.forgotPassword(email);
      if (res?.data?.simulated_reset_code) {
        setSimulatedCode(res.data.simulated_reset_code);
        setResetCode(res.data.simulated_reset_code);
      }
      setStep(2);
      setMessage("Recovery instructions issued.");
    } catch (err: any) {
      setError(err.message || "Failed to dispatch recovery code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.resetPassword({ email, reset_code: resetCode, new_password: newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Account Recovery</h2>
          <p className="text-xs text-slate-500">
            Reset credentials with multi-factor challenge verification
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-4 animate-in fade-in">
            <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">Password Updated Successfully</h3>
            <p className="text-xs text-slate-500">
              You can now sign in to your role portal using your new credentials.
            </p>
            <Link
              href="/login"
              className="inline-block py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              Back to Login
            </Link>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Registered Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rider@trustshift.ai"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Request Reset Challenge"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in">
            {simulatedCode && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                <span>Simulated Reset Code: </span>
                <b className="font-mono">{simulatedCode}</b>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">6-Digit Reset Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full text-center font-mono tracking-widest text-base py-2 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">New Secure Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Set New Password"}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Role Portals
          </Link>
        </div>
      </div>
    </div>
  );
}
