"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  PenTool,
  RotateCcw,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Database,
  AlertTriangle,
  ArrowRight,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";

interface TrustMarkCanvasProps {
  mode?: "enroll" | "verify";
  sessionId?: string;
  riderId?: string;
  onSuccess?: (res: any, strokeJson?: string) => void;
  enrolledReferencePattern?: string;
}

interface Point {
  x: number;
  y: number;
}

export function TrustMarkCanvas({
  mode = "verify",
  sessionId,
  riderId,
  onSuccess,
  enrolledReferencePattern,
}: TrustMarkCanvasProps) {
  const [currentMode, setCurrentMode] = useState<"enroll" | "verify">(mode);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [simulationPreset, setSimulationPreset] = useState("match");

  // Database enrolled pattern state
  const [dbReference, setDbReference] = useState<{
    trustmark_enrolled: boolean;
    trustmark_reference_id?: string;
    trustmark_signature_data?: string;
  } | null>(null);
  const [loadingRef, setLoadingRef] = useState(false);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Load enrolled pattern from database if in verify mode
  useEffect(() => {
    let isMounted = true;
    const fetchDbReference = async () => {
      if (enrolledReferencePattern) {
        setDbReference({
          trustmark_enrolled: true,
          trustmark_reference_id: "ENROLLED-SIGN-REF",
          trustmark_signature_data: enrolledReferencePattern,
        });
        return;
      }
      try {
        setLoadingRef(true);
        const res = await api.getEnrolledBiometricReference();
        if (isMounted && res.success && res.data) {
          setDbReference({
            trustmark_enrolled: res.data.trustmark_enrolled,
            trustmark_reference_id: res.data.trustmark_reference_id,
            trustmark_signature_data: res.data.trustmark_signature_data,
          });
        }
      } catch (e) {
        // gracefully handle unauthenticated
      } finally {
        if (isMounted) setLoadingRef(false);
      }
    };

    fetchDbReference();
    return () => {
      isMounted = false;
    };
  }, [enrolledReferencePattern, currentMode]);

  // Draw enrolled reference pattern on preview canvas
  useEffect(() => {
    const rawPattern = dbReference?.trustmark_signature_data;
    if (!rawPattern || !previewCanvasRef.current) return;

    try {
      const parsedStrokes: Point[][] = JSON.parse(rawPattern);
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#4F46E5"; // Indigo
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const stroke of parsedStrokes) {
        if (stroke.length === 0) continue;
        ctx.beginPath();
        // Scale stroke coordinates to fit preview canvas (width: 240, height: 90)
        ctx.moveTo(stroke[0].x * 0.48, stroke[0].y * 0.45);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x * 0.48, stroke[i].y * 0.45);
        }
        ctx.stroke();
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [dbReference]);

  const redrawCanvas = (allStrokes: Point[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Baseline guide line
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.7);
    ctx.lineTo(canvas.width, canvas.height * 0.7);
    ctx.stroke();

    // Style the pen strokes
    ctx.strokeStyle = "#1E1B4B"; // Deep navy
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of allStrokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    redrawCanvas(strokes);
  }, [strokes]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pt = getCoordinates(e);
    if (!pt) return;
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    const newStroke = [...currentStroke, pt];
    setCurrentStroke(newStroke);
    redrawCanvas([...strokes, newStroke]);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setResult(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setResult(null);
  };

  const handleSubmit = async () => {
    let effectiveStrokes = strokes;
    if (effectiveStrokes.length === 0) {
      if (hasReference && dbReference?.trustmark_signature_data) {
        try {
          const parsed = JSON.parse(dbReference.trustmark_signature_data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            effectiveStrokes = parsed;
            setStrokes(parsed);
            redrawCanvas(parsed);
          }
        } catch (e) {
          // fallback
        }
      }
    }

    if (effectiveStrokes.length === 0) {
      // Default sample smooth gesture curve
      const sampleStrokes: Point[][] = [
        [{ x: 60, y: 120 }, { x: 100, y: 80 }, { x: 140, y: 130 }, { x: 220, y: 70 }, { x: 280, y: 110 }]
      ];
      effectiveStrokes = sampleStrokes;
      setStrokes(sampleStrokes);
      redrawCanvas(sampleStrokes);
    }

    try {
      setVerifying(true);
      setResult(null);
      const strokeJson = JSON.stringify(effectiveStrokes);

      if (currentMode === "enroll") {
        const res = await api.enrollTrustMark({
          rider_id: riderId,
          stroke_data: strokeJson,
          simulation_preset: simulationPreset,
        });
        setResult(res.data);
        setDbReference({
          trustmark_enrolled: true,
          trustmark_reference_id: res.data?.provider_reference || "NEW-SIGN-REF",
          trustmark_signature_data: strokeJson,
        });
        if (onSuccess) onSuccess(res.data, strokeJson);
      } else {
        const res = await api.verifyTrustMark({
          session_id: sessionId,
          stroke_data: strokeJson,
          simulation_preset: simulationPreset,
        });
        setResult(res.data);
        if (onSuccess) onSuccess(res.data, strokeJson);
      }
    } catch (err: any) {
      alert(`TrustMark error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const hasReference = Boolean(
    dbReference?.trustmark_enrolled || dbReference?.trustmark_signature_data
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PenTool className="h-4 w-4 text-indigo-600" />
            {currentMode === "enroll"
              ? "Enroll TrustMark Signature Pattern (Saved in Database)"
              : "Verify TrustMark Signature Pattern"}
          </h3>
          <p className="text-xs text-slate-500">
            {currentMode === "enroll"
              ? "Your unique touch pattern is saved into database as reference for shift continuity checks"
              : "Draw your gesture pattern to compare against your enrolled database signature"}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Biometric Signal
        </span>
      </div>

      {/* Database Reference Status Banner (In verify mode) */}
      {currentMode === "verify" && (
        <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              Database Enrolled Reference Pattern
            </span>
            {hasReference ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                Active in Database
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="h-3 w-3" />
                No Signature Saved
              </span>
            )}
          </div>

          {hasReference ? (
            <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-slate-200">
              <div className="space-y-0.5 text-xs">
                <div className="font-semibold text-slate-900">Enrolled Gesture Baseline</div>
                <div className="text-[11px] font-mono text-slate-500">
                  Ref ID: {dbReference?.trustmark_reference_id || "SIM-SIGN-REF-PRIMARY"}
                </div>
                <div className="text-[10px] text-indigo-600 font-medium">
                  Draw the matching pattern below to confirm identity continuity
                </div>
              </div>
              <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-1 shrink-0">
                <canvas
                  ref={previewCanvasRef}
                  width={140}
                  height={50}
                  className="w-32 h-12 block"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-800 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 space-y-2">
              <p>
                No signature pattern found in database. Enroll your reference signature pattern first to enable pattern matching.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCurrentMode("enroll");
                  handleClear();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-xs"
              >
                <PenTool className="h-3.5 w-3.5" />
                Switch to Enroll Signature Mode
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preset simulation selector */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
        <label className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          Pattern Dynamics Matcher Mode
        </label>
        <select
          value={simulationPreset}
          onChange={(e) => setSimulationPreset(e.target.value)}
          className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <option value="match">Match (Consistent Stroke Dynamics 94%) — Verified Enrolled Rider</option>
          <option value="no_match">No Match (Deviation / Altered Pattern 31%) — Suspected Alternate Person</option>
          <option value="uncertain">Uncertain / Shaky Pattern (65%) — Margin of Error Retest</option>
        </select>
      </div>

      {/* Canvas Area */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-48 cursor-crosshair block"
        />

        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs">
            {currentMode === "enroll"
              ? "Draw your baseline signature pattern here..."
              : "Re-draw your enrolled signature pattern here to match..."}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0 || verifying}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0 || verifying}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
          {hasReference && (
            <button
              type="button"
              onClick={() => {
                if (!dbReference?.trustmark_signature_data) return;
                try {
                  const parsed = JSON.parse(dbReference.trustmark_signature_data);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setStrokes(parsed);
                    redrawCanvas(parsed);
                  }
                } catch (e) {}
              }}
              className="flex items-center gap-1 px-3 py-1.5 border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Use Enrolled Gesture</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={verifying}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {verifying ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {currentMode === "enroll"
                ? "Saving Pattern to Database..."
                : "Matching Signature Dynamics..."}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {currentMode === "enroll"
                ? "Save Enrolled Signature"
                : "Match Signature Pattern"}
            </>
          )}
        </button>
      </div>

      {/* Result Card */}
      {result && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-150 ${
            result.outcome === "match"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            {result.outcome === "match" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            )}
            <span>
              {currentMode === "enroll"
                ? "SIGNATURE ENROLLED & PERSISTED IN DATABASE"
                : `PATTERN MATCH OUTCOME: ${result.outcome.toUpperCase()}`}
            </span>
          </div>
          <p>{result.message}</p>
          {result.confidence_score && (
            <div className="text-[11px] font-mono text-slate-600 pt-1">
              Stroke Pattern Consistency: <b>{result.confidence_score}%</b> • Ref: {result.provider_reference}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
