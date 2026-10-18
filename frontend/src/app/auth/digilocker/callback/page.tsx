"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, RefreshCw, AlertCircle, ArrowRight, Lock } from "lucide-react";
import { api, setStoredToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function DigiLockerCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const code = searchParams.get("code");
  const mode = searchParams.get("mode") || "login";
  const preset = searchParams.get("preset") || "alex";
  const phone = searchParams.get("phone") || undefined;
  const redirectUri = searchParams.get("redirect_uri") || (mode === "login" ? "/rider/dashboard" : "/register/rider");

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [currentStepText, setCurrentStepText] = useState("Connecting to DigiLocker Government Gateway...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMessage("No authorization code received from DigiLocker.");
      return;
    }

    let isMounted = true;

    async function processExchange() {
      try {
        if (!isMounted) return;
        setCurrentStepText("Exchanging OAuth grant with DigiLocker API...");

        // Small delay to provide visible assurance of government credential verification
        await new Promise((r) => setTimeout(r, 600));

        if (!isMounted) return;
        setCurrentStepText("Verifying MoRTH Driving Licence & UIDAI Aadhaar cryptographic signatures...");

        const res = await api.digilockerOAuthExchange({
          code: code || "demo_code",
          mode,
          preset_identity: preset,
          phone,
        });

        await new Promise((r) => setTimeout(r, 600));

        if (!isMounted) return;

        if (mode === "login") {
          if (res.access_token && res.user) {
            setStoredToken(res.access_token);
            login(res.user, res.access_token);
            setStatus("success");
            setCurrentStepText("Identity verified! Redirecting to Rider Dashboard...");
            setTimeout(() => {
              router.push(redirectUri || "/rider/dashboard");
            }, 1000);
          } else {
            throw new Error("Invalid login response from authentication service.");
          }
        } else {
          // Mode: pull_credentials for Onboarding
          if (res.success && res.data) {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("trustshift_digilocker_dossier", JSON.stringify(res.data));
            }
            setStatus("success");
            setCurrentStepText("Verified citizen dossier imported! Applying credentials to onboarding wizard...");
            setTimeout(() => {
              router.push("/register/rider?digilocker=verified");
            }, 1000);
          } else {
            throw new Error("Failed to extract verified credentials dossier.");
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(err.message || "Failed to process DigiLocker verification.");
      }
    }

    processExchange();

    return () => {
      isMounted = false;
    };
  }, [code, mode, preset, phone, redirectUri, login, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 text-center space-y-6">
        {/* DigiLocker & Government Seal */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-md">
            DL
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-blue-900">Government of India</div>
            <div className="text-[11px] text-slate-500 font-medium">MeriPehchaan DigiLocker Gateway</div>
          </div>
        </div>

        {/* Status Indicator */}
        {status === "processing" && (
          <div className="space-y-4 py-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-blue-50 border-4 border-blue-600 border-t-transparent animate-spin flex items-center justify-center" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Validating Government Credentials</h2>
              <p className="text-xs text-blue-700 font-medium animate-pulse">{currentStepText}</p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              OAuth Code: {code?.substring(0, 16)}...
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Government Authentication Successful</h2>
              <p className="text-xs text-emerald-700 font-medium">{currentStepText}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>MoRTH & UIDAI Seals Verified</span>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="h-16 w-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <AlertCircle className="h-9 w-9" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Verification Failed</h2>
              <p className="text-xs text-rose-600">{errorMessage}</p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/login/rider")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Back to Sign In
              </button>
              <button
                type="button"
                onClick={() => router.push(`/digilocker/oauth?mode=${mode}`)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <Lock className="h-3 w-3 text-slate-400" />
          <span>Encrypted Identity Exchange via Information Technology Act 2000</span>
        </div>
      </div>
    </div>
  );
}

export default function DigiLockerCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-700" />
            <span>Processing DigiLocker OAuth Callback...</span>
          </div>
        </div>
      }
    >
      <DigiLockerCallbackContent />
    </Suspense>
  );
}
