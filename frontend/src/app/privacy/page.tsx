"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              Biometric Data Privacy & Identity Continuity Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Last Revised: October 2026 • Policy Version 2.4 • GDPR & Field Worker Privacy Compliant
            </p>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 leading-relaxed">
              <span className="font-bold">Core Privacy Principle:</span> TrustShift AI operates under strict data minimization and purpose limitation. Raw facial biometric imagery, raw signature drawings, and plaintext credentials are <span className="underline font-semibold">never stored</span> in general database tables.
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              1. Purpose of Data Processing
            </h2>
            <p>
              TrustShift AI processes field personnel telemetry exclusively for identity continuity, account handoff prevention, and workplace shift security. The platform verifies that the person checking in and operating delivery equipment is the authorized, registered individual.
            </p>
            <p>
              Under no circumstances does TrustShift AI utilize age, gender, ethnicity, disability, residential address, or other protected demographic characteristics as signals within the risk scoring algorithm.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              2. Biometric Feature Vector Handling
            </h2>
            <p>
              When a rider captures a selfie during shift check-in:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs text-slate-600">
              <li>
                Liveness analysis is performed client-side or within isolated ephemeral processing enclaves.
              </li>
              <li>
                Facial landmark vectors are converted to one-way mathematical representations (feature embeddings) managed by certified identity providers.
              </li>
              <li>
                Raw images are expunged immediately after comparison unless an explicit forensic review has been initiated with authorized supervisor sign-off.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              3. Right to Withdraw Consent & Alternate Verification
            </h2>
            <p>
              Field workers retain the right to withdraw optional biometric verification consent at any time. When biometric processing is declined, TrustShift AI provides an approved alternate verification pathway consisting of physical supervisor check-in and multi-factor SMS/hardware token authentication.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              4. Algorithmic Non-Discrimination & Human-in-the-Loop
            </h2>
            <p>
              A low identity trust score or failed automated check <span className="font-semibold text-slate-900">never results in automated permanent account suspension</span>. All critical actions require review by an assigned human manager. Temporary safeguards (such as requiring immediate re-verification) are strictly proportionate to preserve operational integrity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              5. Data Retention & Cryptographic Erasure
            </h2>
            <p>
              Verification event logs and session continuity metadata are retained for a maximum organization-configurable window (default: 90 days), after which telemetry is cryptographically purged from audit archives.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
