"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              TS
            </div>
            <span className="text-lg font-bold text-slate-900">
              TrustShift <span className="text-indigo-600">AI</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-8 text-slate-700 text-sm leading-relaxed">
          <div className="border-b border-slate-200 pb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Platform Terms of Service & Enterprise SLA
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Effective Date: October 2026 • Enterprise SaaS Agreement
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the TrustShift AI identity continuity platform, you agree to be bound by these Terms of Service. If you are an enterprise customer utilizing the service to manage field workers, delivery personnel, or contractors, you represent that you possess lawful authority to implement workforce identity continuity policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Prohibited Conduct: Account Rental & Handoffs</h2>
            <p>
              TrustShift AI exists to prevent unlawful account subleasing, credential sharing, and unauthorized field operations. Users are strictly prohibited from transferring, leasing, or loaning their authenticated operational session to any third-party individual.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Continuous Identity Telemetry</h2>
            <p>
              Field workers operating under an active delivery shift acknowledge that TrustShift AI monitors session continuity signals including terminal hardware transitions, biometric verification checks, and kinematic drawing inputs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. ReportLab PDF Reports & Verification Evidentiary Standards</h2>
            <p>
              Generated verification PDF reports reflect automated algorithmic risk scores, evidence timestamps, and manager review logs. TrustShift AI does not issue legal certifications of identity. Verification reports are designed for internal organizational compliance and regulatory due diligence.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h2>
            <p>
              TrustShift AI and its operators shall not be liable for incidental, indirect, or consequential damages resulting from algorithmic false alerts, temporary step-up verification delays, or network interruptions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
