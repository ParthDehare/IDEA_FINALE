import React from "react";
import { Card } from "./Card.jsx";

// Custom lightweight SVG Sparkline component with a live pulsing dot at the end
function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null;
  
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;
  
  const width = 85;
  const height = 28;
  const padding = 3;
  
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 4) + 2;
    const y = height - padding - ((p - min) / range) * (height - 2 * padding);
    return { x, y };
  });
  
  const pathData = coords.reduce((acc, c, i) => {
    return i === 0 ? `M ${c.x},${c.y}` : `${acc} L ${c.x},${c.y}`;
  }, "");

  // Area path closing to the bottom to create gradient fill
  const areaData = `${pathData} L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`;
  const gradientId = `spark-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const lastCoord = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <style>{`
          @keyframes spark-pulse {
            0% { r: 2px; opacity: 0.8; }
            100% { r: 6.5px; opacity: 0; }
          }
          .spark-pulse-dot {
            animation: spark-pulse 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }
        `}</style>
      </defs>
      <path d={areaData} fill={`url(#${gradientId})`} />
      <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Pulse Dot at the end of the sparkline */}
      <circle cx={lastCoord.x} cy={lastCoord.y} r="4.5" fill={color} className="spark-pulse-dot" style={{ transformOrigin: `${lastCoord.x}px ${lastCoord.y}px` }} />
      <circle cx={lastCoord.x} cy={lastCoord.y} r="2" fill="#ffffff" />
    </svg>
  );
}

export function KpiCard({ title, value, color, t, trend, trendDirection = "up", icon: Icon, sparkPoints = [10, 15, 12, 18, 14, 22] }) {
  const isUp = trendDirection === "up";
  const isDown = trendDirection === "down";
  const isOrange = trendDirection === "up-orange";
  
  let trendColor = t.green;
  if (isDown) trendColor = t.cyan;
  if (isOrange) trendColor = t.amber;
  if (trendDirection === "up-red") trendColor = t.red;

  const isPositive = isUp || isOrange || trendDirection === "up-red";

  return (
    <Card t={t} className="!p-4.5 overflow-hidden relative border transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between h-[125px] group">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 group-hover:h-[4px]" style={{ background: color }} />
      
      {/* Top row: Icon and Title */}
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 max-w-[80%] leading-tight">
          {title}
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
               style={{ background: `${color}12`, color }}>
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Middle row: Large Value */}
      <div className="text-2xl font-bold font-mono tracking-tight leading-none mt-2" 
           style={{ color: t.text }}>
        {value}
      </div>

      {/* Bottom row: Trend and Sparkline */}
      <div className="flex items-end justify-between mt-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg" 
             style={{ 
               color: trendColor, 
               background: `${trendColor}12`
             }}>
          <span>{isPositive ? "▲" : "▼"}</span>
          <span>{trend}</span>
        </div>
        <div className="h-7 mb-0.5 flex items-center">
          <Sparkline points={sparkPoints} color={color} />
        </div>
      </div>
    </Card>
  );
}
