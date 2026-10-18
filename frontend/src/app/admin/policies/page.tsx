"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  Sliders,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Lock,
  Smartphone,
  Camera,
  PenTool,
} from "lucide-react";

export default function AdminPoliciesPage() {
  const [policy, setPolicy] = useState<any>({
    critical_threshold: 50,
    elevated_threshold: 60,
    caution_threshold: 80,
    require_2fa_on_new_device: true,
    require_selfie_on_shift_start: true,
    require_trustmark_on_high_risk: true,
    auto_create_incident_on_mismatch: true,
    max_failed_attempts_before_lock: 5,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await api.getPolicy();
      if (res.data) {
        setPolicy(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    try {
      const res = await api.updatePolicy({
        critical_threshold: Number(policy.critical_threshold),
        elevated_threshold: Number(policy.elevated_threshold),
        caution_threshold: Number(policy.caution_threshold),
        require_2fa_on_new_device: Boolean(policy.require_2fa_on_new_device),
        require_selfie_on_shift_start: Boolean(policy.require_selfie_on_shift_start),
        require_trustmark_on_high_risk: Boolean(policy.require_trustmark_on_high_risk),
        auto_create_incident_on_mismatch: Boolean(policy.auto_create_incident_on_mismatch),
        max_failed_attempts_before_lock: Number(policy.max_failed_attempts_before_lock),
      });
      setPolicy(res.data);
      setSuccessMsg("Organizational risk score policies updated and broadcasted.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update policy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Sliders className="w-7 h-7 text-indigo-600" />
              Risk Engine & Verification Policy
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tune mathematical continuity thresholds, automated incident triggers, and authentication step-ups.
            </p>
          </div>
          <button
            onClick={fetchPolicy}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Reset to Server
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Score Threshold Bands */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Continuity Trust Score Bands</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the numerical thresholds governing the 4 operational risk levels.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Critical Incident Trigger Threshold
                  </span>
                  <span className="font-mono font-bold text-red-600">
                    &lt; {policy.critical_threshold} pts
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={60}
                  step={1}
                  value={policy.critical_threshold}
                  onChange={(e) => setPolicy({ ...policy, critical_threshold: Number(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Scores falling strictly below this threshold automatically generate a critical incident for manager investigation.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Elevated Risk Floor
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    {policy.critical_threshold} - {policy.elevated_threshold} pts
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={75}
                  step={1}
                  value={policy.elevated_threshold}
                  onChange={(e) => setPolicy({ ...policy, elevated_threshold: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Caution Risk Floor
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    {policy.elevated_threshold} - {policy.caution_threshold} pts
                  </span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={90}
                  step={1}
                  value={policy.caution_threshold}
                  onChange={(e) => setPolicy({ ...policy, caution_threshold: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Scores equal to or above {policy.caution_threshold} are categorized as High Trust (Verified).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Automated Actions & Enforcement Rules */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Enforcement & Verification Policies</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Control mandatory biometric step-ups and automated challenge dispatch.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.require_2fa_on_new_device}
                  onChange={(e) => setPolicy({ ...policy, require_2fa_on_new_device: e.target.checked })}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Mandatory 2FA OTP on Unenrolled Terminal
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Force an OTP code challenge whenever a rider signs in from a browser or phone not on their trusted device list.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.require_selfie_on_shift_start}
                  onChange={(e) => setPolicy({ ...policy, require_selfie_on_shift_start: e.target.checked })}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Prompt Biometric Selfie Check on Shift Check-In
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Require real-time camera face verification before an active delivery shift can be initiated.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.require_trustmark_on_high_risk}
                  onChange={(e) => setPolicy({ ...policy, require_trustmark_on_high_risk: e.target.checked })}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Require TrustMark Signature on Elevated Deviations
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Prompt rider to draw enrolled kinematic signature pattern when unusual session transitions occur.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.auto_create_incident_on_mismatch}
                  onChange={(e) => setPolicy({ ...policy, auto_create_incident_on_mismatch: e.target.checked })}
                  className="mt-0.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Auto-Generate Incident Dossier on Biometric Mismatch
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Automatically create an investigation record and dispatch an in-app alert to the branch manager upon failed selfie match.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {submitting ? "Broadcasting..." : "Save Policy Configuration"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
