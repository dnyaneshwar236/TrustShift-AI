"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  ExternalLink,
  CheckCircle2,
  FileText,
  KeyRound,
  Smartphone,
  IdCard,
  Building2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

function DigiLockerOAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // OAuth query parameters
  const clientId = searchParams.get("client_id") || "trustshift-fleet-prod";
  const redirectUri = searchParams.get("redirect_uri") || "/rider/dashboard";
  const mode = searchParams.get("mode") || "login"; // "login" or "pull_credentials"
  const scope = searchParams.get("scope") || "driving_licence aadhaar profile";

  // Flow steps: "credentials" -> "otp" -> "consent"
  const [currentStep, setCurrentStep] = useState<"credentials" | "otp" | "consent">("credentials");
  const [activeTab, setActiveTab] = useState<"mobile" | "aadhaar" | "username">("mobile");

  // Citizen Presets for testing
  const presets = [
    {
      id: "alex",
      name: "Alex Rivera",
      riderCode: "TS-RIDER-101",
      phone: "+1-555-0101",
      aadhaar: "4829",
      dl: "DL-0420190084920",
      email: "rider.alex@trustshift.ai",
      status: "High Trust • MoRTH Verified",
    },
    {
      id: "devon",
      name: "Devon Vance",
      riderCode: "TS-RIDER-202",
      phone: "+1-555-0102",
      aadhaar: "8910",
      dl: "DL-0420210091823",
      email: "rider.devon@trustshift.ai",
      status: "Verified • UIDAI Linked",
    },
    {
      id: "sam",
      name: "Sam Taylor",
      riderCode: "TS-RIDER-303",
      phone: "+1-555-0103",
      aadhaar: "3319",
      dl: "DL-0420200055192",
      email: "rider.sam@trustshift.ai",
      status: "Standard Fleet • Verified",
    },
  ];

  const [selectedPreset, setSelectedPreset] = useState<string>("alex");
  const [mobileOrAadhaar, setMobileOrAadhaar] = useState<string>("+1-555-0101");
  const [securityPin, setSecurityPin] = useState<string>("123456");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("849201");
  const [consentTerms, setConsentTerms] = useState<boolean>(true);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCitizen = presets.find((p) => p.id === selectedPreset) || presets[0];

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = presets.find((item) => item.id === presetId);
    if (p) {
      setMobileOrAadhaar(activeTab === "aadhaar" ? `XXXX-XXXX-${p.aadhaar}` : p.phone);
    }
  };

  const handleSignInStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileOrAadhaar) {
      setErrorMsg("Please enter your Mobile number or Aadhaar.");
      return;
    }
    if (!securityPin || securityPin.length < 4) {
      setErrorMsg("Please enter your 6-digit DigiLocker security PIN.");
      return;
    }
    setErrorMsg(null);
    setCurrentStep("otp");
  };

  const handleOtpStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg("Please enter the 6-digit OTP sent to your registered mobile.");
      return;
    }
    setErrorMsg(null);
    setCurrentStep("consent");
  };

  const handleAuthorizeOAuth = () => {
    if (!consentTerms) {
      setErrorMsg("You must provide consent to share verified credentials with TrustShift AI.");
      return;
    }
    setIsAuthorizing(true);

    // Generate secure mock authorization code
    const authCode = "DL_AUTH_" + Math.random().toString(36).substring(2, 10).toUpperCase() + "_" + Date.now();

    // Redirect to TrustShift AI OAuth Callback handler
    setTimeout(() => {
      const callbackUrl = `/auth/digilocker/callback?code=${authCode}&mode=${mode}&preset=${selectedPreset}&phone=${encodeURIComponent(
        selectedCitizen.phone
      )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      router.push(callbackUrl);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Tricolor National Stripe */}
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" />
        <div className="h-full flex-1 bg-white" />
        <div className="h-full flex-1 bg-[#138808]" />
      </div>

      {/* Official Government of India & DigiLocker Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Ashoka Emblem Vector */}
            <div className="flex items-center gap-2 border-r border-slate-300 pr-3 sm:pr-4">
              <svg className="h-10 w-auto" viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="65" r="45" stroke="#1e293b" strokeWidth="3" fill="#f8fafc" />
                <path d="M50 25 L55 45 L75 45 L60 58 L65 80 L50 68 L35 80 L40 58 L25 45 L45 45 Z" fill="#b45309" />
                <circle cx="50" cy="100" r="14" stroke="#1d4ed8" strokeWidth="2.5" />
                <line x1="50" y1="86" x2="50" y2="114" stroke="#1d4ed8" strokeWidth="1.5" />
                <line x1="36" y1="100" x2="64" y2="100" stroke="#1d4ed8" strokeWidth="1.5" />
                <text x="50" y="125" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">सत्यमेव जयते</text>
              </svg>
              <div className="leading-tight">
                <div className="text-[11px] font-bold text-slate-900 tracking-wide">भारत सरकार</div>
                <div className="text-[10px] text-slate-700 font-medium">Government of India</div>
                <div className="text-[9px] text-slate-500 hidden sm:block">Ministry of Electronics & IT (MeitY)</div>
              </div>
            </div>

            {/* DigiLocker Official Logo */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
                DL
              </div>
              <div className="leading-tight">
                <div className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-1.5">
                  <span>DigiLocker</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-sm">
                    OAuth 2.0
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium">Towards Paperless Governance</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
              <Lock className="h-3 w-3" />
              <span>TLS 1.3 Certified Encrypted</span>
            </div>
            <a
              href="https://www.digilocker.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              <span>Visit digilocker.gov.in</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Simulated Browser URL Location Ribbon (Confirms Authenticity) */}
      <div className="bg-slate-200/90 border-b border-slate-300 px-4 py-1.5 text-[11px] text-slate-600 flex items-center justify-between">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-2 font-mono overflow-hidden">
          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-sm border border-slate-300">
            <Lock className="h-3 w-3" />
            https://
          </span>
          <span className="text-slate-800 font-semibold truncate">
            api.digitallocker.gov.in/public/oauth2/1/authorize?client_id={clientId}&mode={mode}&scope={scope}
          </span>
        </div>
      </div>

      {/* Main OAuth Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col items-center justify-center">
        {/* MeriPehchaan NSSO Brand Badge */}
        <div className="w-full max-w-lg mb-3 flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-bold">
            <Building2 className="h-4 w-4 text-blue-700" />
            <span>MeriPehchaan — National Single Sign-On</span>
          </div>
          <span className="text-[10px] text-blue-700 font-semibold bg-white px-2 py-0.5 rounded border border-blue-200">
            Citizen Auth Gateway
          </span>
        </div>

        {/* Main Interactive Card */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header with breadcrumbs */}
          <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 text-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-sky-300">
                Government e-Authentication Portal
              </span>
              <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white">
                Step {currentStep === "credentials" ? "1" : currentStep === "otp" ? "2" : "3"} of 3
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              {currentStep === "credentials" && "Sign In to your DigiLocker"}
              {currentStep === "otp" && "Verify OTP from UIDAI"}
              {currentStep === "consent" && "Authorize Document Access"}
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">
              {currentStep === "credentials" && "Enter your Aadhaar or mobile registered with Government of India"}
              {currentStep === "otp" && "One-time passcode dispatched to your Aadhaar-linked mobile device"}
              {currentStep === "consent" && "TrustShift AI is requesting verified credential delegation"}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Credentials */}
          {currentStep === "credentials" && (
            <form onSubmit={handleSignInStep} className="p-6 space-y-5">
              {/* Presets Quick Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Fast Demo Citizen Profile:</span>
                  <span className="text-[10px] font-normal text-blue-700">MoRTH & UIDAI Pre-Linked</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedPreset === p.id
                          ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.riderCode}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Login Tabs */}
              <div className="flex border-b border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("mobile");
                    setMobileOrAadhaar(selectedCitizen.phone);
                  }}
                  className={`pb-2.5 px-3 border-b-2 transition-colors ${
                    activeTab === "mobile"
                      ? "border-blue-700 text-blue-900 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mobile Number
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("aadhaar");
                    setMobileOrAadhaar(`XXXX-XXXX-${selectedCitizen.aadhaar}`);
                  }}
                  className={`pb-2.5 px-3 border-b-2 transition-colors ${
                    activeTab === "aadhaar"
                      ? "border-blue-700 text-blue-900 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Aadhaar / Virtual ID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("username");
                    setMobileOrAadhaar(selectedCitizen.email);
                  }}
                  className={`pb-2.5 px-3 border-b-2 transition-colors ${
                    activeTab === "username"
                      ? "border-blue-700 text-blue-900 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Username
                </button>
              </div>

              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {activeTab === "mobile" && "Registered Mobile Number"}
                  {activeTab === "aadhaar" && "12-Digit Aadhaar Number"}
                  {activeTab === "username" && "DigiLocker Username"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {activeTab === "mobile" ? <Smartphone className="h-4 w-4" /> : <IdCard className="h-4 w-4" />}
                  </div>
                  <input
                    type="text"
                    value={mobileOrAadhaar}
                    onChange={(e) => setMobileOrAadhaar(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                    placeholder="Enter value"
                  />
                </div>
              </div>

              {/* 6-digit Security PIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Set 6-Digit Security PIN
                  </label>
                  <span className="text-[10px] text-slate-400">Default: 123456</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={6}
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm tracking-widest font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="******"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center text-[11px] text-slate-500 pt-1">
                By signing in, you agree to MeriPehchaan & DigiLocker Terms of Service.
              </div>
            </form>
          )}

          {/* Step 2: OTP */}
          {currentStep === "otp" && (
            <form onSubmit={handleOtpStep} className="p-6 space-y-5">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-900">
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-blue-700" />
                  <span>OTP Sent to Registered Mobile</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  A 6-digit OTP has been sent to the mobile linked with Aadhaar ending in{" "}
                  <b>{selectedCitizen.aadhaar}</b>.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Enter 6-Digit OTP
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Demo Code: 849201
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  className="w-full text-center py-3 rounded-xl border border-slate-300 text-lg tracking-[0.4em] font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                  placeholder="849201"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep("credentials")}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <span>Verify OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: OAuth Consent Screen */}
          {currentStep === "consent" && (
            <div className="p-6 space-y-5">
              {/* Requesting App Info */}
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 font-bold text-sm">
                  TS
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">TrustShift AI Platform</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Authorized Fleet Operations & Identity Continuity System
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified Enterprise Partner</span>
                  </div>
                </div>
              </div>

              {/* Permissions & Documents to be shared */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Permissions Requested by TrustShift AI:
                </span>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  {/* Doc 1: MoRTH DL */}
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 mt-0.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Driving Licence Record (MoRTH)</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Issued</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {selectedCitizen.dl} • Ministry of Road Transport & Highways
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Doc 2: UIDAI Aadhaar */}
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 mt-0.5">
                      <IdCard className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Aadhaar Identity Verification (UIDAI)</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Issued</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        XXXX-XXXX-{selectedCitizen.aadhaar} • Unique Identification Authority of India
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Doc 3: Profile */}
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 mt-0.5">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">
                        <span>Citizen Profile & Contact</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Legal Name ({selectedCitizen.name}), Date of Birth, Gender, Verified Mobile
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-slate-600 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="leading-relaxed">
                  I hereby provide electronic consent under the <b>IT Act, 2000</b> to share the selected
                  documents with <b>TrustShift AI</b> for identity verification and fleet shift authentication.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isAuthorizing}
                  onClick={() => router.push(redirectUri || "/login/rider")}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  Deny / Cancel
                </button>
                <button
                  type="button"
                  disabled={isAuthorizing || !consentTerms}
                  onClick={handleAuthorizeOAuth}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  {isAuthorizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Authorizing & Returning...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Allow / Authorize (अनुमति दें)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Official DigiLocker Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-500" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>ISO 27001 Certified Datacenter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Government of India Infrastructure</span>
          </div>
        </div>
      </main>

      {/* Official Government Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Powered by National e-Governance Division (NeGD) • Ministry of Electronics & IT (MeitY), Government of India
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <a href="https://www.digilocker.gov.in/privacy-policy" target="_blank" rel="noreferrer" className="hover:underline">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="https://www.digilocker.gov.in/terms-of-service" target="_blank" rel="noreferrer" className="hover:underline">
              Terms of Service
            </a>
            <span>•</span>
            <a href="https://www.digilocker.gov.in/faq" target="_blank" rel="noreferrer" className="hover:underline">
              Help & FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DigiLockerOAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-700" />
            <span>Loading DigiLocker National Gateway...</span>
          </div>
        </div>
      }
    >
      <DigiLockerOAuthContent />
    </Suspense>
  );
}
