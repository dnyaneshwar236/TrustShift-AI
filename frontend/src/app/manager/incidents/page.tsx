"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api, IncidentSummary } from "@/lib/api";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import {
  AlertTriangle,
  Search,
  Filter,
  FileText,
  ChevronRight,
  ShieldAlert,
  Clock,
  User,
  ArrowUpRight,
  Download,
  RefreshCw,
} from "lucide-react";

export default function IncidentsListPage() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (severityFilter !== "all") params.severity = severityFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.listIncidents(params);
      setIncidents(res.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-red-600" />
              Incident Investigation Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Active security alerts, identity continuity mismatches, and manager review queue.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchIncidents()}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/manager/reports"
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF Reports Archive
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Incident #, Rider Name, Code or Branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Severity:</span>
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
                <span className="hidden sm:inline">Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="awaiting_verification">Awaiting Verification</option>
                <option value="resolved">Resolved</option>
                <option value="false_alert">False Alert</option>
              </select>

              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* Table of Incidents */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading active security incidents...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={fetchIncidents}
                className="mt-3 text-xs underline font-medium text-slate-600"
              >
                Try again
              </button>
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Incidents Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No active security incidents match your current filter criteria. Use the Demo Panel in the header to trigger a simulated handoff scenario.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Incident #</th>
                    <th className="py-3 px-4">Rider / Branch</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Trigger & Reason</th>
                    <th className="py-3 px-4">Trust Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Detected</th>
                    <th className="py-3 px-4">Report</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <Link
                          href={`/manager/incidents/${inc.id}`}
                          className="hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                          {inc.incident_number}
                          <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{inc.rider_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                          <span>{inc.rider_code}</span>
                          {inc.branch_name && (
                            <>
                              <span>•</span>
                              <span className="font-sans">{inc.branch_name}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inc.severity === "critical"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : inc.severity === "high"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : inc.severity === "medium"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">{inc.title}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {inc.reason_codes.slice(0, 2).map((code) => (
                            <span
                              key={code}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[9px] rounded-xs"
                            >
                              {code}
                            </span>
                          ))}
                          {inc.reason_codes.length > 2 && (
                            <span className="text-[9px] text-slate-400">
                              +{inc.reason_codes.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TrustScoreBadge
                          score={inc.risk_score_at_detection}
                          band={
                            inc.risk_score_at_detection >= 80
                              ? "high_trust"
                              : inc.risk_score_at_detection >= 60
                              ? "caution"
                              : inc.risk_score_at_detection >= 50
                              ? "elevated_risk"
                              : "critical"
                          }
                          size="sm"
                          showRecommendation={false}
                        />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                            inc.status === "open"
                              ? "bg-rose-50 text-rose-700 font-bold"
                              : inc.status === "under_review"
                              ? "bg-indigo-50 text-indigo-700"
                              : inc.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 font-semibold"
                              : inc.status === "false_alert"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {inc.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(inc.created_at).toLocaleDateString()}{" "}
                        <span className="text-slate-400">
                          {new Date(inc.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inc.has_pdf_report ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            Ready
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Generating</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/manager/incidents/${inc.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                          Inspect
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
