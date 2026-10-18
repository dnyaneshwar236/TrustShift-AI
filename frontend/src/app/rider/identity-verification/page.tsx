"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CameraSelfieCapture } from "@/components/verification/CameraSelfieCapture";

export default function RiderIdentityVerificationPage() {
  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Identity Continuity Check</h2>
          <p className="text-xs text-slate-500">
            Verify your identity against your enrolled reference portrait to maintain an uninterrupted shift
          </p>
        </div>

        <CameraSelfieCapture
          mode="verify"
          onVerificationComplete={(res) => {
            console.log("Verification finished:", res);
          }}
        />
      </div>
    </AppShell>
  );
}
