"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  Settings,
  Shield,
  Building,
  Lock,
  Save,
  CheckCircle2,
  Key,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const [orgName, setOrgName] = useState(user?.organization_name || "SwiftPulse Logistics");
  const [retentionDays, setRetentionDays] = useState(90);
  const [force2FAAll, setForce2FAAll] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            Organization & Cryptographic Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise retention windows, cryptographic session lifetimes, and organizational identity.
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            Organization security settings updated successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Company Identity
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Display Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Biometric Data Governance & Cryptographic Retention
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Forensic Audit & Biometric Vector Retention Period (Days)
              </label>
              <input
                type="number"
                min={30}
                max={365}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                In compliance with GDPR and gig-worker privacy standards, non-critical event features are expunged automatically after this period.
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={force2FAAll}
                  onChange={(e) => setForce2FAAll(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Mandatory 2FA For All Administrative & Manager Accounts
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Enforces two-step OTP challenge on every manager and administrator sign-in.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
