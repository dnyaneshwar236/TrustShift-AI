"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Radio,
  AlertTriangle,
  AlertOctagon,
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  FileText
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import { api, IncidentSummary } from "@/lib/api";

export default function ManagerDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, incRes, sessRes] = await Promise.all([
        api.getDashboardSummary(),
        api.listIncidents({ severity: "critical" }),
        api.getLiveSessions(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (incRes.success) setIncidents(incRes.data.slice(0, 5));
      if (sessRes.success) setSessions(sessRes.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-8">
        {/* Top title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Fleet Operations & Continuity Center
            </h2>
            <p className="text-xs text-slate-500">
              Live identity continuity surveillance, account handoff detection, and review queue
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Telemetry</span>
            </button>
            <Link
              href="/manager/incidents"
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
            >
              <span>Investigation Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* 8 KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Total Riders</span>
              <Users className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.total_registered_riders ?? 24}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Registered fleet profiles</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold text-slate-600">Active Riders</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.active_riders ?? 18}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Authorized for shifts</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-xs font-semibold text-slate-600">Active Sessions</span>
              <Radio className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-indigo-600">
              {summary?.active_sessions ?? 8}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Currently on dispatch shift</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-amber-500">
              <span className="text-xs font-semibold text-slate-600">Pending Onboarding</span>
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.pending_onboarding ?? 3}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting biometrics / review</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Open Incidents</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.open_incidents ?? 4}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Under active investigation</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-xs font-bold text-rose-800">Critical Alerts</span>
              <AlertOctagon className="h-4 w-4 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-rose-700">
              {summary?.critical_incidents ?? 1}
            </p>
            <span className="text-[10px] text-rose-700 font-medium">Suspected account handoffs</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Verification Prompts</span>
              <RefreshCw className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.verification_requests_awaiting ?? 2}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Step-up challenges sent</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold text-slate-600">Resolved Cases</span>
              <FileCheck className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {summary?.resolved_incidents ?? 14}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Reviewed & resolved</span>
          </div>
        </div>

        {/* Recent Critical Incidents Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="font-bold text-sm text-slate-900">
                Critical Identity Mismatch Alerts
              </h3>
            </div>
            <Link
              href="/manager/incidents"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Full Incident Queue &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Rider</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Detected Trigger</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Report</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No active critical incidents. System state normal.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {inc.incident_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{inc.rider_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{inc.rider_code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {inc.branch_name || "Metro Central"}
                      </td>
                      <td className="py-3.5 px-4">
                        <TrustScoreBadge score={inc.risk_score_at_detection} band="critical" size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {inc.reason_codes.slice(0, 2).map((r) => (
                            <span
                              key={r}
                              className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {inc.has_pdf_report ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                            <FileText className="h-3.5 w-3.5 text-indigo-600" />
                            Ready
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/manager/incidents/${inc.id}`}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors inline-block"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Active Shifts Monitor Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Live Active Fleet Shifts</h3>
              <p className="text-xs text-slate-500">Real-time continuity evaluations across field riders</p>
            </div>
            <Link
              href="/manager/sessions"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Monitor All Sessions &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Rider</th>
                  <th className="py-3 px-4">Hardware Device</th>
                  <th className="py-3 px-4">Shift Status</th>
                  <th className="py-3 px-4">Trust Score</th>
                  <th className="py-3 px-4">Engine Action</th>
                  <th className="py-3 px-4 text-right">Active Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No active shift sessions currently online.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.session_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{s.rider_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{s.rider_code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {s.device_name || "Enrolled Handset"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            s.shift_status === "on_shift"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {s.shift_status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <TrustScoreBadge score={s.trust_score} band={s.score_band} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <b
                          className={`text-xs ${
                            s.recommended_action === "INVESTIGATE"
                              ? "text-rose-600"
                              : s.recommended_action === "VERIFY"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {s.recommended_action}
                        </b>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {new Date(s.authenticated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
