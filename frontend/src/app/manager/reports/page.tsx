"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api, IncidentReport } from "@/lib/api";
import {
  FileText,
  Download,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function ManagerReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.listAllReports();
      setReports(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (reportId: string, reportNumber: string) => {
    try {
      setDownloadingId(reportId);
      await api.downloadReportPdf(reportId, `${reportNumber}.pdf`);
    } catch (err: any) {
      alert(`Report download error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(
    (r) =>
      r.report_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.incident_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.rider_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" />
              Verification PDF Reports Archive
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Official forensic reports generated via ReportLab with cryptographic SHA-256 integrity hashes.
            </p>
          </div>
          <button
            onClick={fetchReports}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Report #, Incident # or Rider Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"} found
          </span>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Querying immutable report archives...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Reports Available</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Official PDF reports are automatically generated when critical continuity alerts occur or when generated manually from an incident dossier.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Report Number</th>
                    <th className="py-3 px-4">Linked Incident</th>
                    <th className="py-3 px-4">Subject Personnel</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Generated At</th>
                    <th className="py-3 px-4">SHA-256 Digest</th>
                    <th className="py-3 px-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-indigo-600">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          {r.report_number}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        <Link
                          href={`/manager/incidents/${r.incident_id}`}
                          className="hover:text-indigo-600 flex items-center gap-1"
                        >
                          {r.incident_number || "INCIDENT"}
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{r.rider_name || "Assigned Rider"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.rider_code || "RIDER"}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                          V{r.report_version}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(r.generated_at).toLocaleDateString()}{" "}
                        <span className="text-slate-400">
                          {new Date(r.generated_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          title={r.cryptographic_hash}
                          className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm block max-w-[120px] truncate"
                        >
                          {r.cryptographic_hash?.substring(0, 16)}...
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(r.id, r.report_number)}
                          disabled={downloadingId === r.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md transition-colors shadow-xs cursor-pointer"
                        >
                          {downloadingId === r.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{downloadingId === r.id ? "Saving..." : "Download PDF"}</span>
                        </button>
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
