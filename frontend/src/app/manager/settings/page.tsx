"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  Settings,
  Bell,
  Shield,
  Building,
  CheckCircle2,
  Mail,
  User,
  Save,
} from "lucide-react";

export default function ManagerSettingsPage() {
  const { user } = useAuth();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [autoStepUp, setAutoStepUp] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            Manager Operational Preferences
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure branch dispatch notifications, alert escalation thresholds, and workstation scope.
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            Manager preferences saved successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Workstation Profile */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Workstation & Branch Assignment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Manager Identity</label>
                <div className="font-semibold text-slate-800 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  {user?.email || "manager@trustshift.ai"}
                </div>
              </div>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Organization Scope</label>
                <div className="font-semibold text-slate-800 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  {user?.organization_name || "SwiftPulse Logistics"}
                </div>
              </div>
            </div>
          </div>

          {/* Alert Delivery Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              Incident Escalation & Notification Channels
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Immediate Email Dispatches</div>
                  <div className="text-[11px] text-slate-500">
                    Send email alerts to {user?.email} whenever critical continuity deviations are detected.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalOnly}
                  onChange={(e) => setCriticalOnly(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Filter High/Critical Only</div>
                  <div className="text-[11px] text-slate-500">
                    Suppress low and medium severity notifications to reduce alert fatigue.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStepUp}
                  onChange={(e) => setAutoStepUp(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Auto-Prompt Biometric Step-Up</div>
                  <div className="text-[11px] text-slate-500">
                    Automatically prompt the rider terminal for a facial verification challenge when terminal swaps occur.
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
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
