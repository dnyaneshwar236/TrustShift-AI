"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  Building,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.listBranches();
      setBranches(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createBranch({
        name,
        code,
        city,
        state,
      });
      setShowModal(false);
      setName("");
      setCode("");
      setCity("");
      setState("");
      alert("Branch created successfully.");
      await fetchBranches();
    } catch (err: any) {
      setError(err.message || "Failed to create branch");
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
              <Building className="w-7 h-7 text-indigo-600" />
              Regional Logistics Hubs & Branches
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Geographic operational scopes for personnel assignment, shift dispatching, and manager authority.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBranches}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Branch
            </button>
          </div>
        </div>

        {/* Branches Grid */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading branch networks...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Branches Registered</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Create your organization's first regional dispatch branch to begin assigning fleet workers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-sm">
                      {b.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">{b.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {b.city ? `${b.city}, ${b.state || ""}` : "Metropolitan Service Area"}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {b.riders_count} Assigned Riders
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Created {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Branch */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  Create Regional Branch
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

              <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Westside Logistics Terminal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Code (3-6 chars) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="WST-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Chicago"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      placeholder="IL"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>
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
                    {submitting ? "Creating..." : "Save Branch"}
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
