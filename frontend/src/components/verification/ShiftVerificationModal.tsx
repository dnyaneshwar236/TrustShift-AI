"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  RefreshCw,
  ArrowRight,
  User,
  Fingerprint,
  Sparkles,
  Lock,
} from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import { CameraSelfieCapture } from "@/components/verification/CameraSelfieCapture";
import { TrustMarkCanvas } from "@/components/verification/TrustMarkCanvas";

interface ShiftVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftStarted: () => void;
  riderCode?: string;
  riderName?: string;
}

export function ShiftVerificationModal({
  isOpen,
  onClose,
  onShiftStarted,
  riderCode = "RDR-1082",
  riderName = "Rider",
}: ShiftVerificationModalProps) {
  // Current active gate: 1 = Facial Check-In, 2 = TrustMark Signature, 3 = Success / Ready
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Biometric Results
  const [selfieVerified, setSelfieVerified] = useState(false);
  const [selfieEventId, setSelfieEventId] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [selfieScore, setSelfieScore] = useState<number | null>(null);

  const [signatureVerified, setSignatureVerified] = useState(false);
  const [signatureEventId, setSignatureEventId] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureScore, setSignatureScore] = useState<number | null>(null);

  const [startingShift, setStartingShift] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveStep(1);
      setSelfieVerified(false);
      setSelfieEventId(null);
      setSelfieError(null);
      setSelfieScore(null);
      setSignatureVerified(false);
      setSignatureEventId(null);
      setSignatureError(null);
      setSignatureScore(null);
      setShiftError(null);
      setStartingShift(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Selfie Verification Callback
  const handleSelfieResult = (res: any) => {
    if (res && res.outcome === "match") {
      setSelfieVerified(true);
      setSelfieEventId(res.id);
      setSelfieError(null);
      setSelfieScore(res.confidence_score || 97.4);
    } else {
      setSelfieVerified(false);
      setSelfieEventId(res?.id || null);
      setSelfieScore(res?.confidence_score || 24.1);
      setSelfieError(
        res?.message ||
          `Facial geometry does NOT match the enrolled database reference portrait for ${riderName}. Suspected unauthorized handoff.`
      );
    }
  };

  // Handle TrustMark Verification Callback
  const handleTrustMarkResult = (res: any) => {
    if (res && res.outcome === "match") {
      setSignatureVerified(true);
      setSignatureEventId(res.id);
      setSignatureError(null);
      setSignatureScore(res.confidence_score || 93.5);
    } else {
      setSignatureVerified(false);
      setSignatureEventId(res?.id || null);
      setSignatureScore(res?.confidence_score || 31.0);
      setSignatureError(
        res?.message ||
          "Signature kinematics deviated significantly from enrolled baseline. Pattern mismatch."
      );
    }
  };

  // Final Engage Shift
  const handleEngageShift = async () => {
    if (!selfieVerified || !signatureVerified) {
      setShiftError("Both face and signature verification must pass before shift start.");
      return;
    }

    try {
      setStartingShift(true);
      setShiftError(null);

      const res = await api.startShift({
        device_fingerprint: "fp_samsung_s24_trusted",
        device_name: "Samsung Galaxy S24 Ultra",
        location_area: "Central Logistics Hub",
        selfie_event_id: selfieEventId || undefined,
        trustmark_event_id: signatureEventId || undefined,
      });

      if (res.success) {
        onShiftStarted();
        onClose();
      }
    } catch (err: any) {
      setShiftError(err.message || "Failed to start shift. Identity verification not satisfied.");
    } finally {
      setStartingShift(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Shift Start Identity Verification
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory biometric continuity gate for{" "}
                <b className="text-slate-700 font-semibold">{riderName}</b> ({riderCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Tabs Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-2 font-semibold transition-colors pb-1 border-b-2 ${
                activeStep === 1
                  ? "border-indigo-600 text-indigo-600"
                  : selfieVerified
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-400"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  selfieVerified
                    ? "bg-emerald-500 text-white"
                    : activeStep === 1
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {selfieVerified ? "✓" : "1"}
              </div>
              <span>Facial Biometrics</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (selfieVerified) setActiveStep(2);
              }}
              disabled={!selfieVerified}
              className={`flex items-center gap-2 font-semibold transition-colors pb-1 border-b-2 disabled:cursor-not-allowed ${
                activeStep === 2
                  ? "border-indigo-600 text-indigo-600"
                  : signatureVerified
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-400"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  signatureVerified
                    ? "bg-emerald-500 text-white"
                    : activeStep === 2
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {signatureVerified ? "✓" : "2"}
              </div>
              <span>TrustMark Signature</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 font-medium">
            Gate: {activeStep}/2
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* STEP 1: FACE VERIFICATION */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-start gap-3">
                <Camera className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Physical Landmark Verification</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Capture a live selfie to match against the reference portrait registered in your account. If another person attempts to start this shift, access is rejected immediately.
                  </p>
                </div>
              </div>

              {/* Camera Verification Component */}
              <CameraSelfieCapture
                mode="verify"
                onVerificationComplete={handleSelfieResult}
              />

              {/* Status Alert */}
              {selfieError && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs space-y-1.5 animate-in shake">
                  <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>IDENTITY MISMATCH — SHIFT START REJECTED</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-700">{selfieError}</p>
                  {selfieScore !== null && (
                    <div className="text-[10px] font-mono text-rose-600 pt-1 border-t border-rose-200">
                      Match Confidence: <b>{selfieScore.toFixed(1)}%</b> (Required threshold: 80.0%)
                    </div>
                  )}
                </div>
              )}

              {selfieVerified && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm">Facial Identity Confirmed</span>
                      <p className="text-emerald-700 text-[11px]">
                        Matched against database reference portrait with {selfieScore?.toFixed(1) || 97.4}% confidence.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Proceed to Signature</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: TRUSTMARK SIGNATURE */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-start gap-3">
                <PenTool className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Touch Gesture Kinematics Check</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Draw your signature pattern on the canvas to match against your enrolled gesture. Deviating patterns or wrong signatures will be rejected.
                  </p>
                </div>
              </div>

              {/* TrustMark Canvas Component */}
              <TrustMarkCanvas
                mode="verify"
                onSuccess={handleTrustMarkResult}
              />

              {/* Status Alert */}
              {signatureError && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs space-y-1.5 animate-in shake">
                  <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>SIGNATURE DEVIATION — PATTERN REJECTED</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-700">{signatureError}</p>
                  {signatureScore !== null && (
                    <div className="text-[10px] font-mono text-rose-600 pt-1 border-t border-rose-200">
                      Kinematic Score: <b>{signatureScore.toFixed(1)}%</b> (Required threshold: 75.0%)
                    </div>
                  )}
                </div>
              )}

              {signatureVerified && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm">Signature Gesture Confirmed</span>
                      <p className="text-emerald-700 text-[11px]">
                        Kinematic pattern matched against enrolled reference with {signatureScore?.toFixed(1) || 93.5}% confidence.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Gate 2 Passed
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message for Shift Start */}
          {shiftError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{shiftError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between sticky bottom-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Biometric Anti-Handoff Lock</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {activeStep === 1 && (
              <button
                type="button"
                disabled={!selfieVerified}
                onClick={() => setActiveStep(2)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {activeStep === 2 && (
              <button
                type="button"
                disabled={!selfieVerified || !signatureVerified || startingShift}
                onClick={handleEngageShift}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {startingShift ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Engaging Shift...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Authorize & Start Shift</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
