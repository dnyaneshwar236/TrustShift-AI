"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, Info } from "lucide-react";

interface TrustScoreBadgeProps {
  score: number;
  band?: "high_trust" | "caution" | "elevated_risk" | "critical" | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showRecommendation?: boolean;
}

export function TrustScoreBadge({
  score,
  band,
  size = "md",
  showLabel = true,
  showRecommendation = false,
}: TrustScoreBadgeProps) {
  // Compute band if not explicitly provided
  let computedBand = band;
  if (!computedBand) {
    if (score >= 80) computedBand = "high_trust";
    else if (score >= 60) computedBand = "caution";
    else if (score >= 50) computedBand = "elevated_risk";
    else computedBand = "critical";
  }

  const config = {
    high_trust: {
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
      label: "High Trust",
      icon: ShieldCheck,
      color: "text-emerald-600",
    },
    caution: {
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
      label: "Caution",
      icon: AlertTriangle,
      color: "text-amber-600",
    },
    elevated_risk: {
      bg: "bg-orange-50 text-orange-800 border-orange-200",
      dot: "bg-orange-500",
      label: "Elevated Risk",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    critical: {
      bg: "bg-rose-50 text-rose-800 border-rose-200",
      dot: "bg-rose-500",
      label: "Critical Risk",
      icon: AlertOctagon,
      color: "text-rose-600",
    },
  }[computedBand] || {
    bg: "bg-slate-50 text-slate-800 border-slate-200",
    dot: "bg-slate-500",
    label: "Evaluating",
    icon: Info,
    color: "text-slate-600",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-sm font-semibold",
    lg: "px-3.5 py-1.5 text-base font-bold",
  }[size];

  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} shadow-xs transition-colors`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot} animate-pulse`} />
      <span>{score.toFixed(1)}</span>
      {showLabel && (
        <>
          <span className="opacity-40">|</span>
          <span className="font-medium text-xs uppercase tracking-wider">{config.label}</span>
        </>
      )}
    </div>
  );
}
