"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Key,
} from "lucide-react";

export default function VerifyAccountPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setVerified(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            TS
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            TrustShift <span className="text-indigo-600">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Account Verification
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter the verification token dispatched to your phone or corporate email.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-2xl sm:px-10">
          {verified ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Account Confirmed</h3>
              <p className="text-xs text-slate-500">
                Your credentials and contact channel have been successfully verified. You may now proceed to log in to your dashboard.
              </p>
              <Link
                href="/login"
                className="w-full inline-flex justify-center py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Proceed to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Email or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="name@domain.com or +1 (555) 000-0000"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 543210"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg font-mono text-center tracking-widest text-sm font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Demo Note:</span> In local development environments, enter any 6-digit challenge code to proceed.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {submitting ? "Verifying..." : "Confirm Account"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
