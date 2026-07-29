import React, { useState, useEffect } from "react";
import { Play, BrainCircuit, ShieldAlert, GitMerge } from "lucide-react";
import { authStore } from "./authStore";
import { fetchWithAuth } from "./apiService";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./components/Badge.jsx";

// --- 1. Forensic Timeline ("CCTV Playback") ---
export function ForensicTimeline({ events = [], t, theme }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  // Show real events as-is; only use demo fallback when no events exist at all
  let displayEvents = events;
  if (events.length === 0) {
    displayEvents = [
      {
        time: "02:14 AM",
        action: "Initiate",
        tag: "RTGS_OUTWARD",
        tagVariant: "outline",
        amount: "Rs. 661,361.98",
        subtext: "Target A/c: XXXXX9082 (ABC Traders)",
        tier: "WATCH"
      },
      {
        time: "02:17 AM",
        action: "Approve",
        tag: "LOAN_DISBURSEMENT",
        tagVariant: "outline",
        amount: "Rs. 654,855.65",
        subtext: "Sanction ID: LN-2026-88",
        tier: "HIGH"
      },
      {
        time: "02:22 AM",
        action: "Override",
        tag: "LIMIT_ENHANCEMENT",
        tagVariant: "destructive",
        amount: "Rs. 50,000,000",
        subtext: "Bypass Reason: System Flag (CIBIL Low)",
        tier: "CRITICAL"
      },
      {
        time: "02:24 AM",
        action: "Transfer",
        tag: "SWIFT_WIRE",
        tagVariant: "destructive",
        amount: "Rs. 8,500,000.00",
        subtext: "Beneficiary: Offshore Holding Entity (Cayman Islands)",
        tier: "CRITICAL"
      }
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

      <div className="max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="pl-4 border-l-2 space-y-5 py-2 relative ml-1" style={{ borderColor: t.border }}>
          <AnimatePresence>
            {displayEvents.slice(0, visibleCount === 0 && !isPlaying ? displayEvents.length : visibleCount).map((ev, i) => {
              let action = ev.action;
              let tag = ev.tag;
              let tagVariant = ev.tagVariant || (ev.tier === 'CRITICAL' || ev.tier === 'HIGH' ? 'destructive' : 'outline');
              let amount = ev.amount;
              let subtext = ev.subtext;

              if (!action && ev.text) {
                const parts = ev.text.split(" - ");
                action = parts[0] || "Execute";
                amount = parts[1] || "";
                tag = action.toUpperCase().replace(/[^A-Z0-9]/g, "_") || "SYSTEM_AUDIT";
                subtext = ev.subtext || `Target A/c: ACC_${Math.floor(Math.random() * 8000 + 1000)}`;
              }

              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative group"
                >
                  <div 
                    className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-[3px] transition-transform group-hover:scale-125 ${
                      ev.tier === 'CRITICAL' ? 'bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.6)]' : ev.tier === 'HIGH' ? 'bg-[#FFB300] shadow-[0_0_8px_rgba(255,179,0,0.6)]' : 'bg-[#00B4D8] shadow-[0_0_8px_rgba(0,180,216,0.6)]'
                    }`} 
                    style={{ borderColor: t.card }}
                  />
                  <div className="text-xs font-mono mb-1 tracking-wider font-medium" style={{ color: t.text2 }}>{ev.time}</div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold leading-relaxed" style={{ color: t.text }}>
                    <span>{action}</span>
                    {tag && <Badge variant={tagVariant}>{tag}</Badge>}
                    {amount && <span className="font-mono">{amount.startsWith('-') || amount.startsWith('Rs.') ? amount : `- ${amount}`}</span>}
                  </div>

                  {subtext && (
                    <div className="mt-1.5 text-xs font-mono tracking-tight leading-relaxed space-y-1.5" style={{ color: t.text2 }}>
                      {(() => {
                        if (subtext.includes(" [R") || subtext.includes(" | ") || subtext.includes(". [")) {
                          const parts = subtext.split(/(?=\s*\|\s*\[)|(?=\s*\.\s*\[)|(?=\s*\|\s*(?=[A-Z0-9_]+\]))/g);
                          return parts.map((part, idx) => {
                            const cleaned = part.replace(/^[\s\|\.]+|[\s\|]+$/g, "").trim();
                            if (!cleaned) return null;
                            const isHeader = idx === 0 && !cleaned.startsWith("[R");
                            return (
                              <div 
                                key={idx} 
                                className={`flex items-start gap-1.5 rounded p-1 ${isHeader ? 'font-bold text-gray-200 bg-gray-800/40 pb-1.5 border-b border-gray-700/50' : 'pl-2 hover:bg-gray-800/30 transition-colors'}`}
                              >
                                {!isHeader && <span className="text-[#E50914] font-bold select-none mt-0.5">•</span>}
                                <span className="flex-1 break-words">{cleaned}</span>
                              </div>
                            );
                          });
                        }
                        if (subtext.includes(" | ") || subtext.includes("\n")) {
                          return subtext.split(/\|\s*|\n/).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              {idx > 0 && <span className="text-cyan-400 font-bold select-none">•</span>}
                              <span>{item.trim()}</span>
                            </div>
                          ));
                        }
                        return <div>{subtext}</div>;
                      })()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function renderStructuredExplanation(rawText, empId = "SUBJECT", t) {
  if (!rawText) return null;
  const str = String(rawText);

  const ctxParts = str.split(/\bContext:\s*/i);
  const mainBody = (ctxParts[0] || "").trim();
  const contextText = ctxParts.length > 1 && ctxParts[1].trim() ? `Context: ${ctxParts[1].trim()}` : "";

  let headerReason = mainBody;
  let breachedRules = [];

  if (mainBody.includes("|")) {
    const chunks = mainBody.split("|").map(c => c.trim()).filter(Boolean);
    const firstChunk = chunks[0] || "";
    const ruleMatch = firstChunk.match(/(\[[R|A]\d+_[A-Z0-9_]+\]|\[[A-Z0-9_]{3,}\]\s*[A-Z0-9])/);
    if (ruleMatch && ruleMatch.index > 0) {
      headerReason = firstChunk.substring(0, ruleMatch.index).trim();
      breachedRules = [firstChunk.substring(ruleMatch.index).trim(), ...chunks.slice(1)];
    } else if (chunks.length > 1) {
      headerReason = chunks[0];
      breachedRules = chunks.slice(1);
    } else {
      breachedRules = chunks;
    }
  } else {
    const rulesFound = mainBody.match(/(\[[R|A]\d+_[A-Z0-9_]+\][^|\[]+)/g);
    if (rulesFound && rulesFound.length > 0) {
      const firstPos = mainBody.indexOf(rulesFound[0]);
      if (firstPos > 0) headerReason = mainBody.substring(0, firstPos).trim();
      breachedRules = rulesFound.map(r => r.trim());
    }
  }

  return (
    <div className="space-y-3 text-xs leading-relaxed font-sans">
      <div className="p-2.5 rounded border" style={{ background: t?.card || "#1e293b", borderColor: t?.border || "#334155" }}>
        <div className="font-mono text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: t?.cyan || "#38bdf8" }}>
          Offense Narrative — Executive Summary
        </div>
        <div className="font-semibold mb-1" style={{ color: t?.text || "#f8fafc" }}>
          Subject personnel <span className="font-mono text-amber-400">{empId}</span> executed high-risk activities flagged under <span className="text-red-400">UNAUTHORIZED FINANCIAL EXFILTRATION &amp; EMBEZZLEMENT ATTEMPT</span>.
        </div>
        <div style={{ color: t?.text2 || "#94a3b8" }}>
          <b style={{ color: t?.text || "#f8fafc" }}>Primary AI Detection Reason:</b> {headerReason || str}
        </div>
      </div>

      {breachedRules.length > 0 && (
        <div className="p-2.5 rounded border" style={{ background: t?.card || "#1e293b", borderColor: t?.border || "#334155" }}>
          <div className="font-mono text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: t?.red || "#f87171" }}>
            Regulatory &amp; System Breaches ({breachedRules.length})
          </div>
          <ul className="space-y-1.5 list-disc pl-4" style={{ color: t?.text || "#f8fafc" }}>
            {breachedRules.map((rule, idx) => {
              const parts = rule.split("]");
              const tag = parts.length > 1 ? parts[0] + "]" : "";
              const body = parts.length > 1 ? parts.slice(1).join("]").trim() : rule;
              return (
                <li key={idx}>
                  {tag && <b className="font-mono text-amber-400 mr-1">{tag}</b>}
                  <span>{body}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {contextText && (
        <div className="p-2.5 rounded border border-dashed" style={{ background: t?.cardAlt || "#0f172a", borderColor: t?.border || "#334155" }}>
          <div className="font-mono text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: t?.amber || "#fbbf24" }}>
            AI Risk Context &amp; Escalation Multipliers
          </div>
          <div className="italic" style={{ color: t?.text2 || "#94a3b8" }}>
            {contextText}
          </div>
        </div>
      )}
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
          renderStructuredExplanation(explanation, emp_id, t)
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
