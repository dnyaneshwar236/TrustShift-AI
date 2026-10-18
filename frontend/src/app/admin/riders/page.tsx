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
  RefreshCw,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, bRes] = await Promise.all([
        api.listRiders({
          branch_id: branchFilter !== "all" ? branchFilter : undefined,
          search: search || undefined,
        }),
        api.listBranches(),
      ]);
      setRiders(rRes.data || []);
      setBranches(bRes.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleToggleStatus = async (riderId: string, currentStatus: string) => {
    try {
      if (currentStatus === "active") {
        await api.deactivateRider(riderId);
      } else {
        await api.activateRider(riderId);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              Company-Wide Fleet Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Global administration of all registered field personnel across regional branches.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search riders by name, rider code, email or zone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Branch:</span>
              </div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
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

        {/* Global Riders Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading global personnel directory...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Fleet Personnel</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No riders match the specified branch and search filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Rider Code</th>
                    <th className="py-3 px-4">Legal Name</th>
                    <th className="py-3 px-4">Assigned Branch</th>
                    <th className="py-3 px-4">Onboarding Status</th>
                    <th className="py-3 px-4">Trust Score</th>
                    <th className="py-3 px-4">Enrolled Baselines</th>
                    <th className="py-3 px-4 text-right">Admin Action</th>
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
                          {r.rider_code}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{r.legal_name}</div>
                          <div className="text-[11px] text-slate-400">{r.email || r.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                          {r.branch_name || "Unassigned Hub"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              r.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <TrustScoreBadge score={score} band={band} size="sm" showRecommendation={false} />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                            {r.has_selfie_enrolled ? "Selfie ✓" : "Selfie ✗"} •{" "}
                            {r.has_trustmark_enrolled ? "TrustMark ✓" : "TrustMark ✗"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(r.id, r.status)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border ${
                              r.status === "active"
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {r.status === "active" ? "Deactivate" : "Activate"}
                          </button>
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
