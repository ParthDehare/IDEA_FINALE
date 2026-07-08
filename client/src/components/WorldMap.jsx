import React, { useState } from "react";
import { INDIA_STATES_PATHS } from "./IndiaMapPaths";
import { useAppStore } from "../store";

const BRANCH_COORDINATES = {
  BR_01: { name: "Mumbai South BR_01", x: 130, y: 460 },
  BR_02: { name: "Delhi Central BR_02", x: 195, y: 215 },
  BR_03: { name: "Kolkata East BR_03", x: 390, y: 330 },
  BR_04: { name: "Chennai South BR_04", x: 230, y: 600 },
  BR_05: { name: "Bengaluru West BR_05", x: 170, y: 580 },
  BR_06: { name: "Hyderabad Central BR_06", x: 210, y: 510 },
  BR_07: { name: "Pune West BR_07", x: 150, y: 480 },
  BR_08: { name: "Ahmedabad North BR_08", x: 90, y: 370 },
  BR_09: { name: "Jaipur North BR_09", x: 150, y: 250 },
  BR_10: { name: "Lucknow East BR_10", x: 260, y: 240 },
  BR_11: { name: "Patna East BR_11", x: 330, y: 260 },
  BR_12: { name: "Bhopal Central BR_12", x: 220, y: 350 },
  BR_13: { name: "Guwahati Northeast BR_13", x: 500, y: 260 },
  BR_14: { name: "Srinagar North BR_14", x: 180, y: 80 },
  BR_15: { name: "Kochi South BR_15", x: 160, y: 650 },
  BR_16: { name: "Visakhapatnam Southeast BR_16", x: 270, y: 490 },
  BR_17: { name: "Chandigarh North BR_17", x: 185, y: 160 },
  BR_18: { name: "Indore Central BR_18", x: 180, y: 370 },
  BR_19: { name: "Nagpur Central BR_19", x: 230, y: 410 },
  BR_20: { name: "Bhubaneswar East BR_20", x: 330, y: 420 },
};

export default function WorldMap({ theme, t, scoredTxns = [], confirmedIncidents = [], falseAlarms = [] }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Access global store actions and state
  const setPage = useAppStore((s) => s.setPage);
  const setProfileSearch = useAppStore((s) => s.setProfileSearch);
  const employeeMetadata = useAppStore((s) => s.employeeMetadata) || {};

  // Compute dynamic hotspots from confirmed/flagged fraud txns
  const safeBuffer = Array.isArray(scoredTxns) ? scoredTxns : [];
  
  const criticalTxns = safeBuffer.filter(tx => {
    if (!tx || !tx.emp_id) return false;
    const empIdUpper = tx.emp_id.toUpperCase();
    
    // Check if marked as false alarm by auditor
    const isFalseAlarm = falseAlarms.some(fa => fa.toUpperCase() === empIdUpper);
    if (isFalseAlarm) return false;
    
    // Check if confirmed fraud or ground truth fraud
    const isConfirmed = confirmedIncidents.some(ci => ci.emp_id.toUpperCase() === empIdUpper);
    const isGroundTruthFraud = tx.is_fraud_flag === 1 || tx.is_fraud_flag === '1' || tx.is_fraud_flag === true;
    
    return isGroundTruthFraud || isConfirmed;
  });

  const branchAlerts = {};
  criticalTxns.forEach(tx => {
    const branchId = tx.branch_id;
    if (!branchId || !BRANCH_COORDINATES[branchId]) return;
    
    if (!branchAlerts[branchId]) {
      branchAlerts[branchId] = {
        id: branchId,
        name: BRANCH_COORDINATES[branchId].name,
        x: BRANCH_COORDINATES[branchId].x,
        y: BRANCH_COORDINATES[branchId].y,
        count: 0,
        maxScore: 0,
        employees: new Set()
      };
    }
    branchAlerts[branchId].count++;
    branchAlerts[branchId].maxScore = Math.max(branchAlerts[branchId].maxScore, tx.cbsi);
    if (tx.emp_id) {
      branchAlerts[branchId].employees.add(tx.emp_id);
    }
  });

  const hotspots = Object.values(branchAlerts).map(b => ({
    ...b,
    risk: b.maxScore >= 90 ? "Critical" : "High",
    employees: Array.from(b.employees)
  }));

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleBranchClick = (branchId) => {
    let foundEmpId = null;
    
    // 1. Try to find a matching employee in metadata
    if (employeeMetadata) {
      const match = Object.entries(employeeMetadata).find(
        ([empId, meta]) => meta.branch_id === branchId
      );
      if (match) {
        foundEmpId = match[0];
      }
    }
    
    // 2. Try to find a matching employee in transactions
    if (!foundEmpId && Array.isArray(scoredTxns)) {
      const match = scoredTxns.find((tx) => tx.branch_id === branchId);
      if (match) {
        foundEmpId = match.emp_id;
      }
    }
    
    if (foundEmpId) {
      setProfileSearch(foundEmpId);
      setPage("profile");
    }
  };

  const handleHotspotClick = (hs) => {
    if (hs.employees && hs.employees.length > 0) {
      setProfileSearch(hs.employees[0]);
      setPage("profile");
    } else {
      handleBranchClick(hs.id);
    }
  };

  const isDark = theme === "dark";
  const mapBg = isDark ? "radial-gradient(circle at 50% 50%, #13141f, #0b0c10)" : "radial-gradient(circle at 50% 50%, #ffffff, #f3f4f6)";
  const continentColor = isDark ? "#1c1e2d" : "#e2e8f0";
  const continentStroke = isDark ? "#2d3149" : "#cbd5e1";
  const gridColor = isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)";
  const glowShadow = isDark
    ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)"
    : "0 4px 20px -2px rgba(0, 0, 0, 0.05)";

  const cursorStyle = zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default";

  return (
    <div className="relative w-full h-[330px] rounded-2xl border transition-all duration-300 select-none overflow-hidden"
         style={{ 
           background: mapBg, 
           borderColor: t.border,
           boxShadow: glowShadow
         }}>
      {/* Map title header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[10px] font-bold tracking-wider font-mono uppercase" style={{ color: t.text }}>
            India Fraud Hotspots
          </span>
          <span className="text-[10px] px- rounded-xl font-mono font-semibold border" 
                style={{ background: t.cardAlt, borderColor: t.border, color: t.text2 }}>
            Live Stream Alerts ({hotspots.length})
          </span>
        </div>
      </div>

      {/* Map SVG Wrapper */}
      <div 
        className="w-full h-full overflow-hidden"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 612 696"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)` }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke={gridColor} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="612" height="696" fill="url(#grid)" />

          {/* India State Boundaries */}
          <g>
            {INDIA_STATES_PATHS.map((state) => (
              <path
                key={state.id}
                id={state.id}
                name={state.name}
                d={state.d}
                fill={continentColor}
                stroke={continentStroke}
                strokeWidth="1.2"
                className="transition-colors duration-300 hover:fill-indigo-500/10"
              />
            ))}
          </g>

          {/* Default Branch Status Indicators (Connected nodes) */}
          {Object.entries(BRANCH_COORDINATES).map(([id, info]) => {
            const hasAlert = branchAlerts[id];
            if (hasAlert) return null; // Let the alert hotspot override this
            
            // Suppress/subdue green indicators when they are close to active fraud hotspots
            const nearHotspot = hotspots.some(hs => Math.hypot(hs.x - info.x, hs.y - info.y) < 35);
            const dotOpacity = nearHotspot ? 0.05 : 0.55;
            const glowOpacity = nearHotspot ? 0.01 : 0.2;
            
            return (
              <g key={`branch-${id}`}
                 className="cursor-pointer hover:opacity-100 transition-opacity"
                 onClick={() => handleBranchClick(id)}>
                <circle cx={info.x} cy={info.y} r="3" fill={t.green} opacity={dotOpacity} />
                {!nearHotspot && (
                  <circle cx={info.x} cy={info.y} r="7" fill={t.green} opacity={glowOpacity}>
                    <animate attributeName="r" values="3;9;3" dur="4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.05;0.25;0.05" dur="4s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Dynamic Critical Hotspots */}
          {hotspots.map((hs) => {
            const isHovered = activeHotspot === hs.id;
            return (
              <g key={`hotspot-${hs.id}`} 
                 className="cursor-pointer"
                 onMouseEnter={() => setActiveHotspot(hs.id)}
                 onMouseLeave={() => setActiveHotspot(null)}
                 onClick={() => handleHotspotClick(hs)}>
                {/* Outer pulsing ring */}
                <circle cx={hs.x} cy={hs.y} r={isHovered ? 24 : 12} fill={t.red} opacity={isHovered ? 0.55 : 0.3} className="transition-all duration-300">
                  <animate attributeName="r" values="6;20;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0.6;0.15" dur="2s" repeatCount="indefinite" />
                </circle>
                
                {/* Second glow ring */}
                <circle cx={hs.x} cy={hs.y} r={isHovered ? 12 : 6} fill={t.red} opacity="0.8" />
                
                {/* Core point */}
                <circle cx={hs.x} cy={hs.y} r="3" fill="#ffffff" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating tooltip for hotspot */}
      {activeHotspot && (() => {
        const hs = hotspots.find(h => h.id === activeHotspot);
        if (!hs) return null;
        return (
          <div className="absolute bottom-4 right-4 backdrop-blur-md border px-3.5 py-2.5 rounded-xl text-xs font-mono shadow-xl z-20 transition-all duration-200"
               style={{ background: `${t.cardAlt}f0`, borderColor: t.red }}>
            <div className="font-bold mb-1 flex items-center gap-1.5" style={{ color: t.text }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              {hs.name}
            </div>
            <div className="flex flex-col gap-0.5 text-[10px]" style={{ color: t.text2 }}>
              <div><span className="font-semibold" style={{ color: t.red }}>Risk Level:</span> {hs.risk}</div>
              <div><span className="font-semibold" style={{ color: t.red }}>Active Alerts:</span> {hs.count}</div>
              {hs.employees.length > 0 && (
                <div className="mt-1 max-w-[180px] truncate" style={{ color: t.text2 }}>
                  <span className="font-semibold" style={{ color: t.red }}>Flagged:</span> {hs.employees.join(", ")}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-7.5 h-7.5 rounded-xl border flex items-center justify-center font-bold font-mono text-sm cursor-pointer shadow-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
          style={{ background: t.card, borderColor: t.border, color: t.text }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7.5 h-7.5 rounded-xl border flex items-center justify-center font-bold font-mono text-sm cursor-pointer shadow-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
          style={{ background: t.card, borderColor: t.border, color: t.text }}
        >
          -
        </button>
      </div>
    </div>
  );
}
