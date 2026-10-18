"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Play,
  Square,
  Camera,
  PenTool,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Info,
  LifeBuoy,
  ShieldAlert,
  Lock,
  PhoneCall,
  MapPin,
  Globe,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import { ShiftVerificationModal } from "@/components/verification/ShiftVerificationModal";
import { RiderLiveTrackingCard } from "@/components/rider/RiderLiveTrackingCard";
import { useAuth } from "@/lib/auth-context";
import { api, TrustScoreBreakdown } from "@/lib/api";

export default function RiderDashboardPage() {
  const { user } = useAuth();

  const [sessionData, setSessionData] = useState<any>(null);
  const [trustData, setTrustData] = useState<TrustScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const fetchSessionInfo = async () => {
    try {
      setLoading(true);
      const res = await api.getCurrentSession();
      if (res.success && res.data) {
        setSessionData(res.data.session);
        setTrustData(res.data.trust);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionInfo();
  }, []);

  const handleStartShift = async () => {
    try {
      setActionLoading(true);
      await api.startShift({
        device_fingerprint: "fp_samsung_s24_trusted",
        device_name: "Samsung Galaxy S24 Ultra",
        location_area: "Central Logistics Hub",
      });
      await fetchSessionInfo();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    try {
      setActionLoading(true);
      await api.endShift({ notes: "Completed normal shift cycle" });
      await fetchSessionInfo();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isOnShift = sessionData?.shift_status === "on_shift";
  const score = trustData?.trust_score ?? 88.0;
  const band = trustData?.score_band ?? "high_trust";

  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6">
        {/* Welcome & Shift status banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Welcome back, {user?.legal_name || "Rider"}
              </h2>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                {user?.rider_code || "RDR-1082"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Assigned to {user?.branch_name || "Metro Central Branch"} • Shift continuity monitoring active
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isOnShift ? (
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  SHIFT ACTIVE
                </span>
                <button
                  type="button"
                  onClick={handleEndShift}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>End Shift</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  OFF SHIFT
                </span>
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(true)}
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Shift</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Continuity Risk Evaluation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-1 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Identity Trust
                </span>
                <TrustScoreBadge score={score} band={band} size="sm" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{score.toFixed(1)}</span>
                <span className="text-slate-400 text-sm font-semibold">/ 100</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-600">Engine Action:</span>
                  <span className="uppercase text-indigo-700 font-bold">
                    {trustData?.recommended_action || "CONTINUE"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Coverage Confidence:</span>
                  <b>{trustData?.evidence_coverage || 98}%</b>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Active Reason Signals:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(trustData?.reason_codes || ["IDENTITY_CONFIRMED", "KNOWN_DEVICE_CONFIRMED"]).map(
                    (code) => (
                      <span
                        key={code}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono border border-slate-200"
                      >
                        {code}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/rider/identity-verification"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Verify Selfie Check-in</span>
            </Link>
          </div>

          {/* 5-Component Score Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">5-Signal Continuity Breakdown</h3>
                <p className="text-xs text-slate-500">Transparent explainable rule model weights</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Rule v1.4</span>
            </div>

            <div className="space-y-3.5 pt-1 text-xs">
              {/* 1. Identity Biometric (30%) */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-indigo-600" />
                    Identity Verification Evidence (30% weight)
                  </span>
                  <span className="font-bold text-slate-900">
                    {trustData?.identity_score ?? 95}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${trustData?.identity_score ?? 95}%` }}
                  />
                </div>
              </div>

              {/* 2. Authentication (20%) */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    Authentication & 2FA Security (20% weight)
                  </span>
                  <span className="font-bold text-slate-900">
                    {trustData?.auth_score ?? 96}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${trustData?.auth_score ?? 96}%` }}
                  />
                </div>
              </div>

              {/* 3. Device Continuity (20%) */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                    Device & Session Continuity (20% weight)
                  </span>
                  <span className="font-bold text-slate-900">
                    {trustData?.device_score ?? 94}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${trustData?.device_score ?? 94}%` }}
                  />
                </div>
              </div>

              {/* 4. Behavioural Consistency (20%) */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    Shift Behavioural Consistency (20% weight)
                  </span>
                  <span className="font-bold text-slate-900">
                    {trustData?.behavior_score ?? 90}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${trustData?.behavior_score ?? 90}%` }}
                  />
                </div>
              </div>

              {/* 5. Corroborating Evidence (10%) */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                    Corroborating Security Evidence (10% weight)
                  </span>
                  <span className="font-bold text-slate-900">
                    {trustData?.corroborating_score ?? 90}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${trustData?.corroborating_score ?? 90}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Check-in & Account Recovery Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/rider/identity-verification"
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Camera className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Selfie Check-in</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Take a quick camera selfie to update facial continuity
              </p>
            </div>
          </Link>

          <Link
            href="/rider/trustmark"
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <PenTool className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">TrustMark Signature</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Draw personal pattern for secondary step-up verification
              </p>
            </div>
          </Link>

          <Link
            href="/rider/security"
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Smartphone className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Trusted Devices</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Review enrolled handsets and 2-step verification security
              </p>
            </div>
          </Link>

          <a
            href="#account-recovery-section"
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-rose-300 hover:shadow-md transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-slate-900">Account Recovery</h4>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Live</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Report lost handset, security freeze, and live corridor maps
              </p>
            </div>
          </a>
        </div>

        {/* Dedicated Account Recovery & Incident Protection Section */}
        <div id="account-recovery-section" className="space-y-4 pt-1">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs">
                  <LifeBuoy className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Account Recovery & Incident Security
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Security Standby
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Emergency account recovery tools, shift lock, and live geolocation corridor tracking for dispatch verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/rider/recovery"
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>File Full Recovery Report</span>
                </Link>
              </div>
            </div>

            {/* Quick Emergency Recovery Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                  <Lock className="h-4 w-4 text-rose-600" />
                  <span>Freeze Shift & Lock Session</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Instantly restrict device credentials if your smartphone was misplaced or stolen.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-700 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Biometric Mismatch Review</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Request manual supervisor unblock if camera glare triggered false mismatch.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <PhoneCall className="h-4 w-4 text-emerald-600" />
                  <span>24/7 Operations Dispatch</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Immediate emergency support hotline: <b className="text-slate-800">1-800-555-TRUST (ext. 4)</b>
                </p>
              </div>
            </div>

            {/* Bottom of Account Recovery: Live Mode Self-Tracking & Google Maps */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Live Mode: Real-Time Self-Tracking & Google Maps Corridor
                  </h4>
                  <p className="text-xs text-slate-500">
                    Live GPS telemetry tracks your current real-time coordinates and redirects directly to Google Maps for exact visual view.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1">
                  <span>GPS Telemetry Active</span>
                </span>
              </div>

              {/* Embedded Interactive Live Self-Tracking & Google Maps Card */}
              <RiderLiveTrackingCard
                riderCode={user?.rider_code || "RDR-1082"}
                riderName={user?.legal_name || "Rider"}
              />
            </div>
          </div>
        </div>

        {/* Shift Biometric Verification Modal */}
        <ShiftVerificationModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          onShiftStarted={async () => {
            await fetchSessionInfo();
          }}
          riderCode={user?.rider_code || "RDR-1082"}
          riderName={user?.legal_name || "Rider"}
        />
      </div>
    </AppShell>
  );
}
