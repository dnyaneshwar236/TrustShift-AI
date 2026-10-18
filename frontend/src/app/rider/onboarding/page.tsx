"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserCheck, CheckCircle2, ArrowRight, Camera, PenTool, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

export default function RiderOnboardingStatusPage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.getMyRiderProfile().then((res) => {
      if (res.success) setProfile(res.data);
    });
  }, []);

  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Onboarding Status & Credentials</h2>
          <p className="text-xs text-slate-500">
            Review completed onboarding requirements and enrolled biometric security factors
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Enrollment Dossier
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Status: <span className="text-emerald-600 uppercase">{profile?.onboarding_status || "ACTIVE"}</span>
              </h3>
            </div>
            <Link
              href="/register/rider"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Restart Wizard
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <b className="text-slate-900">Step 1 — Personal & Contact Verification</b>
                  <p className="text-slate-500">Legal name and registered phone ownership verified</p>
                </div>
              </div>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                COMPLETED
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <b className="text-slate-900">Step 2 — Fleet Employment & Zone Allocation</b>
                  <p className="text-slate-500">Zone: {profile?.work_zone || "Metro Central Zone"}</p>
                </div>
              </div>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                COMPLETED
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <b className="text-slate-900">Step 3 — Driver's Licence & Government ID</b>
                  <p className="text-slate-500">
                    Licence: {profile?.license_number || "DL-8492018-M"} • Gov ID: {profile?.government_id_number || "GID-94810293"}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                VERIFIED
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {profile?.selfie_enrolled ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Camera className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <b className="text-slate-900">Step 3 — Reference Portrait Biometrics</b>
                  <p className="text-slate-500">
                    {profile?.selfie_enrolled ? "Enrolled reference confirmed" : "Enrollment pending"}
                  </p>
                </div>
              </div>
              <Link
                href="/rider/identity-verification"
                className="font-semibold text-indigo-600 hover:underline text-xs"
              >
                {profile?.selfie_enrolled ? "Re-take Check" : "Enroll Now"}
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {profile?.trustmark_enrolled ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <PenTool className="h-5 w-5 text-indigo-600" />
                )}
                <div>
                  <b className="text-slate-900">Step 4 — TrustMark Drawn Pattern</b>
                  <p className="text-slate-500">Supplementary dynamic touch signature pattern</p>
                </div>
              </div>
              <Link
                href="/rider/trustmark"
                className="font-semibold text-indigo-600 hover:underline text-xs"
              >
                {profile?.trustmark_enrolled ? "Update Pattern" : "Enroll Pattern"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
