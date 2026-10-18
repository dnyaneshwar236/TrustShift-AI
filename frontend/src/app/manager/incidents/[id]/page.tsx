"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api, IncidentDetail, IncidentReport } from "@/lib/api";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import {
  ShieldAlert,
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building,
  Key,
  ShieldCheck,
  RefreshCw,
  Send,
  Lock,
  Camera,
  ExternalLink,
} from "lucide-react";

function IncidentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params?.id as string;

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Form state
  const [reviewOutcome, setReviewOutcome] = useState("resolved");
  const [actionTaken, setActionTaken] = useState("verified_identity");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Reverification modal / trigger
  const [showReverifyModal, setShowReverifyModal] = useState(false);
  const [reverifyType, setReverifyType] = useState("selfie");
  const [reverifyReason, setReverifyReason] = useState("Security continuity verification required");
  const [submittingReverify, setSubmittingReverify] = useState(false);

  // PDF report state
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async (reportId: string, reportNumber: string) => {
    try {
      setDownloadingPdf(true);
      await api.downloadReportPdf(reportId, `${reportNumber}.pdf`);
    } catch (err: any) {
      alert(`Report download error: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchIncident = async () => {
    if (!incidentId) return;
    setLoading(true);
    try {
      const res = await api.getIncidentDetails(incidentId);
      setIncident(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load incident details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      alert("Please enter investigation notes before submitting.");
      return;
    }

    setSubmittingReview(true);
    setReviewSuccessMsg(null);
    try {
      await api.reviewIncident(incidentId, {
        outcome: reviewOutcome,
        notes: reviewNotes,
        action_taken: actionTaken,
      });
      setReviewSuccessMsg("Investigation outcome and notes recorded successfully.");
      setReviewNotes("");
      await fetchIncident();
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReverifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReverify(true);
    try {
      await api.requestReverification(incidentId, {
        verification_type: reverifyType,
        reason: reverifyReason,
        urgency: "high",
      });
      setShowReverifyModal(false);
      alert(`Verification request for ${reverifyType.toUpperCase()} dispatched to rider.`);
      await fetchIncident();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch verification request");
    } finally {
      setSubmittingReverify(false);
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingReport(true);
    try {
      await api.generateIncidentReport(incidentId, true);
      alert("Fresh PDF Verification Report generated.");
      await fetchIncident();
    } catch (err: any) {
      alert(err.message || "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <AppShell allowedRoles={["manager", "admin"]}>
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading incident forensic dossier...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !incident) {
    return (
      <AppShell allowedRoles={["manager", "admin"]}>
        <div className="p-8 text-center bg-white rounded-xl border border-red-200">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-900">Incident Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{error || "The requested incident record does not exist or you do not have permission to view it."}</p>
          <Link
            href="/manager/incidents"
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Incidents
          </Link>
        </div>
      </AppShell>
    );
  }

  const latestReport = incident.reports && incident.reports.length > 0 ? incident.reports[0] : null;

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/manager/incidents"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Incidents Queue
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReverifyModal(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              Request Re-Verification
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={generatingReport}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generatingReport ? "animate-spin" : ""}`} />
              {latestReport ? "Regenerate PDF Report" : "Generate Official PDF"}
            </button>
          </div>
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                  {incident.incident_number}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    incident.severity === "critical"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : incident.severity === "high"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {incident.severity} SEVERITY
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    incident.status === "open"
                      ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                      : incident.status === "resolved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {incident.status.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-2">{incident.title}</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">{incident.description}</p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Score at Detection</div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                  {incident.risk_score_at_detection}/100
                </div>
              </div>
              <TrustScoreBadge
                score={incident.risk_score_at_detection}
                band={
                  incident.risk_score_at_detection >= 80
                    ? "high_trust"
                    : incident.risk_score_at_detection >= 60
                    ? "caution"
                    : incident.risk_score_at_detection >= 50
                    ? "elevated_risk"
                    : "critical"
                }
                size="md"
              />
            </div>
          </div>

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Rider Subject
              </div>
              <div className="font-semibold text-slate-900 mt-1">{incident.rider_name}</div>
              <div className="font-mono text-[11px] text-slate-500">{incident.rider_code}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> Branch Scope
              </div>
              <div className="font-semibold text-slate-900 mt-1">
                {incident.branch_name || "Central Logistics Hub"}
              </div>
              <div className="text-[11px] text-slate-500">Zone Operations</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Detected Timestamp
              </div>
              <div className="font-semibold text-slate-900 mt-1">
                {new Date(incident.created_at).toLocaleDateString()}
              </div>
              <div className="text-[11px] text-slate-500">
                {new Date(incident.created_at).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Assigned Investigator
              </div>
              <div className="font-semibold text-slate-900 mt-1">
                {incident.assigned_manager_name || "Unassigned"}
              </div>
              <div className="text-[11px] text-slate-500">Operations Lead</div>
            </div>
          </div>
        </div>

        {/* 2-Column Forensic Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Forensic Evidence Timeline & Reason Codes (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reason Codes Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Continuity Engine Trigger Codes
              </h2>
              <div className="flex flex-wrap gap-2">
                {incident.reason_codes.map((rc) => (
                  <span
                    key={rc}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs rounded-md font-semibold"
                  >
                    {rc}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3 italic">
                Note: Engine triggers indicate structural deviations in physical biometric landmarks, session IP shifts, or behavioral telemetry. A single trigger is not conclusive proof of fraud.
              </p>
            </div>

            {/* Evidence Events Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                Forensic Evidence Timeline
              </h2>

              {incident.evidences.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No discrete evidence items logged for this incident yet.
                </p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {incident.evidences.map((ev) => (
                    <div key={ev.id} className="relative group">
                      <div
                        className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          ev.severity === "critical"
                            ? "border-red-500 text-red-500"
                            : ev.severity === "high"
                            ? "border-amber-500 text-amber-500"
                            : "border-indigo-500 text-indigo-500"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-900 capitalize">
                            {ev.evidence_type.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(ev.occurred_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">{ev.summary}</p>
                        {ev.event_reference && (
                          <div className="mt-2 text-[10px] font-mono text-slate-400">
                            Ref: {ev.event_reference}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manager Review History */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Manager Investigation Records
              </h2>

              {incident.reviews.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                  No manager reviews recorded yet. Use the review form on the right to document your findings.
                </div>
              ) : (
                <div className="space-y-3">
                  {incident.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          {rev.reviewer_name}
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-[10px] rounded-xs uppercase">
                          Outcome: {rev.outcome}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-xs uppercase font-medium">
                          Action: {rev.action_taken}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2.5 whitespace-pre-line bg-slate-50 p-2.5 rounded-md border border-slate-100">
                        "{rev.notes}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions, PDF Report, Review Form (1 Col) */}
          <div className="space-y-6">
            {/* PDF Report Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Official PDF Report
                </div>
                {latestReport && (
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    V{latestReport.report_version}
                  </span>
                )}
              </div>

              {latestReport ? (
                <div className="mt-3 space-y-3">
                  <div className="text-xs text-slate-600">
                    Cryptographically hashed verification dossier generated on{" "}
                    <span className="font-semibold text-slate-900">
                      {new Date(latestReport.generated_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100 text-[10px] font-mono text-slate-500 break-all">
                    <span className="text-indigo-600 font-bold block mb-0.5">SHA-256 INTEGRITY HASH:</span>
                    {latestReport.cryptographic_hash}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(latestReport.id, latestReport.report_number)}
                    disabled={downloadingPdf}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    {downloadingPdf ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadingPdf ? "Saving PDF..." : "Download PDF Report"}</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 text-center py-4">
                  <p className="text-xs text-slate-500 mb-3">No PDF report generated yet.</p>
                  <button
                    onClick={handleGeneratePdf}
                    disabled={generatingReport}
                    className="w-full py-2 px-3 text-xs font-bold text-indigo-700 bg-white border border-indigo-300 hover:bg-indigo-50 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    Generate PDF Report
                  </button>
                </div>
              )}
            </div>

            {/* Manager Decision & Review Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                Record Manager Decision
              </h2>

              {reviewSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {reviewSuccessMsg}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Investigation Outcome
                  </label>
                  <select
                    value={reviewOutcome}
                    onChange={(e) => setReviewOutcome(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="resolved">Resolved - Legitimate Rider (False Alarm)</option>
                    <option value="under_review">Under Review - Pending Interview</option>
                    <option value="escalated">Escalated to Branch Security Admin</option>
                    <option value="false_alert">Confirmed False Alert - Noise</option>
                    <option value="closed_confirmed_handoff">Closed - Confirmed Account Handoff / Rental</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Action Taken
                  </label>
                  <select
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="verified_identity">Verified Identity & Cleared Flag</option>
                    <option value="requested_step_up">Requested Immediate Step-Up Biometric</option>
                    <option value="temporary_restriction">Applied Temporary Account Restriction</option>
                    <option value="warning_issued">Formal Compliance Warning Issued</option>
                    <option value="no_action">No Action Necessary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Investigation Notes & Justification
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Document interview findings, physical check results, and rationale for decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? "Recording Review..." : "Submit Review Decision"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Reverification Modal */}
        {showReverifyModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  Request Rider Re-Verification
                </h3>
                <button
                  onClick={() => setShowReverifyModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500">
                This will trigger an in-app challenge prompt on the rider's active terminal requiring immediate identity confirmation.
              </p>

              <form onSubmit={handleReverifySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verification Method
                  </label>
                  <select
                    value={reverifyType}
                    onChange={(e) => setReverifyType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
                  >
                    <option value="selfie">Facial Biometric & Liveness Check</option>
                    <option value="trustmark">TrustMark Drawn Signature Check</option>
                    <option value="second_factor">SMS/Email OTP Step-Up Challenge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason Message
                  </label>
                  <input
                    type="text"
                    value={reverifyReason}
                    onChange={(e) => setReverifyReason(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReverifyModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReverify}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    {submittingReverify ? "Dispatching..." : "Dispatch Challenge"}
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

export default function IncidentDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <IncidentDetailContent />
    </React.Suspense>
  );
}
