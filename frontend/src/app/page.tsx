"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  UserCheck,
  Smartphone,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Cpu,
  BarChart3,
  Layers,
  ChevronRight,
  Camera
} from "lucide-react";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                TrustShift AI
              </span>
              <span className="text-[10px] text-slate-500 block leading-none font-medium">
                Identity Continuity Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register/rider"
              className="text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 shadow-xs transition-colors"
            >
              Rider Onboarding
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Enterprise Account Handoff & Continuity Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Same account. Same credentials.{" "}
          <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-8">
            Is it still the same person?
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TrustShift AI delivers explainable, continuous identity continuity for delivery fleets, gig platforms, and field operations. Detect account rentals and unauthorized handoffs without treating every phone swap as fraud.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login/manager"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all hover:shadow-lg"
          >
            <span>Launch Manager Console</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login/rider"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs transition-colors"
          >
            <UserCheck className="h-4 w-4 text-indigo-600" />
            <span>Rider Check-in Portal</span>
          </Link>
          <Link
            href="/login/admin"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Admin Policy Suite</span>
          </Link>
        </div>

        {/* Hero Interactive Showcase Card */}
        <div className="mt-14 max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-left p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Verification Telemetry Preview
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Rider Shift Continuous Evaluation
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <TrustScoreBadge score={92.5} band="high_trust" size="md" />
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                ACTION: CONTINUE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Camera className="h-4 w-4 text-indigo-600" />
                <span>Biometric Continuity</span>
              </div>
              <p className="text-slate-500">
                Selfie geometry match (98.2%) with anti-spoofing motion challenge passed.
              </p>
              <div className="text-[11px] font-semibold text-emerald-600 pt-1">
                ✓ Enrolled Reference Confirmed
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Smartphone className="h-4 w-4 text-indigo-600" />
                <span>Device & Session Continuity</span>
              </div>
              <p className="text-slate-500">
                Samsung Galaxy S24 Ultra enrolled. No unauthorized hardware switch.
              </p>
              <div className="text-[11px] font-semibold text-emerald-600 pt-1">
                ✓ Hardware Fingerprint Trusted
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <FileCheck className="h-4 w-4 text-indigo-600" />
                <span>PDF Incident Assurance</span>
              </div>
              <p className="text-slate-500">
                Automated ReportLab cryptographic verification report generated instantly upon anomaly.
              </p>
              <div className="text-[11px] font-semibold text-indigo-600 pt-1">
                ✓ SHA-256 Record Integrity
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Responsible, Multi-Signal Account Security
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Designed specifically for field operations where device changes and connectivity fluctuations happen routinely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900">5-Signal Continuity Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates Identity Verification (30%), Authentication Security (20%), Device Continuity (20%), Behavioural Consistency (20%), and Corroborating Evidence (10%).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900">TrustMark Touch Drawing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Proprietary touch-drawn pattern verification providing a supplementary dynamic signal without invasive keystroke spyware or continuous biometric tracking.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900">Cryptographic PDF Reports</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compiled via ReportLab directly in the backend. Contains telemetry timestamps, reason codes, reviewer notes, and an immutable SHA-256 audit digest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Portal Entrypoints */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900">Select Access Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Dedicated role-enforced environments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rider */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Rider Portal</h3>
                <span className="text-[11px] text-slate-500">Field Workforce</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Start shifts, complete selfie check-ins, verify TrustMark signatures, and review your transparent trust score.
            </p>
            <div className="pt-2">
              <Link
                href="/login/rider"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
              >
                <span>Rider Sign In</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Manager */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Operations Manager</h3>
                <span className="text-[11px] text-slate-500">Branch & Fleet Supervision</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Investigate critical incidents, inspect biometric evidence, record review decisions, and download PDF reports.
            </p>
            <div className="pt-2">
              <Link
                href="/login/manager"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
              >
                <span>Manager Sign In</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Admin */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Company Administrator</h3>
                <span className="text-[11px] text-slate-500">Enterprise Policy & Auditing</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Configure risk score thresholds, calibrate 2FA policies, manage branch managers, and inspect audit logs.
            </p>
            <div className="pt-2">
              <Link
                href="/login/admin"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
              >
                <span>Admin Sign In</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <span className="font-bold text-slate-800">TrustShift AI</span>
            <span>&copy; 2026 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">
              Biometric Privacy & Consent
            </Link>
            <Link href="/terms" className="hover:text-slate-800 transition-colors">
              Terms of Service
            </Link>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
              Engine v1.4
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
