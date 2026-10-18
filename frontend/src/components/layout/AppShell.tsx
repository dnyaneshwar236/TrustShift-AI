"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/lib/auth-context";
import { RefreshCw } from "lucide-react";

export function AppShell({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: ("rider" | "manager" | "admin")[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Verifying session security credentials...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-900">Session Required</h2>
        <p className="text-sm text-slate-600 max-w-sm">
          You need an active authenticated session to access this security portal.
        </p>
        <a
          href="/login"
          className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
        >
          Go to Login Portal
        </a>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
          🔒
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-sm">
          Your account role (<b className="uppercase">{user.role}</b>) does not have authorization to view this area.
        </p>
        <a
          href={user.role === "rider" ? "/rider/dashboard" : "/manager/dashboard"}
          className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
        >
          Return to Authorized Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
