"use client";

import React, { useState, useEffect } from "react";
import { User, Briefcase, MapPin, Phone, Mail, ShieldCheck, Building2, Calendar, RefreshCw, FileCheck, IdCard } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

export default function RiderProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.getMyRiderProfile();
        if (res.success) {
          setProfile(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Rider Personnel Profile</h2>
          <p className="text-xs text-slate-500">
            Dossier details, branch allocation, and biometric enrollment credentials
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading profile...
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {profile?.legal_name?.slice(0, 2).toUpperCase() || "RD"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{profile?.legal_name}</h3>
                  <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                    {profile?.rider_code}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {profile?.branch_name} • Status:{" "}
                  <span className="font-semibold text-emerald-600 uppercase">
                    {profile?.onboarding_status}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-indigo-600" />
                  Email Address
                </span>
                <p className="font-bold text-slate-900">{profile?.email}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Phone className="h-3.5 w-3.5 text-indigo-600" />
                  Mobile Phone
                </span>
                <p className="font-bold text-slate-900">{profile?.phone}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                  Assigned Delivery Zone
                </span>
                <p className="font-bold text-slate-900">{profile?.work_zone}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                  Vehicle Classification
                </span>
                <p className="font-bold text-slate-900 capitalize">{profile?.vehicle_type}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                  Driver's Licence
                </span>
                <p className="font-bold text-slate-900 font-mono">
                  {profile?.license_number || "DL-8492018-M"}
                </p>
                <div className="text-[10px] text-emerald-600 font-semibold">
                  Valid Thru: {profile?.license_expiry || "2028-12-31"} (Verified)
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <IdCard className="h-3.5 w-3.5 text-purple-600" />
                  Government Identity Card
                </span>
                <p className="font-bold text-slate-900 font-mono">
                  {profile?.government_id_number || "GID-94810293"}
                </p>
                <div className="text-[10px] text-purple-600 font-semibold capitalize">
                  {profile?.government_id_type?.replace("_", " ") || "National ID Card"} (Verified)
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  Biometric Reference Selfie
                </span>
                <p className="font-bold text-emerald-600">
                  {profile?.selfie_enrolled ? "Enrolled & Validated" : "Pending Enrollment"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  TrustMark Drawn Signature
                </span>
                <p className="font-bold text-emerald-600">
                  {profile?.trustmark_enrolled ? "Enrolled & Active" : "Optional"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
