"use client";

import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function ManagerLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <LoginForm
        roleHint="manager"
        title="Operations Manager Console"
        subtitle="Manage fleet sessions, investigate incidents & review evidence"
        demoCredentials={{
          email: "manager@trustshift.ai",
          password: "Manager@12345",
          label: "Operations Lead (Manager)",
        }}
        redirectPath="/manager/dashboard"
      />
    </div>
  );
}
