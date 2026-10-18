"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  VideoOff,
  Info,
  Sun,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Database,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";

interface CameraSelfieCaptureProps {
  onVerificationComplete?: (result: any, imageB64?: string) => void;
  onCapture?: (imageB64: string) => void;
  mode?: "enroll" | "verify";
  sessionId?: string;
  riderId?: string;
  enrolledReferenceImage?: string;
}

export function CameraSelfieCapture({
  onVerificationComplete,
  onCapture,
  mode = "verify",
  sessionId,
  riderId,
  enrolledReferenceImage,
}: CameraSelfieCaptureProps) {
  const [currentMode, setCurrentMode] = useState<"enroll" | "verify">(mode);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [simulationPreset, setSimulationPreset] = useState<string>("match");

  // Enrolled Reference State from database
  const [dbReference, setDbReference] = useState<{
    selfie_enrolled: boolean;
    selfie_reference_id?: string;
    selfie_image_data?: string;
  } | null>(null);
  const [loadingRef, setLoadingRef] = useState(false);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Load enrolled reference from database if in verify mode
  useEffect(() => {
    let isMounted = true;
    const fetchDbReference = async () => {
      if (enrolledReferenceImage) {
        setDbReference({
          selfie_enrolled: true,
          selfie_reference_id: "ENROLLED-REF",
          selfie_image_data: enrolledReferenceImage,
        });
        return;
      }
      try {
        setLoadingRef(true);
        const res = await api.getEnrolledBiometricReference();
        if (isMounted && res.success && res.data) {
          setDbReference({
            selfie_enrolled: res.data.selfie_enrolled,
            selfie_reference_id: res.data.selfie_reference_id,
            selfie_image_data: res.data.selfie_image_data,
          });
        }
      } catch (e) {
        // If unauthenticated or no rider profile, continue gracefully
      } finally {
        if (isMounted) setLoadingRef(false);
      }
    };

    fetchDbReference();
    return () => {
      isMounted = false;
    };
  }, [enrolledReferenceImage, currentMode]);

  // Start webcam
  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(
        "Camera access denied or hardware unavailable. You can still test using synthetic image presets below."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = () => {
    let dataUrl = "";
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      }
    }
    if (!dataUrl) {
      // High-resolution SVG preview for simulation when hardware camera is disabled
      dataUrl =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 240' width='300' height='240'><rect width='300' height='240' rx='16' fill='%230f172a'/><circle cx='150' cy='95' r='55' fill='%23fde047'/><circle cx='132' cy='90' r='6' fill='%230f172a'/><circle cx='168' cy='90' r='6' fill='%230f172a'/><path d='M138 115 q12 12 24 0' stroke='%23d97706' stroke-width='3' fill='none'/><path d='M80 220 c0-45 35-65 70-65 s70 20 70 65' fill='%234f46e5'/><rect x='85' y='180' width='130' height='22' rx='6' fill='%23312e81'/><text x='150' y='195' text-anchor='middle' fill='%23ffffff' font-size='11' font-weight='bold' font-family='sans-serif'>LIVE BIOMETRIC CAPTURE</text></svg>";
    }
    setCapturedImage(dataUrl);
    if (onCapture) onCapture(dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResult(null);
  };

  const handleSubmitVerification = async () => {
    try {
      setVerifying(true);
      setResult(null);

      if (currentMode === "enroll") {
        const res = await api.enrollSelfie({
          rider_id: riderId,
          image_b64: capturedImage || undefined,
          simulation_preset: simulationPreset,
        });
        setResult(res.data);
        // Refresh local reference state
        setDbReference({
          selfie_enrolled: true,
          selfie_reference_id: res.data?.provider_reference || "NEW-REF",
          selfie_image_data: capturedImage || undefined,
        });
        if (onVerificationComplete) onVerificationComplete(res.data, capturedImage || undefined);
      } else {
        const res = await api.verifySelfie({
          session_id: sessionId,
          image_b64: capturedImage || undefined,
          simulation_preset: simulationPreset,
        });
        setResult(res.data);
        if (onVerificationComplete) onVerificationComplete(res.data, capturedImage || undefined);
      }
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const hasReference = Boolean(dbReference?.selfie_enrolled || dbReference?.selfie_image_data);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="h-4 w-4 text-indigo-600" />
            {currentMode === "enroll"
              ? "Enroll Reference Portrait (Saved in Database)"
              : "Shift Check-in Biometric Face Match"}
          </h3>
          <p className="text-xs text-slate-500">
            {currentMode === "enroll"
              ? "Saved to database to serve as the ground-truth biometric template for all future shifts"
              : "Live camera capture is compared against your enrolled database portrait"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Biometric Engine</span>
        </div>
      </div>

      {/* Database Reference Status Banner (In verify mode) */}
      {currentMode === "verify" && (
        <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              Database Enrolled Reference Face
            </span>
            {hasReference ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                Active in Database
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="h-3 w-3" />
                No Reference Saved
              </span>
            )}
          </div>

          {hasReference ? (
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="w-14 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                {dbReference?.selfie_image_data ? (
                  <img
                    src={dbReference.selfie_image_data}
                    alt="Enrolled Reference"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold text-xs">
                    REF
                  </div>
                )}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-slate-900">
                  Ground Truth Reference Template
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Ref ID: {dbReference?.selfie_reference_id || "SIM-FACE-REF-PRIMARY"}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  ✓ Available for shift biometric matching
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-800 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 space-y-2">
              <p>
                No reference face was found in the database. You should enroll your reference portrait first so shift sign-in can match your identity.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCurrentMode("enroll");
                  setCapturedImage(null);
                  setResult(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                Switch to Enroll Reference Mode
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preset simulation selector */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-indigo-600" />
            Simulated Biometric Matcher Evaluation
          </label>
          <span className="text-[10px] text-slate-400">Anti-Spoofing Active</span>
        </div>
        <select
          value={simulationPreset}
          onChange={(e) => setSimulationPreset(e.target.value)}
          className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <option value="match">Match (High Confidence 97.4%) — Legitimate Enrolled Rider</option>
          <option value="no_match">No Match (Mismatch 24.1%) — Suspected Handoff / Different Person</option>
          <option value="uncertain">Uncertain / Borderline (62.0%) — Retest Advised</option>
          <option value="quality_failure">Quality Failure (Poor Lighting / Blur)</option>
          <option value="liveness_failure">Liveness Failure (Anti-Spoofing Motion Loss)</option>
          <option value="provider_unavailable">Provider Unavailable (Service Outage)</option>
        </select>
      </div>

      {/* Camera Viewport or Side-by-Side Match Preview */}
      <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-300">
        {!capturedImage ? (
          <>
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-3">
                <VideoOff className="h-10 w-10 mx-auto text-slate-500" />
                <p className="text-xs leading-relaxed max-w-xs mx-auto">
                  {cameraError || "Camera initializing..."}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Retry Camera Initialization
                </button>
              </div>
            )}

            {/* Oval Face Guide Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-72 border-2 border-dashed border-white/60 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                    Position your face within the frame
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full h-full bg-slate-900">
            {currentMode === "verify" && hasReference ? (
              /* Side-by-Side Matching View: Enrolled vs Live */
              <div className="grid grid-cols-2 h-full w-full divide-x divide-slate-800">
                <div className="relative flex flex-col items-center justify-center p-3 bg-slate-950/70">
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-indigo-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-indigo-900">
                    Database Reference
                  </span>
                  {dbReference?.selfie_image_data ? (
                    <img
                      src={dbReference.selfie_image_data}
                      alt="Enrolled Template"
                      className="w-full h-44 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs">No reference image</div>
                  )}
                  <span className="text-[10px] font-mono text-slate-400 mt-2 truncate max-w-full">
                    {dbReference?.selfie_reference_id}
                  </span>
                </div>

                <div className="relative flex flex-col items-center justify-center p-3 bg-slate-950/70">
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-900">
                    Live Check-in Capture
                  </span>
                  <img
                    src={capturedImage}
                    alt="Live Capture"
                    className="w-full h-44 object-cover rounded-lg border border-slate-700"
                  />
                  <span className="text-[10px] text-emerald-400 font-bold mt-2">
                    Ready to compare
                  </span>
                </div>
              </div>
            ) : (
              <img
                src={capturedImage}
                alt="Captured preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Lighting & framing advice */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <Sun className="h-4 w-4 text-amber-500 shrink-0" />
        <span>Ensure your face is well-lit and centered. Avoid harsh shadows, dark glasses, or masks.</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {!capturedImage ? (
          <button
            type="button"
            onClick={handleCapture}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Camera className="h-4 w-4" />
            Capture Photo
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRetake}
              disabled={verifying}
              className="py-2.5 px-4 text-sm font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Retake Photo
            </button>
            <button
              type="button"
              onClick={handleSubmitVerification}
              disabled={verifying}
              className="flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {currentMode === "enroll"
                    ? "Saving Reference to Database..."
                    : "Comparing with Database Reference..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {currentMode === "enroll"
                    ? "Save Reference Portrait"
                    : "Match Against Enrolled Reference"}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
            result.outcome === "match"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : result.outcome === "no_match" || result.outcome === "liveness_failure"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {result.outcome === "match" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : result.outcome === "no_match" ? (
              <XCircle className="h-4 w-4 text-rose-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            <b className="uppercase tracking-wider">
              {currentMode === "enroll"
                ? "Enrollment Success: Saved in Database"
                : `Biometric Match Outcome: ${result.outcome.replace("_", " ")}`}
            </b>
          </div>

          <p className="leading-relaxed font-medium">{result.message}</p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/10 text-[11px]">
            <div>
              <span className="opacity-70">Confidence:</span>{" "}
              <b>{result.confidence_score ? `${result.confidence_score}%` : "N/A"}</b>
            </div>
            <div>
              <span className="opacity-70">Reason Code:</span> <b>{result.reason_code}</b>
            </div>
            <div>
              <span className="opacity-70">Recommended Action:</span>{" "}
              <b className="uppercase">{result.recommended_action}</b>
            </div>
            <div>
              <span className="opacity-70">Reference ID:</span>{" "}
              <span className="font-mono">{result.provider_reference}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
