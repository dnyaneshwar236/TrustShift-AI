"use client";

import React, { useState, useEffect } from "react";
import { History, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Camera, PenTool, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

export default function RiderVerificationHistoryPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.getVerificationHistory();
        if (res.success && res.data) {
          setEvents(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Verification History</h2>
          <p className="text-xs text-slate-500">
            Timeline of biometric portrait verifications and TrustMark pattern assessments
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No historical checks recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((ev) => (
                <div key={ev.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        ev.outcome === "match"
                          ? "bg-emerald-50 text-emerald-600"
                          : ev.outcome === "no_match"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {ev.verification_type.includes("selfie") ? (
                        <Camera className="h-5 w-5" />
                      ) : (
                        <PenTool className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <b className="text-slate-900 font-bold capitalize">
                          {ev.verification_type.replace("_", " ")}
                        </b>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            ev.outcome === "match"
                              ? "bg-emerald-100 text-emerald-800"
                              : ev.outcome === "no_match"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ev.outcome.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Ref: <span className="font-mono">{ev.provider_reference}</span> • Reason:{" "}
                        <span className="font-medium text-slate-700">{ev.reason_code}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-900 font-bold text-xs block">
                      {ev.confidence_score ? `${ev.confidence_score}% match` : "Assessed"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(ev.occurred_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
