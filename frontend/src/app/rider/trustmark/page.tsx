"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TrustMarkCanvas } from "@/components/verification/TrustMarkCanvas";

export default function RiderTrustMarkPage() {
  return (
    <AppShell allowedRoles={["rider"]}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">TrustMark Pattern Verification</h2>
          <p className="text-xs text-slate-500">
            Draw your signature or unique touch gesture to reinforce continuity confidence
          </p>
        </div>

        <TrustMarkCanvas
          mode="verify"
          onSuccess={(res) => {
            console.log("TrustMark result:", res);
          }}
        />
      </div>
    </AppShell>
  );
}
