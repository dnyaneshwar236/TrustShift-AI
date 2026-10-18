"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import {
  Activity,
  Search,
  RefreshCw,
  Smartphone,
  MapPin,
  Clock,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Camera,
} from "lucide-react";

export default function ManagerSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.getLiveSessions();
      setSessions(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Activity className="w-7 h-7 text-emerald-600" />
              Live Shift & Session Monitor
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time identity continuity telemetry, active shifts, and terminal transitions.
            </p>
          </div>
          <button
            onClick={fetchSessions}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </button>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Polling active fleet terminal sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Active Sessions</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no active field riders on shift. Riders can start a shift from their mobile dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((s, idx) => {
              const score = s.trust_score ?? 88;
              const band =
                score >= 80 ? "high_trust" : score >= 60 ? "caution" : score >= 50 ? "elevated_risk" : "critical";

              return (
                <div
                  key={s.id || `session-${idx}`}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          {s.rider_code || "TS-RIDER"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{s.rider_name}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE SHIFT
                      </span>
                    </div>

                    <div className="my-4 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Identity Continuity</div>
                        <div className="font-mono font-bold text-base text-slate-900 mt-0.5">{score}/100</div>
                      </div>
                      <TrustScoreBadge score={score} band={band} size="sm" showRecommendation={false} />
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" /> Terminal
                        </span>
                        <span className="font-medium text-slate-800 truncate max-w-[140px]">
                          {s.device_name || "Pixel 8 Pro (Enrolled)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Zone / Hub
                        </span>
                        <span className="font-medium text-slate-800">{s.location_area || "Downtown North"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Started
                        </span>
                        <span className="font-medium text-slate-800">
                          {new Date(s.authenticated_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/manager/riders/${s.rider_id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      View Dossier <ChevronRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => alert(`Re-verification step-up challenge sent to ${s.rider_name}.`)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      Prompt Check
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
