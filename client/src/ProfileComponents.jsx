import React, { useState, useEffect } from "react";
import { Play, BrainCircuit, ShieldAlert, GitMerge } from "lucide-react";
import { authStore } from "./authStore";
import { fetchWithAuth } from "./apiService";
import { motion, AnimatePresence } from "framer-motion";

// --- 1. Forensic Timeline ("CCTV Playback") ---
export function ForensicTimeline({ events = [], t, theme }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  // Show real events as-is; only use demo fallback when no events exist at all
  let displayEvents = events;
  if (events.length === 0) {
    displayEvents = [
      { time: "02:14 AM", text: "Off-hours system login detected", tier: "WATCH" },
      { time: "02:17 AM", text: "Escalated DB_GRANT_ACCESS privileges", tier: "HIGH" },
      { time: "02:22 AM", text: "Initiated SYSTEM_BULK_EXPORT", tier: "CRITICAL" },
      { time: "02:24 AM", text: "Transfer of Rs.8.5M via RTGS", tier: "CRITICAL" }
    ];
  }

  useEffect(() => {
    if (isPlaying && visibleCount < displayEvents.length) {
      const timer = setTimeout(() => setVisibleCount((v) => v + 1), 600);
      return () => clearTimeout(timer);
    } else if (visibleCount === displayEvents.length) {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  }, [isPlaying, visibleCount, displayEvents.length]);

  const handlePlay = () => {
    setVisibleCount(0);
    setIsPlaying(true);
  };

  const shadowVal = theme === "dark"
    ? "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 4px 15px -5px rgba(0, 0, 0, 0.5)"
    : "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -5px rgba(0, 0, 0, 0.08)";

  return (
    <div 
      className="p-5 rounded-xl border transition-all duration-300"
      style={{ background: t.card, borderColor: t.border, boxShadow: shadowVal }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13px] font-bold uppercase tracking-[2px]" style={{ color: t.text2 }}>Forensic Timeline</h3>
        <button 
          onClick={handlePlay}
          disabled={isPlaying}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#E50914] text-white text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50 cursor-pointer border-none shadow-sm"
        >
          <Play size={12} fill="currentColor" /> {isPlaying ? "Simulating..." : "Play CCTV"}
        </button>
      </div>

      <div className="pl-4 border-l-2 space-y-4 py-2 relative" style={{ borderColor: t.border }}>
        <AnimatePresence>
          {displayEvents.slice(0, visibleCount === 0 && !isPlaying ? displayEvents.length : visibleCount).map((ev, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div 
                className={`absolute -left-[23px] w-3 h-3 rounded-full border-[3px] ${
                  ev.tier === 'CRITICAL' ? 'bg-[#E50914]' : ev.tier === 'HIGH' ? 'bg-[#FFB300]' : 'bg-[#00B4D8]'
                }`} 
                style={{ borderColor: t.card }}
              />
              <div className="text-xs font-mono mb-0.5" style={{ color: t.text2 }}>{ev.time}</div>
              <div className="text-sm font-semibold" style={{ color: t.text }}>{ev.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- 2. Glass-Box Explainability Engine ---
export function GlassBoxEngine({ score = 100, emp_id = "EMP_1024", context = null, t, theme }) {
  const isCritical = score > 75;
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError("");
    setExplanation("");

    const payload = {
      emp_id,
      cbsi: score,
      action_type: context?.action_type,
      amount: context?.amount,
      transfer_channel: context?.transfer_channel,
      timestamp: context?.timestamp,
      remarks: context?.raw_complaint_text || context?.hr_remark_text || "",
      transaction_id: context?.transaction_id
    };

    fetchWithAuth(`api/explain/${emp_id}`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isActive) return;
        setExplanation(data?.explanation || "No explanation available.");
      })
      .catch((err) => {
        if (!isActive) return;
        setError("Failed to load AI explanation.");
        console.error("Explain API error:", err);
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [emp_id, score, context?.transaction_id, context?.timestamp]);

  const shadowVal = theme === "dark"
    ? "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 4px 15px -5px rgba(0, 0, 0, 0.5)"
    : "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -5px rgba(0, 0, 0, 0.08)";

  const accentColor = isCritical ? t.red : t.teal;
  const innerBg = isCritical 
    ? (theme === "dark" ? "#231010" : "#fee2e2") 
    : (theme === "dark" ? "#102320" : "#ccfbf1");

  const boxBg = isCritical
    ? (theme === "dark" ? "#140505" : "#fef2f2")
    : (theme === "dark" ? "#051410" : "#f0fdfa");

  return (
    <div 
      className="p-5 rounded-xl border transition-all duration-300"
      style={{ background: innerBg, borderColor: accentColor, boxShadow: shadowVal }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 
          className="text-[13px] font-bold uppercase tracking-[2px] flex items-center gap-2"
          style={{ color: accentColor }}
        >
          <BrainCircuit size={16} /> AI Decision Logic
        </h3>
      </div>
      <div 
        className="min-h-[80px] p-4 rounded-md border relative overflow-hidden"
        style={{ background: boxBg, borderColor: `${accentColor}80` }}
      >
        {loading ? (
          <p className="text-sm font-mono leading-relaxed" style={{ color: t.text2 }}>
            Loading AI explanation...
          </p>
        ) : error ? (
          <p className="text-sm font-mono leading-relaxed text-red-500">{error}</p>
        ) : (
          <p className="text-sm font-mono leading-relaxed" style={{ color: t.text }}>
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}

// --- 3. Blast Radius (Contagion Risk) ---
export function BlastRadius({ targetId, peerId, sharedIp, t, theme }) {
  if (!peerId) return null;

  const shadowVal = theme === "dark"
    ? "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 4px 15px -5px rgba(0, 0, 0, 0.5)"
    : "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -5px rgba(0, 0, 0, 0.08)";

  return (
    <div 
      className="p-5 rounded-xl border transition-all duration-300"
      style={{ background: t.card, borderColor: t.red, boxShadow: shadowVal }}
    >
      <div className="flex items-center gap-2 mb-4" style={{ color: t.red }}>
        <ShieldAlert size={18} />
        <h3 className="text-[13px] font-bold uppercase tracking-[2px]">Peer Risk Assessment</h3>
      </div>

      <div className="space-y-3">
        <div 
          className="p-3 rounded-lg border flex items-start gap-3"
          style={{ background: t.cardAlt, borderColor: t.border }}
        >
          <GitMerge size={16} className="text-[#FFB300] mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: t.text }}>Warning: Lateral Movement Risk</div>
            <div className="text-xs leading-tight" style={{ color: t.text2 }}>
              <span className="font-mono" style={{ color: t.text }}>{targetId}</span> shares the same IP address ({sharedIp}) with <span className="font-mono" style={{ color: t.text }}>{peerId}</span>. Possible shared terminal or credential compromise.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 4. ShapSimulator (CBSI WhyScore) ---
export function ShapSimulator({ initialScore = 50, isCritical = false, t, theme }) {
  const [vol, setVol] = useState(isCritical ? 85 : 20);
  const [time, setTime] = useState(isCritical ? 70 : 10);
  const [nlp, setNlp] = useState(isCritical ? 90 : 0);
  const [hops, setHops] = useState(isCritical ? 12 : 2);

  const simScore = Math.min(100, Math.max(0, Math.round((vol * 0.35) + (time * 0.2) + (nlp * 0.3) + (hops * 2.5))));

  const shadowVal = theme === "dark"
    ? "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 4px 15px -5px rgba(0, 0, 0, 0.5)"
    : "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -5px rgba(0, 0, 0, 0.08)";

  const accentColor = isCritical ? t.red : t.teal;
  const innerBg = isCritical 
    ? (theme === "dark" ? "#231010" : "#fee2e2") 
    : (theme === "dark" ? "#102320" : "#ccfbf1");

  return (
    <div 
      className="p-5 rounded-xl border transition-all duration-300"
      style={{ background: innerBg, borderColor: accentColor, boxShadow: shadowVal }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[13px] font-bold uppercase tracking-[2px]" style={{ color: accentColor }}>
          CBSI 'WhyScore' Simulator
        </h3>
      </div>
      
      <div className="flex items-center justify-between gap-8">
        <div className="flex-1 space-y-5">
          <div>
            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2" style={{ color: t.text2 }}>
              <span>Transaction Volume</span>
              <span className="font-mono font-bold" style={{ color: t.text }}>{vol}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={vol} 
              onChange={e=>setVol(Number(e.target.value))} 
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              style={{ background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2" style={{ color: t.text2 }}>
              <span>Time of Day Anomaly</span>
              <span className="font-mono font-bold" style={{ color: t.text }}>{time}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={time} 
              onChange={e=>setTime(Number(e.target.value))} 
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              style={{ background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2" style={{ color: t.text2 }}>
              <span>NLP Risk (Agent 4)</span>
              <span className="font-mono font-bold" style={{ color: t.text }}>{nlp}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={nlp} 
              onChange={e=>setNlp(Number(e.target.value))} 
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              style={{ background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2" style={{ color: t.text2 }}>
              <span>Network Hops (Agent 2)</span>
              <span className="font-mono font-bold" style={{ color: t.text }}>{hops}</span>
            </div>
            <input 
              type="range" min="0" max="20" value={hops} 
              onChange={e=>setHops(Number(e.target.value))} 
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              style={{ background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            />
          </div>
        </div>
        
        <div className="text-center shrink-0 w-32 border-l pl-6 py-2" style={{ borderColor: t.border }}>
          <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: t.text2 }}>Simulated CBSI</div>
          <div className={`text-6xl font-bold font-mono ${simScore > 75 ? 'text-[#E50914]' : simScore > 40 ? 'text-[#FFB300]' : 'text-[#00E676]'}`}>
            {simScore}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5. GNN Threat Node ---
export function GNNThreatNode({ isCritical = false, t, theme }) {
  if (!isCritical) return null;
  const nodeBg = theme === "dark" ? "#231010" : "#fee2e2";
  return (
    <div 
      className="p-4 mb-4 rounded-xl border flex items-center gap-4 animate-pulse"
      style={{ background: nodeBg, borderColor: t.red }}
    >
      <GitMerge size={24} style={{ color: t.red }} />
      <div>
        <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: t.red }}>GNN Structural Anomaly</h4>
        <p className="text-xs" style={{ color: t.text }}>Graph Neural Network detected suspicious peer-to-peer money layering.</p>
      </div>
    </div>
  );
}

// --- 6. Historical Context Node ---
export function HistoricalContext({ emp_id, t, theme }) {
  const [volume, setVolume] = useState(null);
  
  useEffect(() => {
    fetchWithAuth(`api/profile/${emp_id}/history`)
      .then(res => res.json())
      .then(data => setVolume(data.seven_day_average))
      .catch(err => console.error(err));
  }, [emp_id]);

  if (volume === null) return null;

  const shadowVal = theme === "dark"
    ? "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 4px 15px -5px rgba(0, 0, 0, 0.5)"
    : "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -5px rgba(0, 0, 0, 0.08)";
  
  return (
    <div 
      className="p-4 mb-4 rounded-xl border flex items-center justify-between transition-all duration-300"
      style={{ background: t.card, borderColor: t.border, boxShadow: shadowVal }}
    >
      <div>
        <h4 className="font-bold text-[11px] uppercase tracking-wider mb-1" style={{ color: t.teal }}>7-Day Moving Avg Volume</h4>
        <p className="text-xs font-mono" style={{ color: t.text2 }}>Redis Historical State</p>
      </div>
      <div className="font-mono text-xl font-bold tracking-widest" style={{ color: t.text }}>
        ₹{Math.round(volume).toLocaleString()}
      </div>
    </div>
  );
}
