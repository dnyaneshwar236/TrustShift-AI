"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck,
  Building,
  Users,
  Sliders,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Cpu,
  Lock,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [branches, setBranches] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, mRes, pRes, lRes] = await Promise.all([
        api.listBranches(),
        api.listManagers(),
        api.getPolicy(),
        api.getAuditLogs(),
      ]);
      setBranches(bRes.data || []);
      setManagers(mRes.data || []);
      setPolicy(pRes.data || null);
      setRecentLogs((lRes.data || []).slice(0, 5));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-indigo-600" />
              Company Administration & Security Governance
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Organization-wide policy enforcement, branch operations, and cryptographic audit monitoring.
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

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Operating Branches</span>
              <Building className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-2">{branches.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Metro logistics hubs</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Operations Managers</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-2">{managers.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Authorized shift investigators</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Critical Trigger Band</span>
              <Sliders className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
              &lt; {policy?.critical_threshold ?? 50}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Automatic incident threshold</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Biometric Liveness</span>
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-base font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Adapter
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Simulated Face Liveness V2</p>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Branches & Managers (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Branches Quick Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  Authorized Regional Branches
                </h2>
                <Link
                  href="/admin/branches"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Manage Branches <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {branches.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No branches created yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {branches.map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{b.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          CODE: {b.code} • {b.city || "Metropolitan Area"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                          {b.riders_count} riders
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Managers Quick Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Active Operations Managers
                </h2>
                <Link
                  href="/admin/managers"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Manage Personnel <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {managers.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No manager accounts found.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {managers.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{m.email}</div>
                        <div className="text-[11px] text-slate-400">
                          {m.title} • {m.branch_name}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Policy Status & Audit Feed (1 Col) */}
          <div className="space-y-6">
            {/* Policy Snapshot */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Active Security Policy
                </h2>
                <Link
                  href="/admin/policies"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Edit Policy
                </Link>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span>Critical Score Trigger</span>
                  <span className="font-mono font-bold text-red-600">
                    &lt; {policy?.critical_threshold ?? 50}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span>Elevated Risk Band</span>
                  <span className="font-mono font-bold text-amber-600">
                    {policy?.elevated_threshold ?? 60} - 79
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span>2FA on Unknown Terminal</span>
                  <span className="font-bold text-emerald-700">Enforced</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span>Auto-Create Incident</span>
                  <span className="font-bold text-emerald-700">Enabled</span>
                </div>
              </div>
            </div>

            {/* Recent Audit Events Feed */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  Recent Governance Audit
                </h2>
                <Link
                  href="/admin/audit-logs"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Full Trail
                </Link>
              </div>

              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No recent audit logs.</p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                        <span>{log.action}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="font-medium text-slate-800 text-[11px] mt-0.5 truncate">
                        {log.actor_email || "System"} • {log.target_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
