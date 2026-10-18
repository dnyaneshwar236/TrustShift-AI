"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Building,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create manager modal state
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Manager@12345");
  const [title, setTitle] = useState("Operations Lead");
  const [department, setDepartment] = useState("Fleet Logistics");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, bRes] = await Promise.all([api.listManagers(), api.listBranches()]);
      setManagers(mRes.data || []);
      setBranches(bRes.data || []);
      if (bRes.data && bRes.data.length > 0 && !branchId) {
        setBranchId(bRes.data[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createManager({
        email,
        password,
        title,
        department,
        branch_id: branchId || undefined,
      });
      setShowModal(false);
      setEmail("");
      alert("Manager account provisioned successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to create manager");
    } finally {
      setSubmitting(false);
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
              Operations Manager Accounts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Authorized security review personnel with branch-scoped investigation privileges.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Provision Manager
            </button>
          </div>
        </div>

        {/* Managers Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading manager directory...</p>
            </div>
          ) : managers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Manager Accounts</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Provision a branch manager account to enable field shift supervision and incident reviews.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Manager Email</th>
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Branch Scope</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {managers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                          {m.email.charAt(0).toUpperCase()}
                        </div>
                        {m.email}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">{m.title}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{m.department}</td>
                      <td className="py-3.5 px-4 text-slate-800 whitespace-nowrap font-medium">
                        {m.branch_name || "Enterprise Scope"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Provision Manager */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  Provision Manager Account
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateManager} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manager Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="manager.lead@trustshift.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Scope</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
                  >
                    <option value="">All Branches (Enterprise)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                  >
                    {submitting ? "Provisioning..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
