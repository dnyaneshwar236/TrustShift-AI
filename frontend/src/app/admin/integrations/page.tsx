"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  Database,
  FileText,
  Mail,
  Smartphone,
  ExternalLink,
} from "lucide-react";

export default function AdminIntegrationsPage() {
  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Cpu className="w-7 h-7 text-indigo-600" />
            Identity Verification & Security Integrations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Status of external biometric processors, SMS gateways, PDF compilation engines, and cryptographic keystores.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Facial Liveness Provider */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Facial Liveness & Match Engine</h3>
                    <div className="text-[11px] text-slate-400">AWS Rekognition / FaceTec Adapter</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                  SIMULATED ADAPTER
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3">
                Provides real-time camera face detection, passive 3D liveness estimation, and template match distance scoring against enrolled reference vectors.
              </p>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Adapter Mode</span>
                  <span className="font-mono font-medium text-slate-800">Development Simulator V2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target False Match Rate</span>
                  <span className="font-mono font-medium text-slate-800">&lt; 0.001% (Configurable)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">To enable real AWS Rekognition, set AWS_ACCESS_KEY_ID in .env</span>
            </div>
          </div>

          {/* ReportLab PDF Engine */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ReportLab PDF Verification Engine</h3>
                    <div className="text-[11px] text-slate-400">Python 3.12+ Native Binary</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  OPERATIONAL (LIVE)
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3">
                Compiles multi-page forensic incident dossiers, timeline tables, and manager sign-off seals. Calculates byte-level SHA-256 integrity digests.
              </p>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Engine Version</span>
                  <span className="font-mono font-medium text-slate-800">ReportLab 4.4.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cryptographic Digest</span>
                  <span className="font-mono font-medium text-slate-800">SHA-256 Digest Verification</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> High-fidelity vector generation active
              </span>
            </div>
          </div>

          {/* SMS / OTP Provider */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Two-Step OTP Gateway</h3>
                    <div className="text-[11px] text-slate-400">Twilio / Telephony Gateway Adapter</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                  TEST MODE / SIMULATED
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3">
                Dispatches short-lived 6-digit challenge codes with exponential retry cooldowns and attempt rate-limiting.
              </p>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Challenge Lifetime</span>
                  <span className="font-mono font-medium text-slate-800">300 Seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Attempts</span>
                  <span className="font-mono font-medium text-slate-800">5 Attempts Before Lock</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Development mode displays one-click simulated OTP codes</span>
            </div>
          </div>

          {/* Persistence & Database */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Relational Database & Migrations</h3>
                    <div className="text-[11px] text-slate-400">SQLAlchemy 2 & Alembic Engine</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  HEALTHY
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3">
                Normalized schemas with 20 models across organizations, users, verification events, incidents, and audit trails.
              </p>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Engine</span>
                  <span className="font-mono font-medium text-slate-800">SQLite (Local) / PostgreSQL Ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Migration Head</span>
                  <span className="font-mono font-medium text-slate-800">572d06da1a8a (Initial)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Schema constraints verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
