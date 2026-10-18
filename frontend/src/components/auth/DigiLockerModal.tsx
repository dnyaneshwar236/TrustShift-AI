"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  Smartphone,
  IdCard,
  Building2,
  ArrowRight,
  Fingerprint,
} from "lucide-react";
import { api, setStoredToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "login" | "pull_credentials";
  onCredentialsFetched?: (creds: any) => void;
  redirectPath?: string;
}

export function DigiLockerModal({
  isOpen,
  onClose,
  mode = "login",
  onCredentialsFetched,
  redirectPath = "/rider/dashboard",
}: DigiLockerModalProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [selectedPreset, setSelectedPreset] = useState<string>("alex");
  const [mobileNumber, setMobileNumber] = useState<string>("+1-555-0101");
  const [aadhaarLastFour, setAadhaarLastFour] = useState<string>("4829");
  const [otpCode, setOtpCode] = useState<string>("123456");
  const [consent, setConsent] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"auth" | "success">("auth");

  if (!isOpen) return null;

  const presets = [
    {
      id: "alex",
      name: "Alex Rivera",
      riderCode: "TS-RIDER-101",
      phone: "+1-555-0101",
      aadhaar: "4829",
      email: "rider.alex@trustshift.ai",
      status: "High Trust (94%)",
    },
    {
      id: "devon",
      name: "Devon Vance",
      riderCode: "TS-RIDER-102",
      phone: "+1-555-0102",
      aadhaar: "9402",
      email: "rider.devon@trustshift.ai",
      status: "Caution Shift (58%)",
    },
    {
      id: "sam",
      name: "Sam Taylor",
      riderCode: "TS-RIDER-103",
      phone: "+1-555-0103",
      aadhaar: "6119",
      email: "rider.sam@trustshift.ai",
      status: "New Recruit (82%)",
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.id);
    setMobileNumber(p.phone);
    setAadhaarLastFour(p.aadhaar);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Please check the consent box to authorize DigiLocker authentication.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const targetPreset = presets.find((p) => p.id === selectedPreset);
        const identifier = targetPreset?.email || mobileNumber;

        const res = await api.digilockerFastLogin({
          rider_identifier: identifier,
          aadhaar_last_four: aadhaarLastFour,
          otp_code: otpCode,
          consent: true,
        });

        if (res.access_token && res.user) {
          setStoredToken(res.access_token);
          login(res.user, res.access_token);
          setStep("success");
          setTimeout(() => {
            onClose();
            router.push(redirectPath);
          }, 1200);
        }
      } else {
        // Mode is pull_credentials for onboarding
        const res = await api.digilockerPullCredentials({
          preset_identity: selectedPreset,
          phone: mobileNumber,
          aadhaar_last_four: aadhaarLastFour,
        });

        if (res.success && res.data) {
          if (onCredentialsFetched) {
            onCredentialsFetched(res.data);
          }
          setStep("success");
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || "DigiLocker verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* DigiLocker Header Ribbon */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white text-blue-700 flex items-center justify-center shadow-md font-black text-xl">
              DL
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-sky-200">
                Government of India • MeriPehchaan Gateway
              </div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>DigiLocker Instant Access</span>
                <span className="text-[10px] font-bold bg-sky-400/20 text-sky-100 px-2 py-0.5 rounded-full border border-sky-300/30">
                  Paperless KYC
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-blue-100 max-w-md">
            {mode === "login"
              ? "Fast, tamper-proof courier sign-in verified via National DigiLocker ecosystem"
              : "Instantly pull and verify official Driving Licence and Aadhaar documents"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === "success" ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === "login" ? "DigiLocker Sign-In Confirmed!" : "Government Credentials Pulled!"}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {mode === "login"
                  ? "Identity verified with active session. Redirecting to your Rider Portal..."
                  : "Driving licence and ID verified with SHA-256 seal. Updating form..."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile Fast Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Select Registered Citizen Profile</span>
                  <span className="text-[10px] font-semibold text-sky-600">Simulated Gateway</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => {
                    const isSelected = selectedPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-sky-600 bg-sky-50 ring-2 ring-sky-500/20"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{p.riderCode}</div>
                        <div className="text-[9px] font-semibold text-emerald-600 truncate mt-1">
                          {p.status}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Coordinates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">DigiLocker Mobile</label>
                  <div className="relative">
                    <Smartphone className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Aadhaar (Last 4)</label>
                  <div className="relative">
                    <Fingerprint className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      maxLength={4}
                      value={aadhaarLastFour}
                      onChange={(e) => setAadhaarLastFour(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Verified Documents Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Connected Documents from National Vault
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <FileCheck2 className="h-4 w-4 text-sky-600 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-800 text-[11px]">Driving Licence</div>
                      <div className="text-[10px] text-slate-400">MoRTH • Verified</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <IdCard className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-800 text-[11px]">Aadhaar Identity</div>
                      <div className="text-[10px] text-slate-400">UIDAI • e-KYC</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consent Box */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs">
                <input
                  type="checkbox"
                  id="digilocker-consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="digilocker-consent" className="text-[11px] text-blue-900 leading-relaxed">
                  I hereby provide voluntary electronic consent to TrustShift AI to fetch and verify my official
                  Driving Licence and digital identity via the DigiLocker Government Gateway for delivery fleet
                  continuity assurance.
                </label>
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying via DigiLocker...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {mode === "login" ? "Verify & Sign In with DigiLocker" : "Fetch & Populate Credentials"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
