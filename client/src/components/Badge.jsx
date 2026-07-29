import React from "react";
import { TIER_COLORS } from "../utils.js";

export function Badge({ tier, t, variant, children, className = "" }) {
  if (variant) {
    const isDestructive = variant === "destructive";
    const baseStyle = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border uppercase transition-colors select-none";
    const variantStyle = isDestructive
      ? "border-red-500/40 text-red-400 bg-red-500/15 shadow-sm shadow-red-500/10"
      : "border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-sm shadow-cyan-500/10";
    return (
      <span className={`${baseStyle} ${variantStyle} ${className}`}>
        {children}
      </span>
    );
  }

  const colors = t ? TIER_COLORS(t) : {};
  const c = colors[tier] || (t ? t.text2 : "#8a9ab0");
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono border uppercase ${className}`}
      style={{ color: c, borderColor: `${c}30`, background: `${c}12` }}
    >
      {tier || children}
    </span>
  );
}
