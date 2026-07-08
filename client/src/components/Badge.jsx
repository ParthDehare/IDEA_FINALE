import React from "react";
import { TIER_COLORS } from "../utils.js";

export function Badge({ tier, t }) {
  const colors = TIER_COLORS(t);
  const c = colors[tier] || t.text2;
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono border uppercase"
      style={{ color: c, borderColor: `${c}30`, background: `${c}12` }}
    >
      {tier}
    </span>
  );
}
