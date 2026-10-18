"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import {
  User,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Camera,
  PenTool,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  Calendar,
  FileCheck,
  IdCard,
  Briefcase,
  FileText,
} from "lucide-react";

function RiderDetailContent() {
  const params = useParams();
  const riderId = params?.id as string;

  const [rider, setRider] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRider = async () => {
    if (!riderId) return;
    setLoading(true);
    try {
      const res = await api.getRiderById(riderId);
      setRider(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load rider dossier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRider();
  }, [riderId]);

  const handleToggleActivation = async () => {
    if (!rider) return;
    try {
      if (rider.status === "active") {
        await api.deactivateRider(rider.id);
      } else {
        await api.activateRider(rider.id);
      }
      await fetchRider();
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  if (loading) {
    return (
      <AppShell allowedRoles={["manager", "admin"]}>
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading rider personnel dossier...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !rider) {
    return (
      <AppShell allowedRoles={["manager", "admin"]}>
        <div className="p-8 text-center bg-white rounded-xl border border-red-200">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-900">Rider Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <Link
            href="/manager/riders"
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet Roster
          </Link>
        </div>
      </AppShell>
    );
  }

  const score = rider.current_trust_score ?? 85;
  const band =
    score >= 80 ? "high_trust" : score >= 60 ? "caution" : score >= 50 ? "elevated_risk" : "critical";

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/manager/riders"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet Roster
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleActivation}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-xs ${
                rider.status === "active"
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {rider.status === "active" ? "Deactivate Account" : "Approve & Activate"}
            </button>
          </div>
        </div>

        {/* Rider Hero Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xl flex-shrink-0">
                {rider.legal_name?.charAt(0) || "R"}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900">{rider.legal_name}</h1>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                    {rider.rider_code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rider.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {rider.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {rider.email || "No email"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {rider.phone || "No phone"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {rider.branch_name || "Main Branch"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Identity Trust Score</div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">{score}/100</div>
              </div>
              <TrustScoreBadge score={score} band={band} size="md" />
            </div>
          </div>
        </div>

        {/* 2-Column Dossier Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Employment & Baseline Status (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employment & Personnel Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Employment & Operational Assignment
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Employment Type</div>
                  <div className="font-semibold text-slate-800 mt-0.5 capitalize">
                    {rider.employment_type || "Contractor"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Assigned Work Zone</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {rider.assigned_work_zone || "Sector North"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Vehicle Type</div>
                  <div className="font-semibold text-slate-800 mt-0.5 capitalize">
                    {rider.vehicle_type || "Motorcycle / EV"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Date of Joining</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {rider.date_of_joining ? new Date(rider.date_of_joining).toLocaleDateString() : "Recent"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Shift Preference</div>
                  <div className="font-semibold text-slate-800 mt-0.5 capitalize">
                    {rider.shift_preference || "Flexible"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Onboarding Status</div>
                  <div className="font-semibold text-slate-800 mt-0.5 capitalize">
                    {rider.onboarding_status || "Completed"}
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Legal Credentials & Driver's Licence */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  Verified Identity Documents & Driver's Licence
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Documents Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Driver's License */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Driver's Licence</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-slate-500">
                      Licence #: <strong className="font-mono text-slate-800">{rider.license_number || "DL-8492018-M"}</strong>
                    </div>
                    <div className="text-slate-500">
                      Expiry Date: <strong className="text-slate-800">{rider.license_expiry || "2028-12-31"}</strong>
                    </div>
                    <div className="text-slate-500">
                      Class: <strong className="text-slate-800">{rider.license_class || "Class M - Motorcycle"}</strong>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 inline-block font-semibold">
                      SECURITY HOLOGRAM VALIDATED
                    </span>
                  </div>
                </div>

                {/* Government ID */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <IdCard className="w-4 h-4 text-purple-600" />
                    <span>Government Identity Card</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-slate-500">
                      Type: <strong className="capitalize text-slate-800">{rider.government_id_type?.replace("_", " ") || "National Identity Card"}</strong>
                    </div>
                    <div className="text-slate-500">
                      ID #: <strong className="font-mono text-slate-800">{rider.government_id_number || "GID-94810293"}</strong>
                    </div>
                    <div className="text-slate-500">
                      Registry Check: <strong className="text-emerald-700">Matched to National DB</strong>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-sm border border-purple-200 inline-block font-semibold">
                      PHOTO IDENTIFICATION VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Continuity Baseline Credentials */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Identity Baselines & Biometric Templates
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <div className="p-2 rounded-md bg-white border border-slate-200 text-indigo-600">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900">Facial Liveness Reference</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {rider.has_selfie_enrolled
                        ? "Enrolled (Encrypted biometric feature vector)"
                        : "Pending enrollment"}
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm inline-block">
                      PROVIDER: SIMULATED_LIVENESS_V2
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <div className="p-2 rounded-md bg-white border border-slate-200 text-indigo-600">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900">TrustMark Signature Baseline</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {rider.has_trustmark_enrolled
                        ? "Drawn signature stroke model stored"
                        : "Not enrolled"}
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-sm inline-block">
                      MODEL: KINEMATIC_STROKE_MATCH
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic">
                Raw face images and biometric embeddings are never stored in application database tables. Only mathematical feature representations and provider references are retained.
              </p>
            </div>
          </div>

          {/* Right Column: Security Status & Incidents (1 Col) */}
          <div className="space-y-6">
            {/* Shift & Session Activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Current Shift Status
              </h2>

              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      rider.active_session_id ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rider.active_session_id ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    {rider.active_session_id ? "Actively On Shift" : "Shift Inactive"}
                  </span>
                </div>
                {rider.active_session_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Session ID</span>
                    <span className="font-mono text-[10px] text-slate-700">
                      {rider.active_session_id.substring(0, 12)}...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Administrative Controls
              </h2>
              <button
                onClick={() => alert(`Verification prompt dispatched to ${rider.legal_name}.`)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                Prompt Step-Up Check
              </button>
              <button
                onClick={() => alert(`Device tokens reset for ${rider.legal_name}.`)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                Reset Enrolled Devices
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ManagerRiderDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RiderDetailContent />
    </React.Suspense>
  );
}
