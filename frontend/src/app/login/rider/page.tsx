"use client";

import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function RiderLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <LoginForm
        roleHint="rider"
        title="Rider Check-in Portal"
        subtitle="Authenticate to initiate or verify your active delivery shift"
        demoCredentials={{
          email: "rider.alex@trustshift.ai",
          password: "Rider@12345",
          label: "Alex Vance (Verified Rider)",
        }}
        redirectPath="/rider/dashboard"
      />
    </div>
  );
}
