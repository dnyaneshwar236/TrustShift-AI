"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  User,
  Shield,
  Briefcase,
  FileCheck,
  IdCard,
} from "lucide-react";

export default function ManagerNewRiderPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    legal_name: "",
    email: "",
    phone: "",
    password: "RiderPassword@123",
    assigned_work_zone: "North Sector",
    vehicle_type: "motorcycle",
    employment_type: "contractor",
    shift_preference: "day",
    // Documents
    license_number: "DL-9821034-M",
    license_expiry: "2028-10-31",
    license_class: "Class M - Motorcycle",
    government_id_type: "national_id",
    government_id_number: "GID-74829104",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  const phoneDigits = formData.phone.replace(/\D/g, "");
  const isEmailValid = formData.email.trim() === "" || emailRegex.test(formData.email.trim());
  const isPhoneValid = formData.phone.trim() === "" || (phoneDigits.length >= 7 && phoneDigits.length <= 15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setError("Please provide a valid email address (e.g. rider@trustshift.ai).");
      return;
    }

    if (formData.phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
      setError("Please enter a valid phone number containing 7 to 15 digits (e.g. +1-555-234-5678).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.registerRider({
        legal_name: formData.legal_name,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        work_zone: formData.assigned_work_zone,
        assigned_work_zone: formData.assigned_work_zone,
        vehicle_type: formData.vehicle_type,

        employment_type: formData.employment_type,
        shift_preference: formData.shift_preference,
        license_number: formData.license_number,
        license_expiry: formData.license_expiry,
        license_class: formData.license_class,
        government_id_type: formData.government_id_type,
        government_id_number: formData.government_id_number,
      });

      alert(`Rider ${formData.legal_name} successfully registered with Code: ${res.data.rider_code}`);
      router.push("/manager/riders");
    } catch (err: any) {
      setError(err.message || "Failed to register rider");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell allowedRoles={["manager", "admin"]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/manager/riders"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet Roster
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Onboard Fleet Rider</h1>
              <p className="text-xs text-slate-500">
                Register a new field worker with verified government credentials and driver's licence.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jordan Hayes"
                required
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Email Address <span className="text-red-500">*</span></span>
                  {formData.email && (
                    <span className={`text-[10px] font-semibold ${isEmailValid ? "text-emerald-600" : "text-rose-500"}`}>
                      {isEmailValid ? "✓ Valid email format" : "✗ Invalid email format"}
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  placeholder="rider@trustshift.ai"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full text-xs border rounded-lg p-2.5 transition-colors ${
                    formData.email.trim() !== "" && !isEmailValid
                      ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  }`}
                />
                {formData.email.trim() !== "" && !isEmailValid && (
                  <p className="text-[10px] text-rose-500 mt-1">
                    Must be in standard email format (e.g., rider@trustshift.ai)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Mobile Phone Number</span>
                  {formData.phone && (
                    <span className={`text-[10px] font-semibold ${isPhoneValid ? "text-emerald-600" : "text-rose-500"}`}>
                      {isPhoneValid ? "✓ Valid phone format" : "✗ 7-15 digits required"}
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full text-xs border rounded-lg p-2.5 transition-colors ${
                    formData.phone.trim() !== "" && !isPhoneValid
                      ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  }`}
                />
                {formData.phone.trim() !== "" && !isPhoneValid && (
                  <p className="text-[10px] text-rose-500 mt-1">
                    Please provide between 7 and 15 digits (e.g. +1-555-234-5678)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Zone</label>
                <input
                  type="text"
                  value={formData.assigned_work_zone}
                  onChange={(e) => setFormData({ ...formData, assigned_work_zone: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="electric_scooter">Electric Scooter</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Automobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                >
                  <option value="contractor">Contractor</option>
                  <option value="full_time">Full-Time Employee</option>
                  <option value="part_time">Part-Time</option>
                </select>
              </div>
            </div>

            {/* Document Verification Section */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                Verified Legal Credentials
              </h2>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Driver's Licence Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Licence Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Licence Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.license_expiry}
                      onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <IdCard className="w-3.5 h-3.5 text-purple-600" />
                  <span>Government Identity Card Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Document Type *</label>
                    <select
                      value={formData.government_id_type}
                      onChange={(e) => setFormData({ ...formData, government_id_type: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    >
                      <option value="national_id">National Identity Card</option>
                      <option value="passport">Government Passport</option>
                      <option value="state_id">State ID Card</option>
                      <option value="resident_permit">Permanent Residence Permit</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Government ID Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.government_id_number}
                      onChange={(e) => setFormData({ ...formData, government_id_number: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Initial Setup Password:</span>{" "}
              <code className="font-mono bg-white px-2 py-0.5 rounded-sm border border-slate-200">
                {formData.password}
              </code>
              <p className="text-[11px] text-slate-400 mt-1">
                The rider will be prompted for OTP and biometric facial enrollment upon first sign-in.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/manager/riders"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {submitting ? "Registering..." : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
