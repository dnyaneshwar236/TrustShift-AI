"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  User,
  Clock,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function ManagerAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        action: actionFilter !== "all" ? actionFilter : undefined,
      });
      setLogs(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.target_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <History className="w-7 h-7 text-indigo-600" />
              Operational Audit Trail
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Append-only, immutable security logs of managerial investigations, policy triggers, and report downloads.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
            >
              <option value="all">All Actions</option>
              <option value="REVIEW_RECORDED">Reviews</option>
              <option value="REPORT_DOWNLOADED">Report Downloads</option>
              <option value="INCIDENT_CREATED">Incident Creater</option>
              <option value="VERIFICATION_REQUESTED">Step-Up Requests</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Querying append-only audit trail...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Audit Events Logged</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All manager actions, report downloads, and security events are automatically logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Audit Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString()}{" "}
                        <span className="text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          {log.actor_email || "System Service"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-sm">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 capitalize">
                          {log.target_type?.replace("_", " ")}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {log.target_id?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {log.metadata ? (
                          <span className="font-mono text-[11px] text-slate-500 truncate block max-w-xs">
                            {JSON.stringify(log.metadata)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
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
