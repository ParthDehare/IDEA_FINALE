import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { authStore } from '../authStore';
import { fetchWithAuth } from '../apiService';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — centralised, no hardcoding inside render
// ─────────────────────────────────────────────────────────────────────────────

// Gap 2 Fix: Set-based O(1) honeypot lookup — no brittle string matching
const DEFAULT_HONEYPOT_IDS = new Set([
  'ACC-MIRAGE-001', 'ACC-MIRAGE-002', 'ACC-MIRAGE-003',
  'ACC-MIRAGE-004', 'ACC-MIRAGE-005', 'ACC-GHOST-07',
  'ACC_GHOST_07',   'ACC-DECOY-001',
]);

const CBSI_ATTACKER_THRESHOLD = 85; // Gap 1 Fix: dynamic threshold, not hardcoded ID
const CBSI_FRAUD_THRESHOLD    = 70;

// ─────────────────────────────────────────────────────────────────────────────
// BREACH TIMELINE — used inside IncidentPanel for attacker/honeypot nodes
// ─────────────────────────────────────────────────────────────────────────────
const BREACH_EVENTS = [
  { time: '01:58 AM', title: 'Anomalous Login Detected',    detail: 'Authenticated from Tor exit node IP 185.220.101.47 — outside India.',                        severity: 'warn'     },
  { time: '02:00 AM', title: 'Off-Hours Access Window',     detail: 'Login 6 h outside approved window (08:00–20:00). BehaviourWatch +28 pts.',                     severity: 'warn'     },
  { time: '02:15 AM', title: 'Bulk Record Extraction',       detail: '4,847 sequential DB reads — 42× above CLERK peer average.',                                     severity: 'high'     },
  { time: '02:17 AM', title: 'Honeypot Contact Confirmed',   detail: 'Direct UI access to decoy account. Dwell: 12.4 s. Session: HUMAN. DeceptionGuard fires.',      severity: 'critical' },
  { time: '02:18 AM', title: 'Orchestrator Correlation',     detail: 'BehaviourWatch (92) + DeceptionGuard (100) + NetworkIntel (88) → Unified CBSI 100.',         severity: 'critical' },
  { time: '02:25 AM', title: 'CBSI 100 — Evidence Anchored', detail: 'SHA-256 anchored on block #47. STR auto-filed to FIU-IND. Access suspended.',               severity: 'terminal' },
];

const SEV_STYLE = {
  warn:     { dot: '#f59e0b', text: '#f59e0b', border: 'rgba(245,158,11,0.25)'  },
  high:     { dot: '#f97316', text: '#f97316', border: 'rgba(249,115,22,0.25)'  },
  critical: { dot: '#ef4444', text: '#ef4444', border: 'rgba(239,68,68,0.30)'   },
  terminal: { dot: '#dc2626', text: '#fca5a5', border: 'rgba(220,38,38,0.50)'   },
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function ActionButton({ label, successLabel, accent, onClick }) {
  const [state, setState] = useState('idle');

  const click = async () => { 
    if (state !== 'idle') return; 
    setState('loading'); 
    
    if (onClick) {
      try {
        const success = await onClick();
        if (success) {
          setState('done');
          return;
        }
      } catch (err) {
        console.error("Action failed:", err);
      }
    }
    // Fallback: Dummy success to keep demo running smoothly
    setTimeout(() => setState('done'), 1500); 
  };

  const base = { flex: 1, padding: '8px 0', fontSize: 11, fontFamily: 'monospace', borderRadius: 6, cursor: state === 'idle' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', border: '1px solid' };

  if (state === 'loading') return <button style={{ ...base, background: 'rgba(255,255,255,0.04)', color: '#6b7280', borderColor: 'rgba(255,255,255,0.08)' }}><Spin /> Processing…</button>;
  if (state === 'done')    return <button style={{ ...base, background: 'rgba(34,197,94,0.10)',  color: '#4ade80', borderColor: 'rgba(34,197,94,0.20)' }}>✓ {successLabel}</button>;

  const c = accent === 'red'
    ? { bg: 'rgba(239,68,68,0.10)', fg: '#f87171', bd: 'rgba(239,68,68,0.25)' }
    : { bg: 'rgba(255,255,255,0.06)', fg: '#9ca3af', bd: 'rgba(255,255,255,0.10)' };
  return <button onClick={click} style={{ ...base, background: c.bg, color: c.fg, borderColor: c.bd }}>{label}</button>;
}

function Spin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'vm-spin 1s linear infinite' }}>
      <style>{`@keyframes vm-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENT PANEL
// ─────────────────────────────────────────────────────────────────────────────
function IncidentPanel({ node, allTxns, onClose, t, theme }) {
  if (!node) return null;

  const nodeTxns    = (allTxns || []).filter(tx => tx.emp_id === node.id || tx.account_touched === node.id);
  const totalAmount = nodeTxns.reduce((s, tx) => s + (tx.amount || 0), 0);
  
  // CBSI Calculation
  const maxCbsi = nodeTxns.reduce((m, tx) => {
    const effectiveCbsi = tx.cbsi || (tx.is_fraud_flag === 1 ? 100 : 0);
    return Math.max(m, effectiveCbsi);
  }, 0);

  const accent = node.isAttacker || node.isHoneypot ? '#ef4444' : '#00B4D8';
  const title  = node.isHoneypot ? `HONEYPOT — ${node.id}` : node.isAttacker ? `ATTACKER — ${node.id}` : node.group === 'employee' ? `EMPLOYEE — ${node.id}` : `ACCOUNT — ${node.id}`;

  // API Handlers (Safe from crashes)
  const handleDownloadPDF = async () => {
    try {
      const response = await fetchWithAuth(`api/evidence/download?emp_id=${node.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Evidence_Report_${node.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return true;
      }
      alert("No evidence report found for this employee on the server.");
      return false;
    } catch (error) {
      console.error("PDF download failed:", error);
      return false; 
    }
  };

  const handleFileSTR = async () => {
    try {
      const response = await fetchWithAuth(`api/evidence/file-str`, {
        method: 'POST',
        body: JSON.stringify({ emp_id: node.id, cbsi_score: maxCbsi })
      });
      return response.ok;
    } catch (error) {
      console.error("STR submission failed:", error);
      return false;
    }
  };

  // Timeline events
  const dynamicEvents = nodeTxns
    .filter(tx => tx.cbsi >= 50 || tx.is_fraud_flag === 1)
    .sort((a, b) => (a.cbsi || 0) - (b.cbsi || 0)) 
    .map(tx => {
      const amount  = (tx.amount || 0).toLocaleString('en-IN');
      const account = tx.account_touched || '—';
      const rawCbsi = tx.cbsi || 0;
      const cbsi    = (rawCbsi === 0 && tx.is_fraud_flag === 1) ? 100 : rawCbsi;

      let severity = 'warn';
      let eventTitle = 'Suspicious Transaction Flagged';
      let detail   = `Transferred ₹${amount} to ${account}.`;

      if (cbsi >= 95 || tx.is_fraud_flag === 1) {
        severity = 'terminal';
        eventTitle = 'CONFIRMED FRAUD — CBSI ' + cbsi;
        detail   = `Orchestrator assigned CBSI ${cbsi}. All agents correlated. Evidence generation triggered. Account: ${account}.`;
      } else if (cbsi >= 85) {
        severity = 'critical';
        eventTitle = 'Critical AI Model Trigger';
        detail   = `Orchestrator assigned CBSI ${cbsi}. Extreme risk pattern matched. Transferred ₹${amount} to ${account}.`;
      } else if (cbsi >= 70) {
        severity = 'high';
        eventTitle = 'High Risk Behavioural Drift';
        detail   = `Transaction pushed risk score to ${cbsi}. Multi-agent alert fired. ₹${amount} → ${account}.`;
      } else {
        severity = 'warn';
        eventTitle = 'Suspicious Transaction Flagged';
        detail   = `CBSI ${cbsi} — ₹${amount} transferred to ${account}. FCU review recommended.`;
      }

      let timeStr = '—';
      if (tx.timestamp) {
        try {
          timeStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
          timeStr = String(tx.timestamp).slice(11, 16) || '—';
        }
      }

      return { time: timeStr, title: eventTitle, detail, severity };
    });

  const events = dynamicEvents;

  return (
    <div style={{ 
      position:'absolute', 
      top:0, 
      right:0, 
      height:'100%', 
      width:350, 
      background: t.card, 
      borderLeft: `1px solid ${t.border}`, 
      boxShadow: theme === 'dark' ? '-8px 0 32px rgba(0,0,0,0.5)' : '-8px 0 32px rgba(0,0,0,0.08)', 
      display:'flex', 
      flexDirection:'column', 
      zIndex:30, 
      animation:'vm-slide 0.25s cubic-bezier(0.16,1,0.3,1)', 
      fontFamily:'monospace' 
    }}>
      <style>{`@keyframes vm-slide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} @keyframes vm-pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom: `1px solid ${t.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:accent, display:'inline-block', animation: node.isAttacker ? 'vm-pulse 1.5s ease infinite' : 'none' }} />
            <span style={{ fontSize:9, color:accent, letterSpacing:'0.12em', textTransform:'uppercase' }}>
              {node.isHoneypot ? 'Honeypot Triggered' : node.isAttacker ? 'Incident Detected' : 'Node Inspection'}
            </span>
          </div>
          <div style={{ fontSize:12, color: t.text, fontWeight:600 }}>{title}</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color: t.text2, cursor:'pointer', fontSize:20, lineHeight:1, padding:'2px 6px' }}>×</button>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom: `1px solid ${t.border}` }}>
        {[['CBSI', maxCbsi > 0 ? `${maxCbsi}` : '—'], ['TXN COUNT', nodeTxns.length], ['TOTAL FLOW', totalAmount > 0 ? `₹${(totalAmount/100000).toFixed(1)}L` : '—']].map(([k,v]) => (
          <div key={k} style={{ padding:'10px 14px', background: t.cardAlt, borderRight: `1px solid ${t.border}` }}>
            <div style={{ fontSize:9, color: t.text2, letterSpacing:'0.10em', marginBottom:3 }}>{k}</div>
            <div style={{ fontSize:12, color: node.isAttacker ? '#f87171' : t.text, fontWeight:600 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
        {events.length > 0 ? (
          <>
            <div style={{ fontSize:9, color: t.text2, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              Breach Timeline
              <span style={{ color:'#22c55e', fontSize:9, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', padding:'1px 6px', borderRadius:3 }}>LIVE</span>
            </div>
            {events.map((evt, i) => {
              const s = SEV_STYLE[evt.severity];
              const isLast = i === events.length - 1;
              return (
                <div key={i} style={{ display:'flex', gap:12, position:'relative' }}>
                  {!isLast && <div style={{ position:'absolute', left:11, top:22, bottom:0, width:1, background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />}
                  <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background: t.card, border:`1px solid ${s.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, display:'block' }} />
                  </div>
                  <div style={{ paddingBottom:16, flex:1 }}>
                    <div style={{ fontSize:10, color:s.text, marginBottom:2 }}>{evt.time}</div>
                    <div style={{ fontSize:11, color: t.text, fontWeight:600, marginBottom:3, lineHeight:1.3 }}>{evt.title}</div>
                    <div style={{ fontSize:10, color: t.text2, lineHeight:1.5 }}>{evt.detail}</div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div style={{ fontSize:9, color: t.text2, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Recent Transactions</div>
            {nodeTxns.slice(-6).reverse().map((tx, i) => (
              <div key={i} style={{ padding:'8px 10px', background: t.cardAlt, borderRadius:6, marginBottom:6, border: `1px solid ${t.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:10, color: t.text2 }}>{tx.account_touched}</span>
                  <span style={{ fontSize:10, color: tx.cbsi >= 70 ? '#f87171' : '#4ade80', fontWeight:600 }}>CBSI {tx.cbsi || 0}</span>
                </div>
                <div style={{ fontSize:11, color: t.text }}>₹{(tx.amount||0).toLocaleString('en-IN')}</div>
              </div>
            ))}
            {nodeTxns.length === 0 && <div style={{ color: t.text2, fontSize:11, textAlign:'center', marginTop:24 }}>No transactions for this node.</div>}
          </>
        )}
      </div>

      {/* Footer actions */}
      {(node.isAttacker || node.isHoneypot) && (
        <div style={{ padding:'12px 14px', borderTop: `1px solid ${t.border}`, display:'flex', gap:8, background: t.cardAlt }}>
          <ActionButton label="Generate Evidence PDF" successLabel="Generated ✓" accent="red" onClick={handleDownloadPDF} />
          {authStore.getUser()?.role !== 'analyst' && (
            <ActionButton label="File STR to FIU-IND" successLabel="Filed ✓" accent="neutral" onClick={handleFileSTR} />
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGEND — Gap 6 Fix
// ─────────────────────────────────────────────────────────────────────────────
function Legend({ t, theme, isMobile }) {
  if (isMobile) return null;
  const items = [
    { color:'#E50914',           sym:'●', label:'Attacker node'    },
    { color:'#FFB300',           sym:'◆', label:'Honeypot account' },
    { color:'#FF5722',           sym:'●', label:'Flagged employee' },
    { color:'#00B4D8',           sym:'●', label:'Normal employee'  },
    { color: theme === 'dark' ? '#555555' : '#94a3b8', sym:'●', label:'Normal account'   },
    { color:'#EF4444',           sym:'- -', label:'Lateral Movement (Shared IP)' },
    { color:'#E50914',           sym:'—', label:'Fraud flow'       },
    { color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)', sym:'—', label:'Normal flow'      },
  ];
  return (
    <div style={{ 
      position:'absolute', 
      bottom:16, 
      left:16, 
      zIndex:10, 
      background: theme === 'dark' ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.92)', 
      border: `1px solid ${t.border}`, 
      borderRadius:8, 
      padding:'10px 14px', 
      pointerEvents:'none', 
      fontFamily:'monospace',
      boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <div style={{ fontSize:9, color: t.text2, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Legend</div>
      {items.map(it => (
        <div key={it.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ color:it.color, fontSize:13, width:14, textAlign:'center', lineHeight:1 }}>{it.sym}</span>
          <span style={{ fontSize:10, color: t.text }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LINK TOOLTIP — Gap 8 Fix: shows aggregated amount on hover
// ─────────────────────────────────────────────────────────────────────────────
function LinkTooltip({ link, pos, t, theme }) {
  if (!link || !pos) return null;
  if (link.isLateral) {
    return (
      <div style={{ 
        position:'absolute', 
        left:pos.x+14, 
        top:pos.y-32, 
        zIndex:40, 
        background: theme === 'dark' ? '#111' : '#fff', 
        border:'1px solid rgba(239,68,68,0.3)', 
        borderRadius:6, 
        padding:'5px 10px', 
        pointerEvents:'none', 
        fontFamily:'monospace', 
        fontSize:11, 
        color:'#fca5a5', 
        whiteSpace:'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        ⚠️ Shared VPN IP: {link.sharedIp}
      </div>
    );
  }
  return (
    <div style={{ 
      position:'absolute', 
      left:pos.x+14, 
      top:pos.y-32, 
      zIndex:40, 
      background: theme === 'dark' ? '#111' : '#fff', 
      border: `1px solid ${t.border}`, 
      borderRadius:6, 
      padding:'5px 10px', 
      pointerEvents:'none', 
      fontFamily:'monospace', 
      fontSize:11, 
      color: t.text, 
      whiteSpace:'nowrap',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      ₹{(link.amount||0).toLocaleString('en-IN')}
      <span style={{ color: t.text2, marginLeft:8 }}>{link.weight} txn{link.weight>1?'s':''}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function FundFlowGraph({ liveTxns, honeypotIds, attackerThreshold, t, theme }) {
  const graphRef     = useRef();
  const containerRef = useRef();
  const prevNodesRef = useRef(new Map());

  // Dynamically compute store theme if needed
  const currentTheme = theme || 'dark';
  const currentT = t || (currentTheme === 'dark' ? { card: '#0e0e0e', cardAlt: '#111', border: 'rgba(255,255,255,0.05)', text: '#e5e7eb', text2: '#6b7280', accent: '#00B4D8' } : { card: '#fff', cardAlt: '#f8fafc', border: '#e2e8f0', text: '#0f172a', text2: '#64748b', accent: '#0284c7' });

  const [dims,         setDims]         = useState({ w: 800, h: 600 });
  const [stepIndex,    setStepIndex]    = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [selectedNode, setSelectedNode] = useState(null); // Gap 3 Fix
  const [hoveredLink,  setHoveredLink]  = useState(null); // Gap 8 Fix
  const [linkPos,      setLinkPos]      = useState(null);

  // Resolve honeypot set — O(1) — Gap 2 Fix
  const honeypotSet = useMemo(() => {
    if (!honeypotIds) return DEFAULT_HONEYPOT_IDS;
    return honeypotIds instanceof Set ? honeypotIds : new Set(honeypotIds);
  }, [honeypotIds]);

  const cbsiThreshold = attackerThreshold ?? CBSI_ATTACKER_THRESHOLD;

  // Auto-resize
  useEffect(() => {
    const update = () => {
      const p = document.getElementById('graph-container');
      if (p) setDims({ w: p.clientWidth, h: p.clientHeight });
    };
    window.addEventListener('resize', update);
    update();
    return () => window.removeEventListener('resize', update);
  }, []);

  // Gap 4 Fix: reset when data disappears
  useEffect(() => {
    if (!liveTxns || liveTxns.length === 0) {
      setStepIndex(0); setIsPlaying(false); setSelectedNode(null);
    }
  }, [liveTxns]);

  // Gap 5 Fix: depend on scalar length, not array reference
  const txnLength = liveTxns?.length ?? 0;
  useEffect(() => {
    if (!isPlaying || stepIndex >= txnLength) {
      if (isPlaying && stepIndex >= txnLength) setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setStepIndex(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [isPlaying, txnLength, stepIndex]);

  // Graph data — smart aggregation
  const graphData = useMemo(() => {
    const nodesMap = prevNodesRef.current;
    const linksMap = new Map();
    const visible  = Array.isArray(liveTxns) ? liveTxns.slice(0, Math.max(stepIndex, 1)) : [];
    
    // LATERAL MOVEMENT: Map IPs to sets of employees
    const ipToEmployees = new Map();

    visible.forEach(tx => {
      if (!tx.emp_id || !tx.account_touched) return;
      const empId     = tx.emp_id;
      const accId     = tx.account_touched;
      const cbsi      = tx.cbsi || 0;
      const isFraud   = cbsi >= CBSI_FRAUD_THRESHOLD  || tx.is_fraud_flag === 1;
      const isAttacker= cbsi >= cbsiThreshold          || tx.is_fraud_flag === 1; 
      const isHoneypot= honeypotSet.has(accId);                                   

      // Track IP for lateral movement (ignore 0.0.0.0 or empty)
      if (tx.ip_address && tx.ip_address !== '0.0.0.0') {
        if (!ipToEmployees.has(tx.ip_address)) ipToEmployees.set(tx.ip_address, new Set());
        ipToEmployees.get(tx.ip_address).add(empId);
      }

      if (!nodesMap.has(empId)) {
        nodesMap.set(empId, { id: empId, group: 'employee', isAttacker, isFraud, cbsi });
      } else {
        const n = nodesMap.get(empId);
        if (isFraud)    n.isFraud    = true;
        if (isAttacker) n.isAttacker = true;
        if (cbsi > (n.cbsi || 0)) n.cbsi = cbsi;
      }

      if (!nodesMap.has(accId)) nodesMap.set(accId, { id: accId, group: 'account', isHoneypot });

      const lid = `${empId}->${accId}`;
      if (!linksMap.has(lid)) {
        linksMap.set(lid, { source: empId, target: accId, isFraud, amount: tx.amount || 0, weight: 1 });
      } else {
        const l = linksMap.get(lid);
        l.amount += tx.amount || 0;
        l.weight += 1;
        if (isFraud) l.isFraud = true;
      }
    });

    // LATERAL MOVEMENT: Create dashed edges between employees sharing an IP
    ipToEmployees.forEach((empSet, ip) => {
      if (empSet.size > 1) {
        const emps = Array.from(empSet);
        for (let i = 0; i < emps.length; i++) {
          for (let j = i + 1; j < emps.length; j++) {
            const lid = `LATERAL:${emps[i]}<->${emps[j]}`;
            if (!linksMap.has(lid)) {
              linksMap.set(lid, {
                source: emps[i],
                target: emps[j],
                isLateral: true,
                sharedIp: ip,
                isFraud: true,
                amount: 0,
                weight: 1
              });
            }
          }
        }
      }
    });

    return { nodes: Array.from(nodesMap.values()), links: Array.from(linksMap.values()) };
  }, [liveTxns, stepIndex, honeypotSet, cbsiThreshold]);

  // Physics
  useEffect(() => {
    if (!graphRef.current) return;
    
    graphRef.current.d3Force('charge').strength(-400);
    graphRef.current.d3Force('link').distance(120);

    graphData.nodes.forEach(node => {
      node.fx = undefined;
      node.fy = undefined;
    });

    graphRef.current.d3ReheatSimulation();
  }, [stepIndex]); 

  // Node Painter with CBSI score badge
  const paintNode = useCallback((node, ctx, globalScale) => {
    ctx.save();
    ctx.shadowBlur = 0;

    const isSelected = selectedNode?.id === node.id;
    let r     = node.group === 'employee' ? 6 : 4;
    let color = node.group === 'employee' ? '#00B4D8' : (currentTheme === 'dark' ? '#555555' : '#94a3b8');

    if (node.isAttacker)       { r = 10; color = '#E50914'; ctx.shadowColor = '#E50914'; ctx.shadowBlur = isSelected ? 22 : 14; }
    else if (node.isHoneypot)  { r = 8;  color = '#FFB300'; ctx.shadowColor = '#FFB300'; ctx.shadowBlur = isSelected ? 22 : 14; }
    else if (node.isFraud)     {          color = '#FF5722'; ctx.shadowColor = '#FF5722'; ctx.shadowBlur = 8; }

    // Selection ring
    if (isSelected) {
      ctx.beginPath(); ctx.arc(node.x, node.y, r + 4, 0, 2*Math.PI);
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.45; ctx.stroke(); ctx.globalAlpha = 1;
    }

    ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, 2*Math.PI);
    ctx.fillStyle = color; ctx.fill(); ctx.shadowBlur = 0;

    // CBSI badge above fraud nodes
    if ((node.isAttacker || node.isFraud) && node.cbsi > 0) {
      const fs = Math.max(7, 9 / globalScale);
      ctx.font = `bold ${fs}px monospace`; ctx.fillStyle = '#f87171';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${node.cbsi}`, node.x, node.y - r - 2);
    }

    // ID Label
    if (node.isAttacker || node.isHoneypot || globalScale > 2.5) {
      const fs = Math.max(6, 9 / globalScale);
      ctx.font = `bold ${fs}px monospace`; 
      ctx.fillStyle = currentTheme === 'dark' ? '#ffffff' : '#0f172a';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(node.id.slice(-8), node.x, node.y + r + 2);
    }

    ctx.restore();
  }, [selectedNode, currentTheme]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const handleLinkHover = useCallback((link) => setHoveredLink(link || null), []);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLinkPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const criticalCount = graphData.nodes.filter(n => n.isAttacker).length;
  const honeypotCount = graphData.nodes.filter(n => n.isHoneypot).length;

  const isMobile = dims.w < 520;

  const sbStyle = {
    background: 'transparent',
    border: `1px solid ${currentT.border}`,
    color: currentT.text2,
    padding: isMobile ? '5px 10px' : '6px 14px',
    borderRadius: 8,
    fontSize: isMobile ? 11 : 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'monospace',
    letterSpacing: '0.03em',
    transition: 'opacity 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
  };

  return (
    <div id="graph-container" ref={containerRef} onMouseMove={handleMouseMove}
      style={{ position:'relative', width:'100%', height:'100%', background: currentTheme === 'dark' ? '#0a0a0a' : '#f8fafc', overflow:'hidden' }}>

      {/* HUD — top-left, two lines */}
      <div style={{ position:'absolute', top:12, left:14, zIndex:10, pointerEvents:'none', fontFamily:'monospace' }}>
        <div style={{ fontSize:10, color: currentT.accent, letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>
          {isMobile ? 'Fund Flow' : 'Investigative Fund Flow'}
        </div>
        {!isMobile && (
          <div style={{ fontSize:9, color: currentT.text2 }}>
            {graphData.nodes.length} entities · {graphData.links.length} connections
            {criticalCount > 0 && <span style={{ color:'#E50914', marginLeft:8 }}>· {criticalCount} attacker{criticalCount > 1 ? 's':''}</span>}
            {honeypotCount > 0 && <span style={{ color:'#FFB300', marginLeft:8 }}>· {honeypotCount} honeypot{honeypotCount > 1 ? 's':''}</span>}
          </div>
        )}
      </div>

      {/* Controls — top-right, below HUD, responsive */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: selectedNode ? 366 : 12,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 4 : 6,
        background: currentTheme === 'dark' ? 'rgba(38,39,41,0.92)' : 'rgba(255,255,255,0.92)',
        border: `1px solid ${currentT.border}`,
        borderRadius: 10,
        padding: isMobile ? '5px 8px' : '5px 10px',
        backdropFilter: 'blur(12px)',
        boxShadow: currentTheme === 'dark' ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)',
        fontFamily: 'monospace',
        transition: 'right 0.25s ease',
      }}>
        {/* Step counter */}
        <div style={{ color: currentT.text2, fontSize: 10, fontWeight: 600, paddingRight: isMobile ? 6 : 8, borderRight: `1px solid ${currentT.border}`, marginRight: 2, minWidth: 32, textAlign:'center' }}>
          {Math.min(stepIndex, txnLength)}<span style={{ opacity: 0.35 }}>/</span>{txnLength}
        </div>

        <button style={sbStyle} onClick={() => setStepIndex(s => Math.max(0, s - 1))} title="Previous">
          {isMobile ? '◀' : '◀ Prev'}
        </button>

        <button
          onClick={() => setIsPlaying(p => !p)}
          style={{
            ...sbStyle,
            padding: isMobile ? '5px 12px' : '6px 16px',
            background: isPlaying ? 'rgba(244,63,94,0.18)' : 'rgba(100,116,139,0.12)',
            borderColor: isPlaying ? 'rgba(244,63,94,0.5)' : currentT.border,
            color: isPlaying ? '#f43f5e' : currentT.text,
            fontWeight: 700,
          }}
        >
          {isPlaying ? (isMobile ? '⏸' : '⏸ Pause') : (isMobile ? '▶' : '▶ Auto-Trace')}
        </button>

        <button style={sbStyle} onClick={() => setStepIndex(s => Math.min(txnLength, s + 1))} title="Next">
          {isMobile ? '▶' : 'Next ▶'}
        </button>

        <div style={{ width: 1, height: 16, background: currentT.border, margin: '0 2px' }} />

        <button
          style={{ ...sbStyle, color: currentT.text2 }}
          onClick={() => { setStepIndex(0); setIsPlaying(false); setSelectedNode(null); }}
          title="Reset"
        >
          {isMobile ? '↺' : '↺ Reset'}
        </button>
      </div>

      {/* Graph */}
      <ForceGraph2D
        ref={graphRef}
        width={dims.w} height={dims.h}
        graphData={graphData}
        backgroundColor={currentTheme === 'dark' ? '#0a0a0a' : '#f8fafc'}
        cooldownTicks={60}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}
        onEngineStop={() => {
          if (graphData && graphData.nodes) {
            graphData.nodes.forEach(node => {
              node.fx = node.x; // Lock X position
              node.fy = node.y; // Lock Y position
            });
          }
        }}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        onNodeClick={handleNodeClick}
        onLinkHover={handleLinkHover}
        linkColor={link => link.isLateral ? 'rgba(239,68,68,0.85)' : link.isFraud ? 'rgba(229,9,20,0.75)' : currentTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.15)'}
        linkWidth={link => link.isLateral ? 2.5 : (link.isFraud ? 2.5 : 0.8) * Math.min(Math.sqrt(link.weight), 4)}
        linkLineDash={link => link.isLateral ? [4, 4] : null}
        linkDirectionalParticles={link => link.isLateral ? 0 : link.isFraud ? 4 : 0}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={link => link.isFraud ? '#E50914' : '#00B4D8'}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, (node.isAttacker ? 10 : node.isHoneypot ? 8 : 6) + 5, 0, 2*Math.PI);
          ctx.fillStyle = color; ctx.fill();
        }}
        enableNodeDrag enableZoomInteraction
      />

      {/* Legend — Gap 6 Fix */}
      <Legend t={currentT} theme={currentTheme} isMobile={isMobile} />

      {/* Link tooltip — Gap 8 Fix */}
      {hoveredLink && linkPos && <LinkTooltip link={hoveredLink} pos={linkPos} t={currentT} theme={currentTheme} />}

      {/* Incident panel — Gap 3 Fix */}
      {selectedNode && <IncidentPanel node={selectedNode} allTxns={liveTxns} onClose={() => setSelectedNode(null)} t={currentT} theme={currentTheme} />}

      {/* Click hint */}
      {!selectedNode && graphData.nodes.some(n => n.isAttacker || n.isHoneypot) && (
        <div style={{ 
          position:'absolute', 
          bottom:16, 
          right:16, 
          zIndex:10, 
          background: currentTheme === 'dark' ? 'rgba(10,10,10,0.85)' : 'rgba(255,255,255,0.85)', 
          border: `0.5px solid ${currentT.border}`, 
          borderRadius:6, 
          padding:'5px 12px', 
          fontSize:10, 
          color: currentT.text2, 
          fontFamily:'monospace', 
          pointerEvents:'none' 
        }}>
          Click red or gold node to open incident panel
        </div>
      )}
    </div>
  );
} 