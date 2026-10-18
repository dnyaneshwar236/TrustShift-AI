"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Building2,
  Menu,
  Shield,
  CheckCheck,
  AlertOctagon,
  FileText
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, NotificationItem } from "@/lib/api";
import { DemoScenarioPanel } from "@/components/demo/DemoScenarioPanel";

export function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getMyNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.is_read).length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // Construct breadcrumbs from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const url = "/" + pathParts.slice(0, index + 1).join("/");
    return {
      label: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      url,
    };
  });

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>{user?.branch_name || user?.organization_name || "TrustShift Operations"}</span>
            </div>
            <span>/</span>
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={b.url}>
                {idx > 0 && <span>/</span>}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? "font-semibold text-slate-900"
                      : "text-slate-500 hover:text-slate-800"
                  }
                >
                  {b.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Interactive Demo Panel Trigger */}
          <button
            type="button"
            onClick={() => setShowDemoPanel(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            <span className="hidden md:inline">Demo Scenarios (A - G)</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-100">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs space-y-1 hover:bg-slate-50 transition-colors ${
                          !n.is_read ? "bg-indigo-50/40" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold ${
                              n.severity === "critical"
                                ? "text-rose-600"
                                : n.severity === "high"
                                ? "text-orange-600"
                                : "text-slate-900"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{n.message}</p>
                        {n.incident_id && (
                          <Link
                            href={`/manager/incidents/${n.incident_id}`}
                            onClick={() => setShowNotifications(false)}
                            className="inline-block pt-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                          >
                            Investigate Incident &rarr;
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.email ? user.email.slice(0, 2).toUpperCase() : "TS"}
              </div>
              <div className="hidden sm:block text-xs">
                <span className="font-semibold text-slate-900 block truncate max-w-[130px]">
                  {user?.legal_name || user?.email}
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  {user?.role}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs divide-y divide-slate-100 animate-in fade-in-50 duration-100">
                <div className="px-3 py-2">
                  <p className="font-semibold text-slate-900 truncate">{user?.legal_name || user?.email}</p>
                  <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 uppercase tracking-wider px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  {user?.role === "rider" && (
                    <Link
                      href="/rider/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 font-medium"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      My Profile
                    </Link>
                  )}
                  {user?.role === "manager" && (
                    <Link
                      href="/manager/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 font-medium"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      Manager Settings
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link
                      href="/admin/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 font-medium"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      Admin Settings
                    </Link>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 font-medium text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Demo drawer */}
      <DemoScenarioPanel
        isOpen={showDemoPanel}
        onClose={() => setShowDemoPanel(false)}
        onScenarioExecuted={() => {
          fetchNotifications();
        }}
      />
    </>
  );
}
