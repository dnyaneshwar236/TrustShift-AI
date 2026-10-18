"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  UserCheck,
  Camera,
  PenTool,
  Clock,
  History,
  Lock,
  LifeBuoy,
  Users,
  AlertTriangle,
  Radio,
  FileText,
  BarChart3,
  ScrollText,
  Settings,
  Building,
  Sliders,
  Cpu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "rider";

  // Build navigation items based on role
  const riderLinks = [
    { href: "/rider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/rider/shift", label: "Shift & Check-in", icon: Clock },
    { href: "/rider/identity-verification", label: "Selfie Verification", icon: Camera },
    { href: "/rider/trustmark", label: "TrustMark Signature", icon: PenTool },
    { href: "/rider/onboarding", label: "Onboarding Wizard", icon: UserCheck },
    { href: "/rider/verification-history", label: "Security History", icon: History },
    { href: "/rider/security", label: "Devices & 2FA", icon: Lock },
    { href: "/rider/recovery", label: "Account Recovery", icon: LifeBuoy },
  ];

  const managerLinks = [
    { href: "/manager/dashboard", label: "Operations Overview", icon: LayoutDashboard },
    { href: "/manager/incidents", label: "Incident Center", icon: AlertTriangle },
    { href: "/manager/riders", label: "Rider Directory", icon: Users },
    { href: "/manager/sessions", label: "Active Sessions", icon: Radio },
    { href: "/manager/reports", label: "PDF Reports", icon: FileText },
    { href: "/manager/analytics", label: "Analytics & Fairness", icon: BarChart3 },
    { href: "/manager/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/manager/settings", label: "Manager Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Platform Overview", icon: LayoutDashboard },
    { href: "/admin/managers", label: "Operations Leads", icon: Users },
    { href: "/admin/branches", label: "Branches & Zones", icon: Building },
    { href: "/admin/riders", label: "Rider Directory", icon: UserCheck },
    { href: "/admin/policies", label: "Continuity Policies", icon: Sliders },
    { href: "/admin/integrations", label: "Provider Status", icon: Cpu },
    { href: "/admin/audit-logs", label: "Enterprise Audit Logs", icon: ScrollText },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
  ];

  let links = riderLinks;
  if (role === "manager") links = managerLinks;
  else if (role === "admin") links = adminLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 bg-slate-50/50">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
              TrustShift AI
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                PRO
              </span>
            </h1>
            <p className="text-[10px] font-medium text-slate-500">Identity Continuity Engine</p>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Logged Role:</span>
          <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            {role}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span>Engine Rule</span>
            <span className="font-mono text-slate-600 font-semibold">v1.4</span>
          </div>
          <p className="text-[10px] leading-tight text-slate-400">
            Explainable AI with zero biometric storage in plain application tables.
          </p>
        </div>
      </aside>
    </>
  );
}
