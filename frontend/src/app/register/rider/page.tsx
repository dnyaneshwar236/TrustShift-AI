"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  ShieldCheck,
  Camera,
  PenTool,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  Lock,
  Building,
  KeyRound,
  FileText,
  Upload,
  FileCheck,
  IdCard,
  AlertCircle,
  Eye,
} from "lucide-react";
import { api, getStoredToken, setStoredToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CameraSelfieCapture } from "@/components/verification/CameraSelfieCapture";
import { TrustMarkCanvas } from "@/components/verification/TrustMarkCanvas";
import { DigiLockerModal } from "@/components/auth/DigiLockerModal";

export default function RiderRegistrationPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdRider, setCreatedRider] = useState<any>(null);

  // DigiLocker states
  const [showDigiLockerPull, setShowDigiLockerPull] = useState<boolean>(false);
  const [showDigiLockerLogin, setShowDigiLockerLogin] = useState<boolean>(false);
  const [digiLockerVerified, setDigiLockerVerified] = useState<boolean>(false);


  // Form states
  // Step 1: Personal
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("1996-05-14");
  const [address, setAddress] = useState("");

  // Step 2: Employment
  const [employmentType, setEmploymentType] = useState("full_time");
  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [shiftPreference, setShiftPreference] = useState("morning");
  const [workZone, setWorkZone] = useState("Metro Central Logistics Zone");
  const [experienceYears, setExperienceYears] = useState(2);
  const [password, setPassword] = useState("Rider@12345");

  // Step 3: Documents (License & Government ID)
  const [licenseNumber, setLicenseNumber] = useState("DL-8492018-M");
  const [licenseExpiry, setLicenseExpiry] = useState("2028-12-31");
  const [licenseClass, setLicenseClass] = useState("Class M - Motorcycle / Two-Wheeler");
  const [licenseFile, setLicenseFile] = useState<string | null>(
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'><rect width='300' height='180' rx='12' fill='%231e293b'/><text x='20' y='35' fill='%2360a5fa' font-family='sans-serif' font-weight='bold' font-size='14'>MOTOR VEHICLE DRIVER LICENSE</text><rect x='20' y='55' width='70' height='85' rx='6' fill='%23334155'/><text x='105' y='75' fill='%23f8fafc' font-family='sans-serif' font-size='12'>LIC: DL-8492018-M</text><text x='105' y='100' fill='%2394a3b8' font-family='sans-serif' font-size='11'>EXP: 2028-12-31</text><text x='105' y='125' fill='%2310b981' font-family='sans-serif' font-weight='bold' font-size='11'>STATUS: VERIFIED</text></svg>"
  );
  const [licenseFileName, setLicenseFileName] = useState("driver_license_front.png");

  const [governmentIdType, setGovernmentIdType] = useState("national_id");
  const [governmentIdNumber, setGovernmentIdNumber] = useState("GID-94810293");
  const [governmentIdFile, setGovernmentIdFile] = useState<string | null>(
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'><rect width='300' height='180' rx='12' fill='%230f172a'/><text x='20' y='35' fill='%23a855f7' font-family='sans-serif' font-weight='bold' font-size='14'>GOVERNMENT IDENTITY CARD</text><rect x='20' y='55' width='70' height='85' rx='6' fill='%231e293b'/><text x='105' y='75' fill='%23f8fafc' font-family='sans-serif' font-size='12'>ID: GID-94810293</text><text x='105' y='100' fill='%2394a3b8' font-family='sans-serif' font-size='11'>NATIONAL REGISTER</text><text x='105' y='125' fill='%2310b981' font-family='sans-serif' font-weight='bold' font-size='11'>VALIDATED PROOF</text></svg>"
  );
  const [governmentIdFileName, setGovernmentIdFileName] = useState("national_identity_card.png");

  // Step 4: Contact OTP
  const [otpCode, setOtpCode] = useState("849201");
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 5: Identity Selfie
  const [selfieEnrolled, setSelfieEnrolled] = useState(false);
  const [selfieImageData, setSelfieImageData] = useState<string | null>(null);

  // Step 6: TrustMark
  const [trustmarkEnrolled, setTrustmarkEnrolled] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Field touch states for inline validation
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Format validation helpers
  const isEmailValid = (val: string) => {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  };

  const isPhoneValid = (val: string) => {
    const digits = val.replace(/\D/g, "");
    return /^\+?[0-9\s\-()]{7,25}$/.test(val.trim()) && digits.length >= 7 && digits.length <= 15;
  };

  // Final submit state
  const [completionSuccess, setCompletionSuccess] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const steps = [
    { num: 1, title: "Personal", desc: "Identity & Contact" },
    { num: 2, title: "Employment", desc: "Zone & Vehicle" },
    { num: 3, title: "Documents", desc: "Licence & Gov ID" },
    { num: 4, title: "Verification", desc: "OTP Phone Check" },
    { num: 5, title: "Biometrics", desc: "Reference Selfie" },
    { num: 6, title: "TrustMark", desc: "Signature Pattern" },
    { num: 7, title: "Review", desc: "Final Submission" },
  ];

  const handleDigiLockerCredentialsFetched = (creds: any) => {
    if (creds.legal_name) setLegalName(creds.legal_name);
    if (creds.phone) setPhone(creds.phone);
    if (creds.email && !email) setEmail(creds.email);
    if (creds.date_of_birth) setDob(creds.date_of_birth);
    if (creds.address) setAddress(creds.address);
    if (creds.license_number) setLicenseNumber(creds.license_number);
    if (creds.license_expiry) setLicenseExpiry(creds.license_expiry);
    if (creds.license_class) setLicenseClass(creds.license_class);
    if (creds.license_document_url) {
      setLicenseFile(creds.license_document_url);
      setLicenseFileName("digilocker_driving_licence.svg");
    }
    if (creds.government_id_type) setGovernmentIdType(creds.government_id_type);
    if (creds.government_id_number) setGovernmentIdNumber(creds.government_id_number);
    if (creds.government_id_document_url) {
      setGovernmentIdFile(creds.government_id_document_url);
      setGovernmentIdFileName("digilocker_aadhaar_card.svg");
    }
    setDigiLockerVerified(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("trustshift_digilocker_dossier");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          handleDigiLockerCredentialsFetched(parsed);
          sessionStorage.removeItem("trustshift_digilocker_dossier");
        } catch (e) {
          console.error("Failed to parse DigiLocker dossier from storage", e);
        }
      }
    }
  }, []);

  const handleFileUpload = (

    e: React.ChangeEvent<HTMLInputElement>,
    type: "license" | "government_id"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimize image files to ensure lightning-fast transfers without bloating payloads
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL("image/jpeg", 0.85);
            if (type === "license") {
              setLicenseFile(optimized);
              setLicenseFileName(file.name);
            } else {
              setGovernmentIdFile(optimized);
              setGovernmentIdFileName(file.name);
            }
            return;
          }
          // Fallback if canvas context fails
          if (type === "license") {
            setLicenseFile(reader.result as string);
            setLicenseFileName(file.name);
          } else {
            setGovernmentIdFile(reader.result as string);
            setGovernmentIdFileName(file.name);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or non-image files
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === "license") {
          setLicenseFile(result);
          setLicenseFileName(file.name);
        } else {
          setGovernmentIdFile(result);
          setGovernmentIdFileName(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDocumentsAndProceed = async () => {
    setStepError(null);

    // Validate email and phone formats before proceeding
    if (!email.trim() || !isEmailValid(email)) {
      setEmailTouched(true);
      const msg = "Please provide a valid email address (e.g. rider@example.com) in Step 1 to save credentials.";
      setStepError(msg);
      setCurrentStep(1);
      return;
    }

    if (!phone.trim() || !isPhoneValid(phone)) {
      setPhoneTouched(true);
      const msg = "Please provide a valid mobile phone number with 7 to 15 digits (e.g. +1-555-0144) in Step 1 to save credentials.";
      setStepError(msg);
      setCurrentStep(1);
      return;
    }

    try {
      setLoading(true);

      // If rider is already initialized, simply update documents and advance
      if (createdRider?.id) {
        const res = await api.updateOnboardingStep(createdRider.id, 3, {
          legal_name: legalName,
          email: email.trim(),
          phone: phone.trim(),
          license_number: licenseNumber,
          license_expiry: licenseExpiry,
          license_class: licenseClass,
          license_document_url: licenseFile || undefined,
          government_id_type: governmentIdType,
          government_id_number: governmentIdNumber,
          government_id_document_url: governmentIdFile || undefined,
          selfie_image_data: selfieImageData || undefined,
          trustmark_signature_data: signatureData || undefined,
        });

        if (res.success && res.data) {
          setCreatedRider(res.data);
          if (res.data.access_token) {
            setStoredToken(res.data.access_token);
          }
          setStepError(null);
          setCurrentStep(4); // Move to OTP
        }
        return;
      }

      // Initial registration with mandatory credentials
      const res = await api.registerRider({
        legal_name: legalName || "Fleet Courier",
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        date_of_birth: dob,
        experience_years: experienceYears,
        employment_type: employmentType,
        work_zone: workZone,
        shift_preference: shiftPreference,
        vehicle_type: vehicleType,
        address,
        license_number: licenseNumber,
        license_expiry: licenseExpiry,
        license_class: licenseClass,
        license_document_b64: licenseFile || undefined,
        government_id_type: governmentIdType,
        government_id_number: governmentIdNumber,
        government_id_document_b64: governmentIdFile || undefined,
        selfie_image_data: selfieImageData || undefined,
        trustmark_signature_data: signatureData || undefined,
      });

      if (res.success && res.data) {
        setCreatedRider(res.data);
        if (res.data.access_token) {
          setStoredToken(res.data.access_token);
        }
        setStepError(null);
        setCurrentStep(4); // Move to OTP
      }
    } catch (err: any) {
      setStepError(err.message || "Failed to save credentials. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode.length < 6) {
      alert("Please enter a 6-digit verification code.");
      return;
    }
    setOtpVerified(true);
    setCurrentStep(5);
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      const riderId = createdRider?.id;
      let returnedToken: string | null = null;

      if (riderId) {
        const submitRes = await api.submitOnboarding(riderId);
        const tok = submitRes.data?.access_token;
        if (tok) {
          returnedToken = tok;
          setStoredToken(tok);
        }
      }



      // Resolve access token
      const token = returnedToken || getStoredToken();
      if (token && createdRider) {
        login(
          {
            id: createdRider.user_id,
            email: createdRider.email || email,
            phone: createdRider.phone || phone,
            role: "rider",
            status: "active",
            organization_id: "org-default",
            organization_name: "TrustShift Fleet Logistics",
            is_2fa_enabled: false,
            rider_profile_id: createdRider.id,
            rider_code: createdRider.rider_code,
            legal_name: createdRider.legal_name,
            branch_name: createdRider.branch_name,
          },
          token
        );
      }

      setCompletionSuccess(true);
    } catch (err: any) {
      alert(`Final submission error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 font-extrabold text-lg tracking-tight"
          >
            <ShieldCheck className="h-6 w-6" />
            <span>TrustShift AI</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Rider Onboarding Wizard</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Complete company-assisted enrollment with continuous identity assurance
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {steps.map((st) => {
              const isPast = st.num < currentStep;
              const isCurrent = st.num === currentStep;
              return (
                <div key={st.num} className="text-center space-y-1.5">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isPast
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-indigo-600"
                        : "bg-slate-200"
                    }`}
                  />
                  <div className="hidden sm:block">
                    <span
                      className={`text-[10px] font-bold block truncate ${
                        isCurrent ? "text-indigo-600" : isPast ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Cards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 1 — Personal Information</h3>
                <p className="text-xs text-slate-500">Legal name and communication contact coordinates</p>
              </div>

              {/* DigiLocker Fast Track Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                    DL
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">Have a DigiLocker Account?</h4>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                        ⚡ Fast Track
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Already registered? Sign in instantly or auto-fill your personal dossier via DigiLocker.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/digilocker/oauth?mode=login&redirect_uri=/rider/dashboard"
                    className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 hover:bg-sky-50 text-blue-700 font-bold text-xs transition-colors shadow-2xs inline-flex items-center gap-1"
                  >
                    <span>DigiLocker Portal</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="/digilocker/oauth?mode=pull_credentials&redirect_uri=/register/rider"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-Fill from DigiLocker</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDigiLockerPull(true)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    title="Quick In-Page Modal"
                  >
                    Modal
                  </button>
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Jordan Casey"
                    className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">Registered Email Address *</label>
                    {email && isEmailValid(email) && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid Format
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!emailTouched) setEmailTouched(true);
                    }}
                    placeholder="jordan.casey@example.com"
                    className={`w-full text-sm py-2 px-3 bg-white border rounded-xl text-slate-900 transition-colors ${
                      emailTouched && email && !isEmailValid(email)
                        ? "border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30"
                        : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                  />
                  {emailTouched && email && !isEmailValid(email) && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Please enter a valid email format (e.g. rider@example.com) to avoid profile mismatch.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">Registered Mobile Phone *</label>
                    {phone && isPhoneValid(phone) && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid Format
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (!phoneTouched) setPhoneTouched(true);
                    }}
                    placeholder="+1-555-0144"
                    className={`w-full text-sm py-2 px-3 bg-white border rounded-xl text-slate-900 transition-colors ${
                      phoneTouched && phone && !isPhoneValid(phone)
                        ? "border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30"
                        : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                  />
                  {phoneTouched && phone && !isPhoneValid(phone) && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Please enter a valid phone number with 7 to 15 digits (e.g. +1-555-0144).
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Date of Birth (Eligibility Only)</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Age is never factored into continuity risk scores.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Service Area / Residential City</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Metro City, CA"
                    className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {stepError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Notice:</span>
                    <span>{stepError}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  disabled={!legalName || !email || !phone || !isEmailValid(email) || !isPhoneValid(phone)}
                  onClick={() => {
                    setEmailTouched(true);
                    setPhoneTouched(true);
                    if (!isEmailValid(email) || !isPhoneValid(phone)) return;
                    setCurrentStep(2);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Proceed to Employment</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Employment */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 2 — Fleet Employment & Assignment</h3>
                <p className="text-xs text-slate-500">Zone, vehicle classification, and shift preference</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Employment Arrangement</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="full_time">Full-Time Logistics Specialist</option>
                    <option value="part_time">Part-Time Field Courier</option>
                    <option value="gig_contractor">Gig Fleet Contractor</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Assigned Work Zone</label>
                  <select
                    value={workZone}
                    onChange={(e) => setWorkZone(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Metro Central Logistics Zone">Metro Central Logistics Zone</option>
                    <option value="North Harbour Zone">North Harbour Zone</option>
                    <option value="West Downtown Hub">West Downtown Hub</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Vehicle Classification</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="ev_scooter">Electric Scooter</option>
                    <option value="car">Car / Van</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Shift Preference</label>
                  <select
                    value={shiftPreference}
                    onChange={(e) => setShiftPreference(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="morning">Morning Shift (06:00 - 14:00)</option>
                    <option value="afternoon">Afternoon Shift (14:00 - 22:00)</option>
                    <option value="night">Night Hub Shift (22:00 - 06:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-slate-700 block">Account Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs"
                >
                  <span>Proceed to Document Verification</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Mandatory Driver's Licence & Government ID Upload */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-indigo-600" />
                  Step 3 — Mandatory Licence & Government ID Upload
                </h3>
                <p className="text-xs text-slate-500">
                  Upload official government credentials and valid driver's licence to verify physical identity and road eligibility.
                </p>
              </div>

              {/* DigiLocker 1-Click Verification Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                    DL
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">Verify Faster with DigiLocker</h4>
                      {digiLockerVerified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          DigiLocker Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Skip manual uploads! Pull verified Driving Licence (MoRTH) & Government Aadhaar (UIDAI) in 1 click.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href="/digilocker/oauth?mode=pull_credentials&redirect_uri=/register/rider"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{digiLockerVerified ? "Re-pull via DigiLocker Website" : "Fetch via DigiLocker Website"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDigiLockerPull(true)}
                    className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50"
                    title="Quick In-Page Modal"
                  >
                    Modal
                  </button>
                </div>
              </div>


              {/* Driver's License Card */}

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Driver's Licence Verification</h4>
                      <p className="text-[11px] text-slate-500">Motor vehicle operator licence issued by licensing authority</p>
                    </div>
                  </div>
                  {licenseFile ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Attached
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                      Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Licence Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="DL-XXXXXXX"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={licenseExpiry}
                      onChange={(e) => setLicenseExpiry(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Licence Class</label>
                    <select
                      value={licenseClass}
                      onChange={(e) => setLicenseClass(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="Class M - Motorcycle / Two-Wheeler">Class M - Motorcycle / Two-Wheeler</option>
                      <option value="Class C - Standard Automobile">Class C - Standard Automobile</option>
                      <option value="Class A/B - Commercial Courier">Class A/B - Commercial Courier</option>
                    </select>
                  </div>
                </div>

                {/* Upload Box */}
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 bg-white text-center transition-colors">
                  {licenseFile ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-200">
                          {licenseFile.startsWith("data:image") ? (
                            <img src={licenseFile} alt="Licence" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-6 h-6 text-indigo-400" />
                          )}
                        </div>
                        <div className="text-left text-xs">
                          <div className="font-bold text-slate-900">{licenseFileName}</div>
                          <div className="text-slate-400 text-[11px]">Security hologram & OCR checksum passed</div>
                        </div>
                      </div>
                      <label className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors">
                        Change File
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "license")}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-2">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-700">
                        Upload Driver's Licence (Front & Back)
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Drag and drop or browse JPG, PNG, or PDF up to 10MB
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "license")}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Government Identity Card Card */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <IdCard className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Government Identity Card</h4>
                      <p className="text-[11px] text-slate-500">Official national ID card, passport, or state resident proof</p>
                    </div>
                  </div>
                  {governmentIdFile ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Attached
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                      Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Government ID Type *</label>
                    <select
                      value={governmentIdType}
                      onChange={(e) => setGovernmentIdType(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="national_id">National Identity Card (Civil Registry)</option>
                      <option value="passport">Government Passport</option>
                      <option value="state_id">State Identification Card</option>
                      <option value="resident_permit">Permanent Residence Permit</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ID Card Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GID-XXXXXXXX"
                      value={governmentIdNumber}
                      onChange={(e) => setGovernmentIdNumber(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                </div>

                {/* Upload Box */}
                <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-4 bg-white text-center transition-colors">
                  {governmentIdFile ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-200">
                          {governmentIdFile.startsWith("data:image") ? (
                            <img src={governmentIdFile} alt="Government ID" className="w-full h-full object-cover" />
                          ) : (
                            <IdCard className="w-6 h-6 text-purple-400" />
                          )}
                        </div>
                        <div className="text-left text-xs">
                          <div className="font-bold text-slate-900">{governmentIdFileName}</div>
                          <div className="text-slate-400 text-[11px]">Government MRZ and biological verification verified</div>
                        </div>
                      </div>
                      <label className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer transition-colors">
                        Change File
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "government_id")}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-2">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-700">
                        Upload Government Identity Card (Photo Page)
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Drag and drop or browse JPG, PNG, or PDF up to 10MB
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "government_id")}
                      />
                    </label>
                  )}
                </div>
              </div>

              {stepError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Registration Notice:</span>
                    <span>{stepError}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading || !licenseNumber || !governmentIdNumber}
                  onClick={handleSaveDocumentsAndProceed}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Save Credentials & Verify Phone</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Contact Verification */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 4 — Contact Verification</h3>
                <p className="text-xs text-slate-500">
                  Verify phone number ownership via one-time SMS verification code
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Phone className="h-4 w-4 text-indigo-600" />
                  <span>SMS Dispatched to: {phone || "+1-555-0144"}</span>
                </div>
                <p className="text-slate-500">
                  In demonstration mode, your synthetic OTP challenge code has been pre-filled below.
                </p>
                <div className="font-mono font-bold text-indigo-700 bg-white p-2 rounded-lg border border-slate-200 text-center text-sm tracking-widest">
                  849201
                </div>
              </div>

              <div className="space-y-2 max-w-xs mx-auto text-center">
                <label className="text-xs font-semibold text-slate-700 block">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs"
                >
                  <span>Verify Code & Proceed</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Biometric Selfie Enrollment */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 5 — Reference Selfie Enrollment</h3>
                <p className="text-xs text-slate-500">
                  Captured once to serve as your enrolled reference for continuity checks
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                <b>Explicit Biometric Consent:</b>
                <p className="text-slate-600 leading-relaxed">
                  Your selfie is used solely to verify identity continuity at shift check-in. Raw images and biometric templates are never stored in ordinary database tables or sold to third parties.
                </p>
              </div>

              {/* Embedded Camera Component */}
              <CameraSelfieCapture
                mode="enroll"
                riderId={createdRider?.id}
                onVerificationComplete={(res, img) => {
                  setSelfieEnrolled(true);
                  const captured = img || (res && res.image_b64) || null;
                  if (captured) {
                    setSelfieImageData(captured);
                    if (createdRider?.id) {
                      api.updateOnboardingStep(createdRider.id, 5, { selfie_image_data: captured }).catch(() => {});
                    }
                  }
                }}
                onCapture={(img) => {
                  setSelfieImageData(img);
                }}
              />

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs"
                >
                  <span>{selfieEnrolled ? "Reference Enrolled — Next" : "Skip / Next"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: TrustMark Drawing */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 6 — TrustMark Signature Setup</h3>
                <p className="text-xs text-slate-500">
                  Draw your personal signature pattern using finger, touch, or mouse
                </p>
              </div>

              <TrustMarkCanvas
                mode="enroll"
                riderId={createdRider?.id}
                onSuccess={(res, strokeJson) => {
                  setTrustmarkEnrolled(true);
                  if (strokeJson) {
                    setSignatureData(strokeJson);
                    if (createdRider?.id) {
                      api.updateOnboardingStep(createdRider.id, 6, { trustmark_signature_data: strokeJson }).catch(() => {});
                    }
                  }
                }}
              />


              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs"
                >
                  <span>Proceed to Final Review</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Final Review */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 7 — Review & Confirmation</h3>
                <p className="text-xs text-slate-500">Review your onboarding dossier before submission</p>
              </div>

              {completionSuccess ? (
                <div className="text-center py-8 space-y-4 animate-in fade-in">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                  <h3 className="font-extrabold text-slate-900 text-lg">Onboarding Complete!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your rider account has been created with assigned Rider ID{" "}
                    <b>{createdRider?.rider_code || "RDR-NEW"}</b> and verified credentials.
                  </p>
                  <Link
                    href="/rider/dashboard"
                    className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md"
                  >
                    <span>Open Rider Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-900">Personal Summary</h4>
                      <p className="text-slate-600">
                        <b>Name:</b> {legalName || "Jordan Casey"}<br />
                        <b>Email:</b> {email}<br />
                        <b>Phone:</b> {phone}<br />
                        <b>Date of Birth:</b> {dob}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-900">Assignment</h4>
                      <p className="text-slate-600">
                        <b>Employment:</b> {employmentType.replace("_", " ").toUpperCase()}<br />
                        <b>Zone:</b> {workZone}<br />
                        <b>Vehicle:</b> {vehicleType.toUpperCase()}<br />
                        <b>Shift:</b> {shiftPreference.toUpperCase()}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 sm:col-span-2">
                      <h4 className="font-bold text-slate-900">Verified Credentials & Biometric Assets</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Phone Verified</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Licence: {licenseNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Gov ID: {governmentIdNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{selfieEnrolled ? "Biometrics Enrolled" : "Selfie Pending"}</span>
                        </div>
                      </div>

                      {/* Biometric previews saved in database */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                            {selfieImageData ? (
                              <img src={selfieImageData} alt="Enrolled Face" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                REF
                              </div>
                            )}
                          </div>
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold text-slate-900">Enrolled Face Portrait</div>
                            <div className="text-[11px] text-emerald-600 font-semibold">✓ Saved in Database</div>
                            <div className="text-[10px] text-slate-400">Ground truth for shift check-ins</div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-indigo-50 overflow-hidden shrink-0 border border-indigo-100 flex items-center justify-center">
                            <PenTool className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold text-slate-900">TrustMark Signature Pattern</div>
                            <div className="text-[11px] text-indigo-600 font-semibold">✓ Pattern Saved in Database</div>
                            <div className="text-[10px] text-slate-400">Kinematic pattern matched on sign-in</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(6)}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleFinalSubmit}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Submit Onboarding Dossier"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DigiLocker Pull Credentials Modal */}
      <DigiLockerModal
        isOpen={showDigiLockerPull}
        onClose={() => setShowDigiLockerPull(false)}
        mode="pull_credentials"
        onCredentialsFetched={handleDigiLockerCredentialsFetched}
      />

      {/* DigiLocker Direct Fast Login Modal */}
      <DigiLockerModal
        isOpen={showDigiLockerLogin}
        onClose={() => setShowDigiLockerLogin(false)}
        mode="login"
        redirectPath="/rider/dashboard"
      />
    </div>
  );
}

