"use client";

import React, { useState } from "react";
import { Lock, Smartphone, ShieldCheck, CheckCircle2, Trash2, KeyRound, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";

export default function RiderSecurityPage() {
  const { user } = useAuth();

  const [devices, setDevices] = useState([
    {
      id: "dev-1",
      name: "Samsung Galaxy S24 Ultra",
      type: "Mobile Handset",
      status: "trusted",
      lastSeen: "12 minutes ago",
      current: true,
    },
    {
      id: "dev-2",
      name: "Google Chrome on Windows (Operations Hub)",
      type: "Desktop Browser",
      status: "trusted",
      lastSeen: "2 days ago",
      current: false,
    },
  ]);

  const handleRevokeDevice = (id: string) => {
    if (confirm("Revoke this device? Any active shifts on this device will require step-up verification.")) {
      setDevices(devices.filter((d) => d.id !== id));
    }
  };

  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Security & Authentication</h2>
          <p className="text-xs text-slate-500">
            Manage your two-factor verification methods and authorized delivery devices
          </p>
        </div>

        {/* 2FA Configuration Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Two-Step Authentication</h3>
                <p className="text-xs text-slate-500">Enforce OTP verification upon sign in or device changes</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ENABLED
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">Primary 2FA Method</span>
              <span className="text-slate-500">SMS OTP challenge to registered mobile {user?.phone || "+1-555-0191"}</span>
            </div>
            <button
              type="button"
              className="text-indigo-600 font-semibold hover:underline text-xs"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Enrolled Trusted Devices Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Enrolled Trusted Devices</h3>
              <p className="text-xs text-slate-500">
                Devices recognized by TrustShift continuity engine
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">{devices.length} Devices</span>
          </div>

          <div className="space-y-3">
            {devices.map((d) => (
              <div
                key={d.id}
                className="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100/60 text-indigo-700">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-slate-900">{d.name}</b>
                      {d.current && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      {d.type} • Last active {d.lastSeen}
                    </p>
                  </div>
                </div>

                {!d.current && (
                  <button
                    type="button"
                    onClick={() => handleRevokeDevice(d.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Revoke device"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
