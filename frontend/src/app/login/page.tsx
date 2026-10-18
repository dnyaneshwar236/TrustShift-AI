"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, UserCheck, Layers, Lock, ArrowRight, Sparkles } from "lucide-react";
import { DigiLockerModal } from "@/components/auth/DigiLockerModal";

export default function LoginPage() {
  const [showDigiLocker, setShowDigiLocker] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Brand */}
        <div className="space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">TrustShift AI</h1>
          <p className="text-xs text-slate-500">
            Select your dedicated authentication environment
          </p>
        </div>

        {/* Fast Sign-In with DigiLocker Banner for Riders */}
        <div className="p-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-left relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <span className="h-5 w-5 rounded-md bg-blue-700 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                  DL
                </span>
                <span>DigiLocker 1-Click Sign-In</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">
                  Fast Track
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Riders can bypass passwords using Aadhaar/Driving Licence electronic verification.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/digilocker/oauth?mode=login&redirect_uri=/rider/dashboard"
              className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Go to DigiLocker Website to Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setShowDigiLocker(true)}
              className="py-2.5 px-3 rounded-xl border border-blue-300 bg-white hover:bg-blue-50 text-blue-800 text-xs font-semibold shadow-2xs"
              title="Quick Pop-up"
            >
              Popup
            </button>
          </div>
        </div>


        {/* Portals */}
        <div className="space-y-3">
          <Link
            href="/login/rider"
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Rider Portal</h3>
                <p className="text-xs text-slate-500">Field workers, shift check-ins & trust score</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/login/manager"
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Operations Manager</h3>
                <p className="text-xs text-slate-500">Shift monitoring, incident review & PDF reports</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/login/admin"
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Company Administrator</h3>
                <p className="text-xs text-slate-500">Policy thresholds, branch settings & audit logs</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        <div className="text-xs text-slate-400 pt-2">
          New delivery rider?{" "}
          <Link href="/register/rider" className="text-indigo-600 font-semibold hover:underline">
            Complete Self-Onboarding
          </Link>
        </div>
      </div>

      <DigiLockerModal
        isOpen={showDigiLocker}
        onClose={() => setShowDigiLocker(false)}
        mode="login"
        redirectPath="/rider/dashboard"
      />
    </div>
  );
}

