"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Camera,
} from "lucide-react";

export default function ManagerRidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await api.listRiders({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      setRiders(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRiders();
  };

  const handleToggleStatus = async (riderId: string, currentStatus: string) => {
    try {
      if (currentStatus === "active") {
        await api.deactivateRider(riderId);
      } else {
        await api.activateRider(riderId);
      }
      fetchRiders();
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              Fleet Personnel Roster
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Field personnel identity verification status, active shifts, and organizational scoping.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRiders()}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/manager/riders/new"
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Onboard Rider
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search riders by name, rider ID, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="temporarily_restricted">Temporarily Restricted</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Riders Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading fleet personnel roster...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Riders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No fleet personnel match your search filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Rider ID</th>
                    <th className="py-3 px-4">Full Legal Name</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Identity Baseline</th>
                    <th className="py-3 px-4">Trust Score</th>
                    <th className="py-3 px-4">Shift Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riders.map((r) => {
                    const score = r.current_trust_score ?? 85;
                    const band =
                      score >= 80 ? "high_trust" : score >= 60 ? "caution" : score >= 50 ? "elevated_risk" : "critical";

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <Link
                            href={`/manager/riders/${r.id}`}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {r.rider_code}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{r.legal_name}</div>
                          <div className="text-[11px] text-slate-400">{r.email || r.phone || "No contact"}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">{r.branch_name || "Main Hub"}</div>
                          <div className="text-[10px] text-slate-400">{r.assigned_work_zone || "Zone A"}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              r.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : r.status === "pending_approval" || r.status === "pending_verification"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              title={r.has_selfie_enrolled ? "Selfie Enrolled" : "No Selfie Baseline"}
                              className={`p-1 rounded-sm text-[10px] font-bold ${
                                r.has_selfie_enrolled
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              Selfie
                            </span>
                            <span
                              title={r.has_trustmark_enrolled ? "TrustMark Enrolled" : "No Signature Baseline"}
                              className={`p-1 rounded-sm text-[10px] font-bold ${
                                r.has_trustmark_enrolled
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              TrustMark
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <TrustScoreBadge
                            score={score}
                            band={band}
                            size="sm"
                            showRecommendation={false}
                          />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              r.active_session_id
                                ? "text-emerald-700 font-semibold"
                                : "text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                r.active_session_id ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                              }`}
                            />
                            {r.active_session_id ? "On Shift" : "Off Shift"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(r.id, r.status)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded-md border ${
                                r.status === "active"
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {r.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <Link
                              href={`/manager/riders/${r.id}`}
                              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1"
                            >
                              Dossier
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
