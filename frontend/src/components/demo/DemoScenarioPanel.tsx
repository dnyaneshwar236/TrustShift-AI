"use client";

import React, { useState, useEffect } from "react";
import { Play, Sparkles, X, CheckCircle, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { api, DemoScenario } from "@/lib/api";

export function DemoScenarioPanel({
  isOpen,
  onClose,
  onScenarioExecuted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScenarioExecuted?: (result: any) => void;
}) {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadScenarios();
    }
  }, [isOpen]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const res = await api.getDemoScenarios();
      if (res.success) {
        setScenarios(res.data);
      }
    } catch (e) {
      console.error("Failed to load scenarios:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (scenarioId: string) => {
    try {
      setRunningId(scenarioId);
      const res = await api.runDemoScenario(scenarioId);
      if (res.success) {
        setLastResult(res.data);
        if (onScenarioExecuted) {
          onScenarioExecuted(res.data);
        }
      }
    } catch (err: any) {
      alert(`Scenario execution error: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Interactive Demo Scenarios</h3>
              <p className="text-xs text-slate-500">Live backend simulation engine (Scenarios A - G)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <b>DEMO ENVIRONMENT NOTICE:</b> Running these scenarios creates or modifies real rows in the persistent database, updates continuity scores, and generates real PDF reports.
            </div>
          </div>

          {lastResult && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Last Executed Outcome
                </span>
                <span className="text-xs font-bold text-slate-700">{lastResult.scenario}</span>
              </div>
              <p className="text-xs text-slate-800 font-medium">{lastResult.summary}</p>
              
              {lastResult.trust_score !== undefined && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/60 text-xs">
                  <div>
                    <span className="text-slate-500">Trust Score:</span>{" "}
                    <b className="text-slate-900">{lastResult.trust_score} / 100</b>
                  </div>
                  <div>
                    <span className="text-slate-500">Band:</span>{" "}
                    <b className="uppercase text-slate-900">{lastResult.score_band}</b>
                  </div>
                  <div>
                    <span className="text-slate-500">Action:</span>{" "}
                    <b className="text-indigo-700">{lastResult.recommended_action}</b>
                  </div>
                  {lastResult.incident_number && (
                    <div>
                      <span className="text-slate-500">Incident:</span>{" "}
                      <b className="text-rose-600">{lastResult.incident_number}</b>
                    </div>
                  )}
                </div>
              )}

              {lastResult.pdf_report_id && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.downloadReportPdf(lastResult.pdf_report_id, `Incident_Report_${lastResult.incident_id || 'demo'}.pdf`);
                    } catch (e: any) {
                      alert(`Download failed: ${e.message}`);
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-xs cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download Generated PDF Verification Report</span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Test Scenarios
            </h4>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading scenarios...</div>
            ) : (
              scenarios.map((sc) => {
                const isCurrent = runningId === sc.id;
                return (
                  <div
                    key={sc.id}
                    className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all bg-white hover:shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{sc.title}</span>
                        <span className="text-[11px] font-medium text-slate-500 block">{sc.tagline}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          sc.badge_color === "green"
                            ? "bg-emerald-100 text-emerald-800"
                            : sc.badge_color === "red"
                            ? "bg-rose-100 text-rose-800"
                            : sc.badge_color === "amber"
                            ? "bg-amber-100 text-amber-800"
                            : sc.badge_color === "purple"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {sc.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{sc.description}</p>

                    <button
                      onClick={() => handleRun(sc.id)}
                      disabled={isCurrent}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                    >
                      {isCurrent ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Running Scenario in Live DB...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Execute Scenario Now
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-white text-slate-700"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
