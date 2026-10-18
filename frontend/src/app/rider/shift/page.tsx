"use client";

import React, { useState, useEffect } from "react";
import { Clock, Play, Square, MapPin, Smartphone, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ShiftVerificationModal } from "@/components/verification/ShiftVerificationModal";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function RiderShiftPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [zone, setZone] = useState("Metro Central Hub");

  const loadCurrentSession = async () => {
    try {
      setLoading(true);
      const res = await api.getCurrentSession();
      if (res.success && res.data) {
        setSession(res.data.session);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentSession();
  }, []);

  const handleStart = async () => {
    try {
      setActionLoading(true);
      await api.startShift({
        device_fingerprint: "fp_samsung_s24_trusted",
        device_name: "Samsung Galaxy S24 Ultra",
        location_area: zone,
      });
      await loadCurrentSession();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    try {
      setActionLoading(true);
      await api.endShift({ notes: "Completed normal delivery dispatch shift." });
      await loadCurrentSession();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isOnShift = session?.shift_status === "on_shift";

  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Shift Management</h2>
          <p className="text-xs text-slate-500">
            Control your delivery shift lifecycle and view real-time hardware telemetry
          </p>
        </div>

        {/* Current Shift Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Shift Telemetry Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${
                    isOnShift ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                  }`}
                />
                <h3 className="text-base font-bold text-slate-900">
                  {isOnShift ? "Currently On Active Shift" : "Shift Inactive (Off Shift)"}
                </h3>
              </div>
            </div>

            {isOnShift ? (
              <button
                type="button"
                onClick={handleEnd}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Conclude Shift</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                disabled={actionLoading}
                className="px-6 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Begin Shift</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                Dispatched Logistics Zone
              </span>
              <p className="font-bold text-slate-800 text-sm">{zone}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                Hardware Device
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {session?.device_name || "Samsung Galaxy S24 Ultra"}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                Session Established
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {session?.shift_started_at
                  ? new Date(session.shift_started_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not on shift"}
              </p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2 text-xs text-indigo-900">
            <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              When shifting between dispatch branches or moving between zones, identity continuity evaluates your session seamlessly. Occasional step-up selfie checks verify identity continuity without locking your shift.
            </p>
          </div>
        </div>

        {/* Biometric Check-in Modal */}
        <ShiftVerificationModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          onShiftStarted={async () => {
            await loadCurrentSession();
          }}
          riderCode={user?.rider_code || session?.rider_code || "RDR-1082"}
          riderName={user?.legal_name || session?.rider_name || "Rider"}
        />
      </div>
    </AppShell>
  );
}
