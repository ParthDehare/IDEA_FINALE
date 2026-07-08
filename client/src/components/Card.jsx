import React from "react";

export function Card({ children, t, className = "", style = {}, ...props }) {
  const isDark = t.bg === "#0b0c10" || t.card === "#13141f";
  const glowShadow = isDark
    ? "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 4px 15px -5px rgba(0, 0, 0, 0.5)"
    : "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -5px rgba(0, 0, 0, 0.08)";

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 ${className}`}
      style={{
        background: t.card,
        borderColor: t.border,
        boxShadow: glowShadow,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
