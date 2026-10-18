"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RotateCcw,
  RefreshCw,
  Info,
} from "lucide-react";

export default function ManagerAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-indigo-600" />
              Security Analytics & Fairness Oversight
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Statistical continuity metrics, false-alert ratios, and model calibration oversight.
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Fairness Banner */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 leading-relaxed">
            <span className="font-bold">Algorithmic Fairness Notice:</span> TrustShift AI continuity scores evaluate physical terminal transitions and biometric match confidence. A suspicious deviation score is <span className="font-semibold underline">not proof of fraud</span>. Human manager review and progressive step-up challenges are required prior to any account restriction.
          </div>
        </div>

        {/* 4 KPI Metrics */}
        {data?.metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">False Alert Ratio</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {data.metrics.false_alert_rate}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">Within target (&lt; 10%)</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Account Recovery Rate</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {data.metrics.recovery_rate}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Legitimate recovery success</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Avg Resolution Time</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {data.metrics.avg_resolution_time}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">From trigger to review</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Step-Up Rate</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {data.metrics.verifications_per_100_shifts}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Challenges per 100 shifts</p>
            </div>
          </div>
        )}

        {/* Charts Row 1: Trend Area & Severity Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              7-Day Incident & Verification Volume Trend
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Daily trend of continuity triggers vs proactive step-up verifications
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.incident_trend || []}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="verifications"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVerif)"
                    name="Verifications"
                  />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInc)"
                    name="Incidents"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Incident Severity Distribution
              </h2>
              <p className="text-[11px] text-slate-400 mb-2">Proportion of triggered alerts</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.severity_breakdown || []}
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.severity_breakdown || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || "#4F46E5"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
              {(data?.severity_breakdown || []).map((s: any) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                  <span className="text-slate-600 font-medium">
                    {s.name}: <strong className="text-slate-900">{s.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Score Distribution Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Active Fleet Identity Trust Score Distribution
          </h2>
          <p className="text-[11px] text-slate-400 mb-4">
            Categorization of current active shift personnel across continuity score bands
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.score_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="band" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(data?.score_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
