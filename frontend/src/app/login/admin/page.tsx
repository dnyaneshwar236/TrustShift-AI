"use client";

import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <LoginForm
        roleHint="admin"
        title="System Administration"
        subtitle="Configure risk engine thresholds, branch policies & audit logs"
        demoCredentials={{
          email: "admin@trustshift.ai",
          password: "Admin@12345",
          label: "Company Administrator",
        }}
        redirectPath="/admin/dashboard"
      />
    </div>
  );
}
