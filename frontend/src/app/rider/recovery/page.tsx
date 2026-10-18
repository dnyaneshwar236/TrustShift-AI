"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  Lock,
  LayoutDashboard,
  ArrowLeft,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RiderLiveTrackingCard } from "@/components/rider/RiderLiveTrackingCard";
import { useAuth } from "@/lib/auth-context";

export default function RiderRecoveryPage() {
  const { user } = useAuth();
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState("lost_phone");
  const [notes, setNotes] = useState("");

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReported(true);
  };

  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Navigation & Header with Redirect to Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Account Recovery & Incident Report
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Report lost devices, suspicious handoff alerts, or request account protection
            </p>
          </div>

          <Link
            href="/rider/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition-colors w-fit"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600" />
            <span>Redirect to Dashboard</span>
          </Link>
        </div>

        {/* Incident Reporting Section */}
        {reported ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs animate-in fade-in">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Account Security Protection Active</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your security incident report has been registered. All active shift sessions on unfamiliar devices have been suspended. Your assigned branch operations manager has been alerted.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 max-w-sm mx-auto flex items-center justify-center gap-2">
              <PhoneCall className="h-4 w-4 text-emerald-600" />
              <span><b>Emergency Dispatch Line:</b> 1-800-555-TRUST (ext. 4)</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReport} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <b>Suspect Unauthorized Account Access or Stolen Phone?</b>
                <p className="mt-0.5 leading-relaxed text-rose-700">
                  Submitting this report immediately restricts your account credentials from starting new shifts until you re-authenticate with physical photo ID review.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 block">Report Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="lost_phone">Lost or stolen primary smartphone</option>
                <option value="compromised_credentials">Suspected password/OTP compromise</option>
                <option value="false_verification_alert">Flagged by mistaken biometric verification mismatch</option>
                <option value="device_damage">Cracked camera glass causing verification blur</option>
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 block">Incident Context & Notes</label>
              <textarea
                rows={4}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what occurred, your last confirmed delivery, current location, and contact phone..."
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <Link
                href="/rider/dashboard"
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cancel and Return to Dashboard</span>
              </Link>

              <button
                type="submit"
                className="py-2.5 px-5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Submit Urgent Security Freeze Report
              </button>
            </div>
          </form>
        )}

        {/* Bottom of Account Recovery: Live Mode Self-Tracking & Google Maps */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Emergency Live Mode: Self-Tracking & Google Maps
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live GPS
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Track your current real-time coordinates, view interactive maps, or redirect directly to Google Maps for dispatch and safety verification.
                </p>
              </div>
            </div>

            <Link
              href="/rider/dashboard"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors shrink-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600" />
              <span>Redirect to Dashboard</span>
            </Link>
          </div>

          {/* Embedded Live Tracking Card */}
          <RiderLiveTrackingCard
            riderCode={user?.rider_code || "RDR-1082"}
            riderName={user?.legal_name || "Rider"}
            showDashboardRedirect={true}
          />
        </div>
      </div>
    </AppShell>
  );
}
