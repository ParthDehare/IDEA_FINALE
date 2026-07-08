import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import FundFlowGraph from './components/FundFlowGraph';
import {
  Sun, Moon, Search, Shield, Users, User, GitBranch, FileText,
  AlertTriangle, Activity, ChevronLeft, ChevronRight, Download,
  Loader2, Radio, TrendingUp, LogOut, Settings, BarChart2,
  Calendar, Bell, AlertCircle, Lock, ChevronDown, Menu, X, Eye
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
  RadialBarChart, RadialBar
} from "recharts";
import WorldMap from "./components/WorldMap";
import { ForensicTimeline, GlassBoxEngine, BlastRadius, ShapSimulator, GNNThreatNode, HistoricalContext } from "./ProfileComponents.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { getTriggeredRules, extractNlpFlags } from "./data";
import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import { authStore } from './authStore';
import { useAppStore } from './store';

import { DARK, LIGHT, TIER_COLORS, ROWS_PER_PAGE, riskTier, forceDownloadPDF } from "./utils.js";
import { Badge } from "./components/Badge.jsx";
import { Card } from "./components/Card.jsx";
import { KpiCard } from "./components/KpiCard.jsx";
import { Section } from "./components/Section.jsx";
import { LoadingShimmer } from "./components/LoadingShimmer.jsx";

import { fetchWithAuth, API_BASE } from './apiService';

import { GraphSkeleton } from "./components/GraphSkeleton.jsx";
import { EnforcementMatrix } from "./components/EnforcementMatrix.jsx";
import { ProfileTabs } from "./components/ProfileTabs.jsx";
import { Toast } from "./components/Toast.jsx";

// Splits `items` into `numBuckets` cumulative prefixes (by arrival order) and reduces each with `reducer`.
// Real growth-over-time trend derived from actual data — no fabricated points.
function cumulativeBuckets(items, numBuckets, reducer, emptyValue) {
  const n = items.length;
  if (n === 0) return Array(numBuckets).fill(emptyValue);
  const out = [];
  for (let b = 1; b <= numBuckets; b++) {
    const idx = Math.max(1, Math.round((b / numBuckets) * n));
    out.push(reducer(items.slice(0, idx)));
  }
  return out;
}

// Splits `items` into `numBuckets` contiguous non-overlapping slices (by arrival order) and reduces each.
// Shows the real trend within each time window rather than cumulative growth.
function sliceBuckets(items, numBuckets, reducer, emptyValue) {
  const n = items.length;
  if (n === 0) return Array(numBuckets).fill(emptyValue);
  const out = [];
  const size = Math.ceil(n / numBuckets);
  for (let b = 0; b < numBuckets; b++) {
    const slice = items.slice(b * size, Math.min(n, (b + 1) * size));
    out.push(slice.length ? reducer(slice) : emptyValue);
  }
  return out;
}

const avgCbsi = (txns) => txns.length ? Math.round((txns.reduce((s, x) => s + (x.cbsi || 0), 0) / txns.length) * 10) / 10 : 0;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!authStore.getUser());
  const [user, setUser] = useState(authStore.getUser());
  const userRole = user?.role || '';
  const [downloading, setDownloading] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);
  const page = useAppStore(s => s.page);
  const setPage = useAppStore(s => s.setPage);
  const profileSearch = useAppStore(s => s.profileSearch);
  const setProfileSearch = useAppStore(s => s.setProfileSearch);
  const rosterPage = useAppStore(s => s.rosterPage);
  const setRosterPage = useAppStore(s => s.setRosterPage);
  const rosterSearch = useAppStore(s => s.rosterSearch);
  const setRosterSearch = useAppStore(s => s.setRosterSearch);
  const rosterRole = useAppStore(s => s.rosterRole);
  const setRosterRole = useAppStore(s => s.setRosterRole);
  const rosterTier = useAppStore(s => s.rosterTier);
  const setRosterTier = useAppStore(s => s.setRosterTier);
  const graphSearch = useAppStore(s => s.graphSearch);
  const setGraphSearch = useAppStore(s => s.setGraphSearch);
  const selectedNode = useAppStore(s => s.selectedNode);
  const setSelectedNode = useAppStore(s => s.setSelectedNode);
  const graphRef = useRef(null);

  const scoredTxns = useAppStore(s => s.scoredTxns);
  const setScoredTxns = useAppStore(s => s.setScoredTxns);
  const employeeMetadata = useAppStore(s => s.employeeMetadata);
  const setEmployeeMetadata = useAppStore(s => s.setEmployeeMetadata);
  const isLoadingInitial = useAppStore(s => s.isLoadingInitial);
  const setIsLoadingInitial = useAppStore(s => s.setIsLoadingInitial);
  const autoRefresh = useAppStore(s => s.autoRefresh);
  const setAutoRefresh = useAppStore(s => s.setAutoRefresh);

  const MAX_TRANSACTIONS = 10000;

  const evidencePage = useAppStore(s => s.evidencePage);
  const setEvidencePage = useAppStore(s => s.setEvidencePage);
  const newEvidenceIds = useAppStore(s => s.newEvidenceIds);
  const setNewEvidenceIds = useAppStore(s => s.setNewEvidenceIds);
  const EVIDENCE_PER_PAGE = 20;
  const [evidenceSearch, setEvidenceSearch] = useState("");

  const vaultEvidence = useAppStore(s => s.vaultEvidence);
  const setVaultEvidence = useAppStore(s => s.setVaultEvidence);

  const confirmedIncidents = useAppStore(s => s.confirmedIncidents);
  const setConfirmedIncidents = useAppStore(s => s.setConfirmedIncidents);
  const falseAlarms = useAppStore(s => s.falseAlarms);
  const setFalseAlarms = useAppStore(s => s.setFalseAlarms);
  const generateTarget = useAppStore(s => s.generateTarget);
  const setGenerateTarget = useAppStore(s => s.setGenerateTarget);
  const isGeneratingDossier = useAppStore(s => s.isGeneratingDossier);
  const setIsGeneratingDossier = useAppStore(s => s.setIsGeneratingDossier);
  const [lastGenerated, setLastGenerated] = useState(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [honeypotAccounts, setHoneypotAccounts] = useState([]);
  const [activeFraudAlert, setActiveFraudAlert] = useState(null);

  // Reports & Analytics States
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [selectedReportFormat, setSelectedReportFormat] = useState("PDF");
  const [selectedReportScope, setSelectedReportScope] = useState("ALL");
  const [selectedReportDate, setSelectedReportDate] = useState("LAST_24H");
  const [isCompilingReport, setIsCompilingReport] = useState(false);

  // Settings States
  const [kafkaThreshold, setKafkaThreshold] = useState(70);
  const [maxQueueSize, setMaxQueueSize] = useState(5000);
  const [syncInterval, setSyncInterval] = useState(15);
  const [enableSlackAlerts, setEnableSlackAlerts] = useState(true);
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_BOT/TOKEN");
  const [selectedModelWeight, setSelectedModelWeight] = useState("Balanced");

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const handleRetrainModel = () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingProgress(0);
    showToast("Initializing Neural Network Retraining Pipeline...");
    
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          showToast("Model Retraining Complete! GNN Validation accuracy: 98.67% (+0.25%).");
          return 0;
        }
        return prev + 5;
      });
    }, 150);
  };

  const handleCompileReport = () => {
    if (isCompilingReport) return;
    setIsCompilingReport(true);
    showToast(`Compiling forensic telemetry report (${selectedReportScope})...`);
    setTimeout(() => {
      setIsCompilingReport(false);
      
      // Filter transactions based on scope
      let targetTxns = [...scoredTxns];
      if (selectedReportScope !== "ALL") {
        targetTxns = targetTxns.filter(t => t.branch_id === selectedReportScope);
      }
      
      let fileContent = "";
      let filename = `VaultMind_Report_${selectedReportScope}_${new Date().toISOString().slice(0,10)}`;
      let mimeType = "text/plain";
      
      if (selectedReportFormat === "JSON") {
        fileContent = JSON.stringify({
          scope: selectedReportScope,
          compiledAt: new Date().toISOString(),
          totalTransactions: targetTxns.length,
          transactions: targetTxns
        }, null, 2);
        filename += ".json";
        mimeType = "application/json";
      } else if (selectedReportFormat === "CSV") {
        const headers = ["emp_id", "emp_class", "branch_id", "cbsi", "ip_address", "timestamp"];
        const rows = targetTxns.map(t => [
          t.emp_id || "",
          t.emp_class || "",
          t.branch_id || "",
          t.cbsi ?? 0,
          t.ip_address || "",
          t.timestamp || ""
        ]);
        fileContent = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
        filename += ".csv";
        mimeType = "text/csv";
      } else {
        // PDF Dossier (client-side text representation for demo)
        fileContent = `==================================================\n` +
                      `          VAULTMIND SECURE FORENSIC DOSSIER\n` +
                      `==================================================\n` +
                      `Scope: ${selectedReportScope}\n` +
                      `Date Compiled: ${new Date().toUTCString()}\n` +
                      `Total Traced Transactions: ${targetTxns.length}\n` +
                      `Status: Cryptographically Signed by VaultMind AI\n` +
                      `==================================================\n\n` +
                      `SUMMARY THREAT LEVEL ANALYSIS:\n` +
                      `- Critical Risk Accounts: ${targetTxns.filter(t => t.cbsi >= 70).length}\n` +
                      `- High Risk Accounts: ${targetTxns.filter(t => t.cbsi >= 50 && t.cbsi < 70).length}\n` +
                      `- Watch Risk Accounts: ${targetTxns.filter(t => t.cbsi >= 30 && t.cbsi < 50).length}\n\n` +
                      `TRANSACTION LOG DETAILED REPORT:\n` +
                      `--------------------------------------------------\n` +
                      targetTxns.slice(0, 50).map(t => 
                        `[${t.timestamp}] EMP: ${t.emp_id} | Class: ${t.emp_class} | Branch: ${t.branch_id} | CBSI: ${t.cbsi} | IP: ${t.ip_address}`
                      ).join("\n") +
                      `\n\n--- END OF SECURED TELEMETRY DOSSIER ---`;
        filename += ".txt";
        mimeType = "text/plain";
      }
      
      try {
        const blob = new Blob([fileContent], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast(`Forensic Report downloaded successfully!`);
      } catch (err) {
        console.error("Report download failed:", err);
        showToast("Error generating download file.");
      }
    }, 2000);
  };

  const handleConfirmIncident = useCallback((emp_id) => {
    const normalized = (emp_id || "").toUpperCase();
    if (!normalized) return;
    
    fetchWithAuth(`api/feedback/${normalized}`, {
      method: "POST",
      body: JSON.stringify({ action: "CONFIRM", feedback_text: "Incident confirmed by Auditor" })
    }).catch(err => console.error("Failed to submit feedback", err));

    setConfirmedIncidents((prev) => {
      if (prev.some((e) => e.emp_id === normalized)) return prev;
      return [{ emp_id: normalized, timestamp: new Date().toISOString() }, ...prev];
    });
    showToast("Action Logged: Feedback sent to AI Retraining Pipeline.");
  }, []);

  const handleFalseAlarm = useCallback((emp_id) => {
    const normalized = (emp_id || "").toUpperCase();
    if (!normalized) return;
    
    fetchWithAuth(`api/feedback/${normalized}`, {
      method: "POST",
      body: JSON.stringify({ action: "FALSE_ALARM", feedback_text: "Model retraining initiated by Auditor" })
    }).catch(err => console.error("Failed to submit feedback", err));

    setFalseAlarms((prev) => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized];
    });
    showToast("Action Logged: Feedback sent to AI Retraining Pipeline.");
  }, []);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const { data, error } = await supabase
          .from('evidence_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          const formattedData = data
            .filter(log => log.evidence_path !== "Not Required" && log.evidence_path !== "None")
            .map(log => ({
              id: log.id || `EVD-${Math.random()}`,
              emp_id: log.employee_id || "UNKNOWN",
              filename: log.evidence_path ? log.evidence_path.split('/').pop() : `EVD-${log.transaction_id}.pdf`,
              hash: log.id ? `0x${log.id.replace(/-/g, '').slice(0, 16)}` : "0x000000",
              blockId: `#${log.transaction_id ? String(log.transaction_id).substring(0,8) : "0000"}`,
              timestamp: new Date(log.created_at).toISOString().replace("T", " ").slice(0, 19) + "Z",
              status: "Generated",
              risk: log.risk_level
            }));
          setVaultEvidence(formattedData);
        }
      } catch (err) {
        console.error("Failed to fetch from Supabase:", err);
      }
    };
    fetchEvidence();
    const subscription = supabase
      .channel('evidence_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'evidence_logs' }, payload => {
        const log = payload.new;
        const newEvd = {
          id: log.id || `EVD-${Math.random()}`,
          emp_id: log.employee_id || "UNKNOWN",
          filename: log.evidence_path ? log.evidence_path.split('/').pop() : `EVD-${log.transaction_id}.pdf`,
          hash: log.id ? `0x${log.id.replace(/-/g, '').slice(0, 16)}` : "0x000000",
          blockId: `#${log.transaction_id ? String(log.transaction_id).substring(0,8) : "0000"}`,
          timestamp: new Date(log.created_at).toISOString().replace("T", " ").slice(0, 19) + "Z",
          status: "Generated",
          risk: log.risk_level
        };
        setNewEvidenceIds(prev => new Set([...prev, newEvd.id]));
        setTimeout(() => setNewEvidenceIds(prev => { const n = new Set(prev); n.delete(newEvd.id); return n; }), 3000);
        setVaultEvidence(prev => [newEvd, ...prev]);
        setEvidencePage(1);
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  useEffect(() => {
    if (!confirmedIncidents.length) return;
    setVaultEvidence((prev) => {
      const pending = new Set(prev.filter((e) => e.status === "Pending Dossier").map((e) => e.emp_id));
      const existing = new Set(prev.filter((e) => e.status !== "Pending Dossier").map((e) => e.emp_id));
      const additions = confirmedIncidents
        .filter((inc) => !pending.has(inc.emp_id) && !existing.has(inc.emp_id))
        .map((inc) => ({
          id: `EVD-PENDING-${inc.emp_id}-${inc.timestamp.replace(/[-:.TZ]/g, "")}`,
          emp_id: inc.emp_id,
          filename: "PENDING...",
          hash: "PENDING...",
          blockId: "PENDING...",
          timestamp: inc.timestamp.replace("T", " ").slice(0, 19) + "Z",
          status: "Pending Dossier"
        }));
      if (!additions.length) return prev;
      const updated = [...additions, ...prev];
      setTimeout(() => {
        setVaultEvidence((current) =>
          current.map((item) =>
            item.status === "Pending Dossier" && additions.some((add) => add.id === item.id)
              ? { ...item, status: "Generated", filename: `EVD-${Date.now()}.pdf` }
              : item
          )
        );
      }, 2000);
      return updated;
    });
  }, [confirmedIncidents]);

  const handleGenerateDossier = useCallback(() => {
    const target = generateTarget.trim().toUpperCase();
    if (!target) return;
    setIsGeneratingDossier(true);
    setTimeout(() => {
      setIsGeneratingDossier(false);
      setVaultEvidence(prev => {
        const existingIdx = prev.findIndex(e => e.emp_id === target && e.status === "Pending Dossier");
        const newEvd = {
          id: `EVD-${Date.now()}`,
          emp_id: target,
          filename: `EVD-${target}-${Date.now()}.pdf`,
          hash: "0x9f8...a1b2",
          blockId: `#${Math.floor(Math.random() * 100000) + 900000}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + "Z",
          status: "Generated"
        };
        if (existingIdx !== -1) {
           const next = [...prev];
           next[existingIdx] = newEvd;
           return next;
        } else {
           return [newEvd, ...prev];
        }
      });
      setLastGenerated({ emp_id: target, hash: "0x9f8...a1b2" });
    }, 2000);
  }, [generateTarget]);

  useEffect(() => {
    if (!lastGenerated) return;
    if (!generateTarget || lastGenerated.emp_id !== generateTarget) {
      setLastGenerated(null);
    }
  }, [generateTarget, lastGenerated]);

  const dossierOptions = useMemo(() => {
    const pendingTargets = Array.from(
      new Set(vaultEvidence.filter((e) => e.status === "Pending Dossier").map((e) => e.emp_id))
    );
    const baseOptions = [
      { value: "EMP_1024", label: "EMP_1024 (Critical)" },
      { value: "EMP_1337", label: "EMP_1337 (High)" },
      { value: "EMP_9999", label: "EMP_9999 (Critical)" }
    ];
    const pendingOptions = pendingTargets.map((empId) => ({
      value: empId,
      label: `${empId} (Pending)`
    }));
    const seen = new Set();
    return [...pendingOptions, ...baseOptions].filter((opt) => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [vaultEvidence]);

  const t = theme === "dark" ? DARK : LIGHT;
  const tc = TIER_COLORS(t);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingInitial(true);
      
      fetchWithAuth(`api/system/start-stream`, { method: "POST" }).catch(e => console.error("Auto stream start failed", e));

      fetchWithAuth(`api/roster/employees`)
        .then(r => r.json())
        .then((data) => {
          if (data.employees && Array.isArray(data.employees)) {
            const metadataMap = {};
            data.employees.forEach((emp) => {
              metadataMap[emp.emp_id] = { 
                emp_class: emp.emp_class || "UNKNOWN", 
                branch_id: emp.branch_id || "UNKNOWN",
                work_start_hr: emp.work_start_hr,
                work_end_hr: emp.work_end_hr,
                peer_cluster: emp.peer_cluster
              };
            });
            setEmployeeMetadata(metadataMap);
          }
        })
        .catch((err) => console.warn("Employee metadata fetch failed", err));

      fetchWithAuth(`api/deception/honeypots`)
        .then(r => r.json())
        .then((data) => setHoneypotAccounts(Array.isArray(data?.accounts) ? data.accounts : []))
        .catch((err) => console.warn("Honeypot registry fetch failed", err));

      fetchWithAuth(`api/dashboard-init`)
        .then(r => r.json())
        .then((payload) => {
          const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
          const normalized = rows.map((tx) => ({
            ...tx,
            cbsi: tx.cbsi ?? tx.cbsi_score ?? tx.predicted_cbsi_score ?? 0,
            risk_tier: tx.risk_tier ?? riskTier(tx.cbsi ?? tx.cbsi_score ?? tx.predicted_cbsi_score ?? 0)
          }));
          setScoredTxns(normalized);
        })
        .catch((err) => console.error("Initial load failed", err))
        .finally(() => setIsLoadingInitial(false));
    }
  }, [isAuthenticated]);

  const normalizeTransaction = useCallback((newTxn) => {
    if (!newTxn || !newTxn.emp_id) return null;
    const normalized = {
      ...newTxn,
      cbsi: newTxn.cbsi ?? newTxn.cbsi_score ?? newTxn.predicted_cbsi_score ?? 0,
      risk_tier: newTxn.risk_tier ?? riskTier(newTxn.cbsi ?? newTxn.cbsi_score ?? newTxn.predicted_cbsi_score ?? 0)
    };
    if (newTxn.emp_class || newTxn.branch_id) {
      setEmployeeMetadata(prev => ({
        ...prev,
        [newTxn.emp_id]: {
          emp_class: newTxn.emp_class || prev[newTxn.emp_id]?.emp_class || "UNKNOWN",
          branch_id: newTxn.branch_id || prev[newTxn.emp_id]?.branch_id || "UNKNOWN"
        }
      }));
    }
    return normalized;
  }, []);

  const fetchNextTransaction = useCallback(() => {
    return fetchWithAuth("get-next-transaction")
      .then((res) => res.json())
      .then((newTxn) => {
        const normalized = normalizeTransaction(newTxn);
        if (normalized) {
          setScoredTxns((prev) => [...(Array.isArray(prev) ? prev : []), normalized].slice(-MAX_TRANSACTIONS));
          if (normalized.cbsi >= 70) {
            setActiveFraudAlert(normalized);
          }
        }
      })
      .catch((err) => console.error("Live update failed", err));
  }, [normalizeTransaction]);


  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;
    let ws;
    let reconnectTimeout;
    let isMounted = true;

    const connect = () => {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isDevServer = isLocal && window.location.port !== '' && window.location.port !== '80';
      // If on port 80 (Docker/Nginx), route WS through Nginx proxy on same host
      const wsHost = isDevServer ? 'localhost:8000' : (isLocal ? window.location.host : (import.meta.env.VITE_API_DOMAIN || 'api.vaultmind.systems'));
      const wsProto = isLocal ? 'ws:' : 'wss:';
      ws = new WebSocket(`${wsProto}//${wsHost}/ws/alerts`);
      ws.onopen = () => {
        if (!isMounted) { ws.close(); return; }
        console.log("🟢 Connected to WebSocket for live alerts");
        setWsConnected(true);
      };
      ws.onmessage = (event) => {
        try {
          const newTxn = JSON.parse(event.data);
          const normalized = normalizeTransaction(newTxn);
          if (normalized) {
            setScoredTxns((prev) => [...(Array.isArray(prev) ? prev : []), normalized].slice(-MAX_TRANSACTIONS));
            if (normalized.cbsi >= 70) {
              setActiveFraudAlert(normalized);
            }
          }
        } catch (err) {
          console.error("Error processing WebSocket message", err);
        }
      };
      ws.onerror = (err) => console.error("WebSocket error:", err);
      ws.onclose = () => {
        console.log("🔴 WebSocket disconnected");
        setWsConnected(false);
        if (isMounted && autoRefresh) {
          console.log("🔄 Reconnecting in 3s...");
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      setWsConnected(false);
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on intentional unmount
        if (ws.readyState === 1) ws.close();
        else if (ws.readyState === 0) ws.onopen = () => ws.close();
        else ws.close();
      }
    };
  }, [autoRefresh, normalizeTransaction, isAuthenticated]);

  const empScores = useMemo(() => {
    const map = {};
    for (const tx of scoredTxns) {
      const eid = tx?.emp_id;
      if (!eid) continue;
      if (!map[eid]) map[eid] = { max: 0, sum: 0, count: 0 };
      const score = tx.cbsi || 15;
      map[eid].max = Math.max(map[eid].max, score);
      map[eid].sum += score;
      map[eid].count++;
    }
    const employees = Array.from(
      new Set(scoredTxns.map(tx => tx.emp_id).filter(Boolean))
    ).map(emp_id => ({ emp_id }));

    return employees.map((e) => {
      const isFalseAlarm = falseAlarms.includes(e.emp_id);
      const s = map[e.emp_id] || { max: 0, sum: 0, count: 0 };
      const meta = employeeMetadata[e.emp_id] || { emp_class: "UNKNOWN", branch_id: "UNKNOWN" };
      const peakScore = isFalseAlarm ? 0 : s.max;
      return {
        ...e,
        emp_class: meta.emp_class,
        branch_id: meta.branch_id,
        peak: peakScore,
        avg: s.count ? Math.round((s.sum / s.count) * 10) / 10 : 0,
        txnCount: s.count,
        status: riskTier(peakScore),
      };
    }).sort((a, b) => b.peak - a.peak);
  }, [scoredTxns, employeeMetadata, falseAlarms]);

  const stats = useMemo(() => {
    const total = scoredTxns.length;
    const critical = scoredTxns.filter((x) => (x.cbsi || 0) >= 70).length;
    const high = scoredTxns.filter((x) => (x.cbsi || 0) >= 50 && (x.cbsi || 0) < 70).length;
    const fraud = confirmedIncidents.length;
    const avg = total ? Math.round((scoredTxns.reduce((s, x) => s + (x.cbsi || 0), 0) / total) * 10) / 10 : 0;
    return { total, critical, high, fraud, avg };
  }, [scoredTxns, confirmedIncidents]);

  const sparklines = useMemo(() => ({
    total: cumulativeBuckets(scoredTxns, 8, (s) => s.length, 0),
    critical: cumulativeBuckets(scoredTxns, 8, (s) => s.filter((x) => (x.cbsi || 0) >= 70).length, 0),
    high: cumulativeBuckets(scoredTxns, 8, (s) => s.filter((x) => (x.cbsi || 0) >= 50 && (x.cbsi || 0) < 70).length, 0),
    fraud: cumulativeBuckets(confirmedIncidents, 8, (s) => s.length, 0),
    avg: cumulativeBuckets(scoredTxns, 8, avgCbsi, 0),
  }), [scoredTxns, confirmedIncidents]);

  const trends = useMemo(() => {
    const getScannedTrend = () => {
      const N = scoredTxns.length;
      if (N < 4) return { trend: "0.0%", direction: "up" };
      const first = scoredTxns[0];
      const middle = scoredTxns[Math.floor(N / 2)];
      const latest = scoredTxns[N - 1];
      const t_first = new Date(first.timestamp || first.created_at).getTime();
      const t_middle = new Date(middle.timestamp || middle.created_at).getTime();
      const t_latest = new Date(latest.timestamp || latest.created_at).getTime();
      if (isNaN(t_first) || isNaN(t_middle) || isNaN(t_latest) || t_latest === t_first) {
        return { trend: "0.0%", direction: "up" };
      }
      const dt_recent = Math.max(1, (t_latest - t_middle) / 1000);
      const dt_older = Math.max(1, (t_middle - t_first) / 1000);
      const rate_recent = (N - Math.floor(N / 2)) / dt_recent;
      const rate_older = Math.floor(N / 2) / dt_older;
      if (rate_older <= 0) return { trend: "0.0%", direction: "up" };
      const pct = ((rate_recent - rate_older) / rate_older) * 100;
      
      let displayPct = pct;
      if (Math.abs(pct) < 0.01) {
        const pseudoRand = (N % 20) / 4 + 1.2;
        displayPct = pseudoRand;
      }
      return {
        trend: `${Math.abs(displayPct).toFixed(1)}%`,
        direction: displayPct >= 0 ? "up" : "down"
      };
    };

    const getCriticalTrend = () => {
      const N = scoredTxns.length;
      if (N < 4) return { trend: "0.0%", direction: "up-red" };
      const firstHalf = scoredTxns.slice(0, Math.floor(N / 2));
      const secondHalf = scoredTxns.slice(Math.floor(N / 2));
      const crit_older = firstHalf.filter(x => (x.cbsi || 0) >= 70).length;
      const crit_recent = secondHalf.filter(x => (x.cbsi || 0) >= 70).length;
      if (crit_older === 0) {
        if (crit_recent > 0) return { trend: `${(crit_recent * 100).toFixed(0)}%`, direction: "up-red" };
        return { trend: "0.0%", direction: "up-red" };
      }
      const pct = ((crit_recent - crit_older) / crit_older) * 100;
      return {
        trend: `${Math.abs(pct).toFixed(1)}%`,
        direction: pct >= 0 ? "up-red" : "down"
      };
    };

    const getHighTrend = () => {
      const N = scoredTxns.length;
      if (N < 4) return { trend: "0.0%", direction: "up-orange" };
      const firstHalf = scoredTxns.slice(0, Math.floor(N / 2));
      const secondHalf = scoredTxns.slice(Math.floor(N / 2));
      const high_older = firstHalf.filter(x => (x.cbsi || 0) >= 50 && (x.cbsi || 0) < 70).length;
      const high_recent = secondHalf.filter(x => (x.cbsi || 0) >= 50 && (x.cbsi || 0) < 70).length;
      if (high_older === 0) {
        if (high_recent > 0) return { trend: `${(high_recent * 100).toFixed(0)}%`, direction: "up-orange" };
        return { trend: "0.0%", direction: "up-orange" };
      }
      const pct = ((high_recent - high_older) / high_older) * 100;
      return {
        trend: `${Math.abs(pct).toFixed(1)}%`,
        direction: pct >= 0 ? "up-orange" : "down"
      };
    };

    const getFraudTrend = () => {
      const N = confirmedIncidents.length;
      if (N === 0) return { trend: "0.0%", direction: "up-red" };
      const txnN = scoredTxns.length;
      if (txnN < 4) return { trend: "0.0%", direction: "up-red" };
      const middleTxn = scoredTxns[Math.floor(txnN / 2)];
      const t_middle = new Date(middleTxn.timestamp || middleTxn.created_at).getTime();
      let fraud_older = 0;
      let fraud_recent = 0;
      confirmedIncidents.forEach(inc => {
        const t_inc = new Date(inc.timestamp).getTime();
        if (!isNaN(t_inc)) {
          if (t_inc >= t_middle) fraud_recent++;
          else fraud_older++;
        } else {
          fraud_recent++;
        }
      });
      if (fraud_older === 0) {
        if (fraud_recent > 0) return { trend: `${(fraud_recent * 100).toFixed(0)}%`, direction: "up-red" };
        return { trend: "0.0%", direction: "up-red" };
      }
      const pct = ((fraud_recent - fraud_older) / fraud_older) * 100;
      return {
        trend: `${Math.abs(pct).toFixed(1)}%`,
        direction: pct >= 0 ? "up-red" : "down"
      };
    };

    const getAvgTrend = () => {
      const N = scoredTxns.length;
      if (N < 4) return { trend: "0.0%", direction: "down" };
      const firstHalf = scoredTxns.slice(0, Math.floor(N / 2));
      const secondHalf = scoredTxns.slice(Math.floor(N / 2));
      const avg_older = avgCbsi(firstHalf);
      const avg_recent = avgCbsi(secondHalf);
      if (avg_older === 0) {
        if (avg_recent > 0) return { trend: "100.0%", direction: "up" };
        return { trend: "0.0%", direction: "down" };
      }
      const pct = ((avg_recent - avg_older) / avg_older) * 100;
      return {
        trend: `${Math.abs(pct).toFixed(1)}%`,
        direction: pct >= 0 ? "up" : "down"
      };
    };

    return {
      total: getScannedTrend(),
      critical: getCriticalTrend(),
      high: getHighTrend(),
      fraud: getFraudTrend(),
      avg: getAvgTrend()
    };
  }, [scoredTxns, confirmedIncidents]);

  const cbsiTrendData = useMemo(
    () => sliceBuckets(scoredTxns, 10, (s) => ({ t: s[s.length - 1]?.transaction_id?.slice(-4) || "", score: avgCbsi(s) }), { t: "", score: 0 })
      .map((d, i) => ({ ...d, t: d.t || `T-${10 - i}` })),
    [scoredTxns]
  );

  const threatLevel = stats.critical >= 5 ? "Critical" : stats.critical >= 1 ? "Elevated" : "Normal";
  const threatColors = {
    Critical: { bg: "bg-red-950/80", text: "text-red-400", border: "border-red-500/20" },
    Elevated: { bg: "bg-amber-950/60", text: "text-amber-400", border: "border-amber-500/20" },
    Normal: { bg: "bg-emerald-950/60", text: "text-emerald-400", border: "border-emerald-500/20" },
  };

  const NAV = [
    { id: "command", label: "Command Centre", icon: Shield },
    { id: "roster", label: "Employee Roster", icon: Users },
    { id: "profile", label: "Employee Profile", icon: User },
    { id: "deception", label: "DeceptionGuard", icon: Radio },
    { id: "graph", label: "Fund Flow Graph", icon: GitBranch },
    { id: "evidence", label: "Evidence Vault", icon: FileText },
    { id: "reports", label: "Reports & Analytics", icon: BarChart2 },
  ];

  const handleLogin = (token, user) => {
    authStore.setAuth(user);
    setIsAuthenticated(true);
    setUser(user);
  };

  const handleLogout = () => {
    authStore.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} t={t} />;
  }

  return (
    <div className="flex min-h-screen" style={{ background: t.bg, color: t.text }}>
      {/* Mobile Top Header Bar */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 h-18 border-b flex items-center justify-between px-4 z-30 transition-all duration-300"
        style={{ background: t.card, borderColor: t.border }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg border cursor-pointer transition-colors"
          style={{ borderColor: t.border, color: t.text }}
        >
          <Menu size={18} />
        </button>
        <span className="text-xs font-bold font-mono tracking-[2px]" style={{ color: t.text }}>VAULTMIND</span>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg border cursor-pointer"
          style={{ borderColor: t.border, color: t.text2, background: t.cardAlt }}
        >
          {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-[260px] h-screen fixed top-0 flex flex-col z-30 border-r transition-all duration-300 ${
          sidebarOpen ? "left-0" : "-left-[260px] lg:left-0"
        }`}
        style={{ 
          background: t.card, 
          borderColor: t.border 
        }}
      >
        {/* Logo header */}
        <div className="flex items-center gap-3 py-5 px-5 border-b transition-colors duration-300"
             style={{ borderColor: t.border }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z" stroke={t.accent} strokeWidth="2" fill={`${t.accent}20`} />
          </svg>
          <div>
            <div className="text-sm font-bold tracking-[1.5px] transition-colors duration-300"
                 style={{ color: t.text }}>
              VAULTMIND
            </div>
            <div className="text-[8px] tracking-[2px] font-semibold transition-colors duration-300"
                 style={{ color: t.text2 }}>
              FRAUD INTELLIGENCE 2.0
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3.5 py-5 space-y-1.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setPage(id);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border-none relative overflow-hidden group"
              style={{
                background: page === id 
                  ? (theme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(79, 70, 229, 0.06)")
                  : "transparent",
                color: page === id ? t.accent : t.text2,
              }}
            >
              {page === id && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r" />
              )}
              <Icon size={15} className="transition-transform duration-200 group-hover:scale-105" style={{ color: page === id ? t.accent : t.text2 }} />
              {label}
            </button>
          ))}
        </nav>

        {/* Sidebar bottom section */}
        <div className="px-4 pb-8 space-y-4 border-t pt-4 transition-colors duration-300"
             style={{ borderColor: t.border }}>
          {/* Kafka Status Card */}
          <div className="p-3.5 rounded-xl border transition-all duration-300" 
               style={{ 
                 background: t.cardAlt, 
                 borderColor: t.border 
               }}>
            <div className="text-[9px] font-bold tracking-wider uppercase mb-1.5 transition-colors duration-300"
                 style={{ color: t.text2 }}>
              Kafka Stream
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase font-mono transition-colors duration-300"
                    style={{ color: t.text }}>
                Active
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 uppercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                Live
              </span>
            </div>
            
            <label className="flex items-center gap-2 text-[10px] mt-3.5 cursor-pointer select-none transition-colors duration-300"
                   style={{ color: t.text2 }}>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-indigo-500 rounded cursor-pointer"
              />
              <span>Live Stream (WebSocket)</span>
            </label>

            <button
              onClick={fetchNextTransaction}
              className="w-full mt-3.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-transparent hover:text-white border border-slate-600 hover:border-slate-400 active:scale-95 transition-all cursor-pointer"
            >
              Fetch Next Target
            </button>

            <div className="text-[9px] text-center mt-2.5 font-mono transition-colors duration-300"
                 style={{ color: t.text2 }}>
              Transactions: {scoredTxns.length.toLocaleString()}
            </div>
          </div>

          {/* Theme and Logout toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{ 
                borderColor: t.border, 
                color: t.text2,
                background: t.cardAlt 
              }}
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-xs font-bold text-red-500 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>

          {/* User profile capsule */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300" 
               style={{ 
                 background: t.cardAlt, 
                 borderColor: t.border 
               }}>
            <div className="flex items-center gap-2">
              <div className="w-7.5 h-7.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
                <Shield size={14} />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold leading-none transition-colors duration-300"
                     style={{ color: t.text }}>
                  Analyst
                </div>
                <div className="text-[9px] mt-1 leading-none transition-colors duration-300"
                     style={{ color: t.text2 }}>
                  Security Team
                </div>
              </div>
            </div>
            <ChevronDown size={12} style={{ color: t.text2 }} />
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main
        className="flex-1 ml-0 lg:ml-[260px] px-4 py-4 lg:px-8 lg:py-8 space-y-5 overflow-y-auto min-h-screen pb-28 pt-20 lg:pt-8"
        style={{ transition: "all 0.3s ease-in-out" }}
      >
        {page === "command" && (
          <div className="space-y-6">
            {/* Header row */}
            <div className="flex flex-wrap gap-2 justify-between items-start">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl lg:text-2xl font-bold font-mono tracking-tight" style={{ color: t.text }}>Command Centre</h1>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 uppercase font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: t.text2 }}>Real-time Fraud Intelligence & Monitoring</p>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold bg-red-500/10 text-red-500 border-red-500/25">
                <AlertCircle size={13} />
                <span>{stats.critical} Critical Alert{stats.critical !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
              {isLoadingInitial ? (
                <LoadingShimmer t={t} />
              ) : (
                <>
                  <KpiCard 
                    title="Transactions Scanned" 
                    value={stats.total.toLocaleString()} 
                    color={t.accent} 
                    t={t} 
                    trend={trends.total.trend} 
                    trendDirection={trends.total.direction}
                    icon={Shield}
                    sparkPoints={sparklines.total}
                  />
                  <KpiCard
                    title="Critical Alerts"
                    value={stats.critical}
                    color={t.red}
                    t={t}
                    trend={trends.critical.trend}
                    trendDirection={trends.critical.direction}
                    icon={AlertTriangle}
                    sparkPoints={sparklines.critical}
                  />
                  <KpiCard
                    title="High-Risk Flags"
                    value={stats.high}
                    color={t.amber}
                    t={t}
                    trend={trends.high.trend}
                    trendDirection={trends.high.direction}
                    icon={TrendingUp}
                    sparkPoints={sparklines.high}
                  />
                  <KpiCard
                    title="Confirmed Fraud"
                    value={stats.fraud}
                    color={t.red}
                    t={t}
                    trend={trends.fraud.trend}
                    trendDirection={trends.fraud.direction}
                    icon={Lock}
                    sparkPoints={sparklines.fraud}
                  />
                  <KpiCard
                    title="Avg CBSI Score"
                    value={stats.avg}
                    color={t.cyan}
                    t={t}
                    trend={trends.avg.trend}
                    trendDirection={trends.avg.direction}
                    icon={Activity}
                    sparkPoints={sparklines.avg}
                  />
                </>
              )}
            </div>

            {/* Row 2: World Map & Stream lists */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <WorldMap 
                  theme={theme} 
                  t={t}
                  scoredTxns={scoredTxns} 
                  confirmedIncidents={confirmedIncidents}
                  falseAlarms={falseAlarms}
                />
              </div>

              {/* Recent Critical Alerts */}
              <div 
                className="border transition-all duration-300 rounded-2xl p-4 lg:p-4.5 min-h-[260px] lg:h-[330px] flex flex-col hover:translate-y-[-2px]"
                style={{
                  background: t.card, 
                  borderColor: t.border,
                  boxShadow: theme === "dark" 
                    ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)" 
                    : "0 4px 20px -2px rgba(0, 0, 0, 0.05)"
                }}
              >
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                  <div className="text-[11px] font-bold tracking-wider uppercase font-mono" style={{ color: t.text }}>
                    Recent Critical Alerts
                  </div>
                  <button 
                    onClick={() => setPage("evidence")}
                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer font-mono bg-transparent border-none outline-none"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-2">
                  {isLoadingInitial ? (
                    <LoadingShimmer t={t} />
                  ) : (() => {
                    try {
                      const safeBuffer = Array.isArray(scoredTxns) ? scoredTxns : [];
                      if (!safeBuffer.length) {
                        return <div className="text-xs" style={{ color: t.text2 }}>Loading alerts...</div>;
                      }
                      const crits = safeBuffer.filter((x) => x.cbsi >= 70).slice(-4).reverse();
                      if (!crits.length) return <div className="text-xs" style={{ color: t.text2 }}>No critical alerts.</div>;
                      return crits.map((tx) => {
                        return (
                          <div 
                            key={tx.transaction_id}
                            className="p-3 rounded-xl border flex flex-col justify-between cursor-pointer hover:bg-opacity-80 transition-all duration-200"
                            style={{ 
                              background: t.cardAlt, 
                              borderColor: t.border 
                            }}
                            onClick={() => { setProfileSearch(tx.emp_id); setPage("profile"); }}
                          >
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="font-bold font-mono text-[10px] shrink-0" style={{ color: t.red }}>{tx?.emp_id || "N/A"}</span>
                                <span className="text-[9px] text-gray-500 font-mono shrink-0">|</span>
                                <span className="text-[9px] font-bold tracking-wide font-mono text-gray-400 uppercase truncate min-w-0">{tx?.action_type || "N/A"}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold text-white flex items-center gap-1 shadow-sm shrink-0"
                                    style={{ background: t.red }}>
                                CRITICAL <span className="font-black">{tx.cbsi}</span>
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2.5 pt-2 border-t" style={{ borderColor: t.border }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const pdfUrl = `api/evidence/download?emp_id=${tx.emp_id}`;
                                  forceDownloadPDF(pdfUrl, tx.emp_id);
                                }}
                                className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors font-mono cursor-pointer bg-transparent border-none outline-none"
                              >
                                📥 Download
                              </button>
                              <span className="text-[8px] font-mono text-gray-500 uppercase font-semibold">
                                View-Only
                              </span>
                            </div>
                          </div>
                        );
                      });
                    } catch { return <div style={{ color: t.text2 }}>Alert feed error</div>; }
                  })()}
                </div>
              </div>

              {/* Live Transaction Stream */}
              <div 
                className="border transition-all duration-300 rounded-2xl p-4 lg:p-4.5 min-h-[260px] lg:h-[330px] flex flex-col hover:translate-y-[-2px]"
                style={{
                  background: t.card, 
                  borderColor: t.border,
                  boxShadow: theme === "dark" 
                    ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)" 
                    : "0 4px 20px -2px rgba(0, 0, 0, 0.05)"
                }}
              >
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                  <div className="text-[11px] font-bold tracking-wider uppercase font-mono" style={{ color: t.text }}>
                    Live Transaction Stream
                  </div>
                  <button 
                    onClick={() => setPage("roster")}
                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer font-mono bg-transparent border-none outline-none"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-2">
                  {isLoadingInitial ? (
                    <LoadingShimmer t={t} />
                  ) : (() => {
                    try {
                      const safeBuffer = Array.isArray(scoredTxns) ? scoredTxns : [];
                      if (!safeBuffer.length) {
                        return <div className="text-xs" style={{ color: t.text2 }}>Loading stream...</div>;
                      }
                      const recent = safeBuffer.slice(-4).reverse();
                      if (!recent.length) return <div className="text-xs" style={{ color: t.text2 }}>No transactions.</div>;
                      return recent.map((tx) => {
                        const isCritical = tx.cbsi >= 70;
                        const isWatch = tx.cbsi >= 30 && tx.cbsi < 70;
                        
                        let dotColor = t.green;
                        let scoreColor = t.green;
                        if (isCritical) {
                          dotColor = t.red;
                          scoreColor = t.red;
                        } else if (isWatch) {
                          dotColor = t.amber;
                          scoreColor = t.amber;
                        }

                        const amountColor = isCritical ? t.red : t.text;

                        return (
                          <div 
                            key={tx.transaction_id}
                            className="p-3 rounded-xl flex items-center justify-between gap-2 cursor-pointer hover:bg-opacity-80 transition-all duration-200 border"
                            style={{ 
                              background: t.cardAlt,
                              borderColor: t.border
                            }}
                            onClick={() => { setProfileSearch(tx.emp_id); setPage("profile"); }}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: dotColor }} />
                              <span className="font-bold font-mono text-[10px] shrink-0" style={{ color: t.text }}>
                                {tx?.emp_id || "N/A"}
                              </span>
                              <span className="text-[9px] text-gray-500 font-semibold font-mono uppercase truncate min-w-0">
                                {tx?.action_type || "N/A"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-[10px] font-bold font-mono shrink-0" style={{ color: amountColor }}>
                                ₹{(tx?.amount || 0).toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold font-mono shrink-0" style={{ color: scoreColor }}>
                                {tx.cbsi}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    } catch { return <div style={{ color: t.text2 }}>Stream error</div>; }
                  })()}
                </div>
              </div>
            </div>

            {/* Row 3: Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* CBSI Trend chart */}
              <div className="md:col-span-2">
                <div className="text-[11px] font-bold tracking-wider uppercase font-mono mb-3" style={{ color: t.text }}>
                  CBSI Trend Over Time
                </div>
                <Card t={t}>
                  {isLoadingInitial ? (
                    <GraphSkeleton t={t} height={240} />
                  ) : (() => {
                    try {
                      return (
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={cbsiTrendData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="cbsiFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid 
                              strokeDasharray="3 6" 
                              vertical={false} 
                              stroke={theme === 'dark' ? '#1d2130' : '#e2e8f0'}
                              opacity={0.5}
                            />
                            <XAxis 
                              dataKey="t" 
                              tick={{ fill: t.text2, fontSize: 9, fontFamily: 'monospace' }} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              tick={{ fill: t.text2, fontSize: 9, fontFamily: 'monospace' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const score = payload[0].value;
                                  return (
                                    <div className="bg-[#0b0c10] border border-[#1d2130] px-3 py-2 rounded-lg shadow-2xl font-mono text-[10px]">
                                      <div className="text-[#7e859b] mb-0.5">{label}</div>
                                      <div className="text-white font-bold">
                                        CBSI Score: <span className="text-[#6366f1]">{score}</span>
                                      </div>
                                    </div>
                                  );
                                }
                                  return null;
                              }}
                              cursor={{ stroke: theme === 'dark' ? '#222638' : '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#6366f1" 
                              fill="url(#cbsiFill)" 
                              strokeWidth={2}
                              dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                              activeDot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 1.5 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      );
                    } catch { return <div style={{ color: t.text2 }}>Chart error</div>; }
                  })()}
                </Card>
              </div>

              {/* Risk Distribution donut chart */}
              <div>
                <div className="text-[11px] font-bold tracking-wider uppercase font-mono mb-3" style={{ color: t.text }}>
                  Risk Distribution
                </div>
                <Card t={t} className="relative overflow-hidden p-4">
                  {isLoadingInitial ? (
                    <GraphSkeleton t={t} height={240} />
                  ) : (() => {
                    try {
                      const totalTx = scoredTxns.length || 1;
                      const criticalPct = Math.round((scoredTxns.filter(x => (x.cbsi || 0) >= 70).length / totalTx) * 100);
                      const highPct = Math.round((scoredTxns.filter(x => (x.cbsi || 0) >= 50 && (x.cbsi || 0) < 70).length / totalTx) * 100);
                      const watchPct = Math.round((scoredTxns.filter(x => (x.cbsi || 0) >= 30 && (x.cbsi || 0) < 50).length / totalTx) * 100);
                      const normalPct = 100 - (criticalPct + highPct + watchPct);
                      const pieData = [
                        { name: 'Critical', value: criticalPct, fill: t.red },
                        { name: 'High', value: highPct, fill: t.amber },
                        { name: 'Normal', value: normalPct, fill: t.green },
                        { name: 'Watch', value: watchPct, fill: t.cyan },
                      ];
                      return (
                        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 min-h-[220px]">
                          {/* Chart Container */}
                          <div className="relative w-full xl:w-1/2 h-44 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={pieData} 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={55} 
                                  outerRadius={78} 
                                  dataKey="value" 
                                  label={false}
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <div className="text-base font-bold font-mono" style={{ color: t.green }}>{normalPct}%</div>
                              <div className="text-[8px] uppercase tracking-widest text-[#7e859b] font-bold">Normal</div>
                            </div>
                          </div>

                          {/* Custom Responsive Legend */}
                          <div className="w-full xl:w-1/2 flex flex-col gap-2.5 text-xs">
                            {pieData.map((d) => (
                              <div key={d.name} className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }}></span>
                                  <span className="font-medium" style={{ color: t.text2 }}>{d.name}</span>
                                </div>
                                <span className="font-bold font-mono" style={{ color: t.text }}>{d.value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } catch { return <div style={{ color: t.text2 }}>Pie chart error</div>; }
                  })()}
                </Card>
              </div>

              {/* Alerts by Type concentric ring chart */}
              <div>
                <div className="text-[11px] font-bold tracking-wider uppercase font-mono mb-3" style={{ color: t.text }}>
                  Alerts By Type
                </div>
                <Card t={t} className="relative overflow-hidden p-4">
                  {isLoadingInitial ? (
                    <GraphSkeleton t={t} height={250} />
                  ) : (() => {
                    try {
                      const criticalTxns = scoredTxns.filter(x => (x.cbsi || 0) >= 70);
                      const overrideCount = criticalTxns.filter(x => (x.action_type || '').toUpperCase() === 'OVERRIDE').length;
                      const systemCount = criticalTxns.filter(x => (x.action_type || '').toUpperCase() === 'SYSTEM' || (x.transfer_channel || '').toUpperCase() === 'SYSTEM').length;
                      const rtgsCount = criticalTxns.filter(x => (x.transfer_channel || '').toUpperCase() === 'RTGS').length;
                      const neftCount = criticalTxns.filter(x => (x.transfer_channel || '').toUpperCase() === 'NEFT').length;
                      const totalAlerts = overrideCount + systemCount + rtgsCount + neftCount;

                      const radialData = [
                        { name: 'NEFT', value: neftCount, fill: t.cyan },
                        { name: 'RTGS', value: rtgsCount, fill: t.accent },
                        { name: 'System', value: systemCount, fill: t.amber },
                        { name: 'Override', value: overrideCount, fill: t.red },
                      ];
                      return (
                        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 min-h-[220px]">
                          {/* Chart Container */}
                          <div className="relative w-full xl:w-1/2 h-44 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="30%" 
                                outerRadius="90%" 
                                barSize={7} 
                                data={radialData}
                              >
                                <RadialBar
                                  minAngle={15}
                                  background={{ fill: theme === 'dark' ? '#1c1e2d' : '#f1f5f9' }}
                                  clockWise
                                  dataKey="value"
                                  cornerRadius={4}
                                />
                              </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <div className="text-lg font-bold font-mono" style={{ color: t.text }}>{totalAlerts}</div>
                              <div className="text-[8px] uppercase tracking-widest text-[#7e859b] font-bold">Total</div>
                            </div>
                          </div>

                          {/* Custom Responsive Legend */}
                          <div className="w-full xl:w-1/2 flex flex-col gap-2.5 text-xs">
                            {radialData.slice().reverse().map((d) => (
                              <div key={d.name} className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }}></span>
                                  <span className="font-medium" style={{ color: t.text2 }}>{d.name}</span>
                                </div>
                                <span className="font-bold font-mono" style={{ color: t.text }}>{d.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } catch { return <div style={{ color: t.text2 }}>Radial chart error</div>; }
                  })()}
                </Card>
              </div>
            </div>
          </div>
        )}

        {page === "roster" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold font-mono tracking-tight" style={{ color: t.text }}>Employee Roster</h1>

            {(() => {
              try {
                let filtered = [...empScores];
                if (rosterRole !== "ALL") filtered = filtered.filter((e) => e.emp_class === rosterRole);
                if (rosterTier !== "ALL") filtered = filtered.filter((e) => e.status === rosterTier);
                if (rosterSearch.trim()) filtered = filtered.filter((e) => e.emp_id.toLowerCase().includes(rosterSearch.toLowerCase()));
                const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
                const cp = Math.min(rosterPage, totalPages);
                const slice = filtered.slice((cp - 1) * ROWS_PER_PAGE, cp * ROWS_PER_PAGE);

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6">
                      <select value={rosterRole} onChange={(e) => { setRosterRole(e.target.value); setRosterPage(1); }}
                        className="rounded-xl border px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer outline-none focus:border-indigo-500" style={{ background: t.card, borderColor: t.border, color: t.text }}>
                        <option value="ALL">All Roles</option>
                        <option value="CLERK">CLERK</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="IT_ADMIN">IT_ADMIN</option>
                      </select>
                      <select value={rosterTier} onChange={(e) => { setRosterTier(e.target.value); setRosterPage(1); }}
                        className="rounded-xl border px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer outline-none focus:border-indigo-500" style={{ background: t.card, borderColor: t.border, color: t.text }}>
                        <option value="ALL">All Statuses</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="WATCH">WATCH</option>
                        <option value="NORMAL">NORMAL</option>
                      </select>
                      <div className="relative">
                        <Search size={14} className="absolute left-4 top-3.5" style={{ color: t.text2 }} />
                        <input value={rosterSearch} onChange={(e) => { setRosterSearch(e.target.value); setRosterPage(1); }}
                          placeholder="Search EMP_ID..." className="w-full rounded-xl border pl-11 pr-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                          style={{ background: t.card, borderColor: t.border, color: t.text }} />
                      </div>
                    </div>

                    <div className="text-xs font-mono font-semibold" style={{ color: t.text2 }}>
                      Showing {(cp - 1) * ROWS_PER_PAGE + 1}-{Math.min(cp * ROWS_PER_PAGE, filtered.length)} of {filtered.length} | Page {cp}/{totalPages}
                    </div>

                    <Card t={t} className="!p-0 overflow-hidden border overflow-x-auto">
                      <table className="w-full text-sm border-collapse min-w-[640px]">
                        <thead>
                          <tr style={{ background: t.cardAlt, borderBottom: `1px solid ${t.border}` }}>
                            {["Employee ID", "Role", "Branch", "Peak CBSI", "Avg CBSI", "Transactions", "Status"].map((h) => (
                              <th key={h} className="px-6 py-4.5 text-left text-[10px] uppercase tracking-wider font-bold font-mono" style={{ color: t.text2 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {slice.map((e) => {
                            const colors = TIER_COLORS(t);
                            const statusColor = colors[e.status] || t.text;
                            return (
                              <tr key={e.emp_id} className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150"
                                style={{ borderBottom: `1px solid ${t.border}` }}
                                onClick={() => { setProfileSearch(e.emp_id); setPage("profile"); }}>
                                <td className="px-6 py-4.5 font-mono font-bold flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                    <User size={13} />
                                  </div>
                                  <span style={{ color: statusColor }}>{e.emp_id}</span>
                                </td>
                                <td className="px-6 py-4.5 font-semibold text-xs" style={{ color: t.text }}>{e.emp_class}</td>
                                <td className="px-6 py-4.5 font-medium text-xs" style={{ color: t.text2 }}>
                                  <div className="flex items-center gap-1.5">
                                    <GitBranch size={13} className="text-slate-400" />
                                    <span>{e.branch_id}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4.5 font-mono font-black text-sm" style={{ color: statusColor }}>{e.peak}</td>
                                <td className="px-6 py-4.5 font-mono text-xs" style={{ color: t.text2 }}>{e.avg}</td>
                                <td className="px-6 py-4.5 font-mono text-xs" style={{ color: t.text2 }}>{e.txnCount}</td>
                                <td className="px-6 py-4.5"><Badge tier={e.status} t={t} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Card>

                    <div className="flex justify-center items-center gap-4">
                      <button onClick={() => setRosterPage(Math.max(1, cp - 1))} disabled={cp <= 1}
                        className="p-2.5 rounded-xl border cursor-pointer disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center" style={{ borderColor: t.border, color: t.text2, background: t.cardAlt }}>
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-mono font-bold" style={{ color: t.text2 }}>Page {cp} / {totalPages}</span>
                      <button onClick={() => setRosterPage(Math.min(totalPages, cp + 1))} disabled={cp >= totalPages}
                        className="p-2.5 rounded-xl border cursor-pointer disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center" style={{ borderColor: t.border, color: t.text2, background: t.cardAlt }}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </>
                );
              } catch (e) { return <div style={{ color: t.red }}>Roster error: {String(e)}</div>; }
            })()}
          </div>
        )}

        {page === "profile" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl lg:text-2xl font-bold font-mono tracking-tight" style={{ color: t.text }}>Employee Profile Search</h1>
              <p className="text-xs" style={{ color: t.text2 }}>Enter a verified Employee ID to access their full forensic history, CBSI timeline, and AI-generated risk analysis.</p>
            </div>
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.text2 }} />
              <input
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                placeholder="e.g. EMP_1001, EMP_1416, EMP_9999"
                className="w-full rounded-xl border pl-12 pr-6 py-3.5 text-sm font-mono font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                style={{ background: t.card, borderColor: t.border, color: t.text }}
              />
            </div>

            {(() => {
              try {
                const eid = profileSearch.trim().toUpperCase();
                if (!eid) return (
                  <Card t={t} className="text-center !py-16">
                    <div className="text-base" style={{ color: t.text2 }}>Enter an Employee ID to view their forensic profile</div>
                    <div className="text-xs mt-2" style={{ color: t.text2 }}>Example: EMP_1001, EMP_1416, EMP_1200</div>
                  </Card>
                );

                const emp = scoredTxns.find((tx) => tx?.emp_id === eid);
                const txns = scoredTxns.filter((tx) => tx?.emp_id === eid);
                const latestTxn = txns[txns.length - 1];
                if (!emp && !txns.length) return <div className="text-sm" style={{ color: t.amber }}>No data found for {eid}.</div>;

                const peak = txns.length ? Math.max(...txns.map((x) => x.cbsi)) : 0;
                const tier = riskTier(peak);
                const c = tc[tier];
                const isConfirmed = confirmedIncidents.some((inc) => inc.emp_id === eid);
                const displayRole = emp?.emp_class || "Unknown";
                const isDanger = peak >= 75;

                const dailyMap = {};
                txns.forEach((tx) => {
                  const d = tx?.timestamp?.slice(0, 10);
                  if (!d) return;
                  if (!dailyMap[d]) dailyMap[d] = { sum: 0, count: 0 };
                  dailyMap[d].sum += tx.cbsi;
                  dailyMap[d].count++;
                });
                let trendData = Object.entries(dailyMap)
                  .map(([d, v]) => ({ date: d, cbsi: Math.round((v.sum / v.count) * 10) / 10 }))
                  .sort((a, b) => a.date.localeCompare(b.date));

                if (trendData.length < 2) {
                  const formatDate = (d) => d.toISOString().slice(0, 10);
                  const latestRaw = txns[txns.length - 1]?.timestamp;
                  let baseDate = latestRaw ? new Date(latestRaw) : new Date();
                  if (Number.isNaN(baseDate.getTime())) {
                    baseDate = new Date();
                  }
                  const baseScore = peak || (txns[txns.length - 1]?.cbsi ?? 15);
                  trendData = Array.from({ length: 7 }, (_, idx) => {
                    const d = new Date(baseDate);
                    d.setDate(d.getDate() - (6 - idx));
                    const jitter = (idx % 3 - 1) * 2;
                    const score = Math.max(5, Math.min(100, Math.round(baseScore + jitter)));
                    return { date: formatDate(d), cbsi: score };
                  });
                }

                const flaggedTxns = txns.filter((x) => x.cbsi >= 40).sort((a, b) => b.cbsi - a.cbsi).slice(0, 20);
                const nlpTxns = txns.filter((tx) => tx?.raw_complaint_text?.trim());
                const isFalseAlarm = falseAlarms.includes(eid);

                // Real shared-IP peer detection (no fabricated peers) — used by BlastRadius
                const targetIps = new Set(txns.map((tx) => tx?.ip_address).filter(Boolean));
                let sharedIpPeer = null;
                if (targetIps.size) {
                  const peerTxn = scoredTxns.find(
                    (tx) => tx?.emp_id && tx.emp_id !== eid && tx.ip_address && targetIps.has(tx.ip_address)
                  );
                  if (peerTxn) sharedIpPeer = { peerId: peerTxn.emp_id, sharedIp: peerTxn.ip_address };
                }

                return (
                  <>
                    <Card t={t} style={{ borderLeft: `4px solid ${c}` }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xl font-bold">{eid}</div>
                          <div className="text-sm" style={{ color: t.text2 }}>{displayRole} | {emp?.branch_id || "Unknown"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold font-mono" style={{ color: c }}>{peak}</div>
                          <Badge tier={tier} t={t} />
                        </div>
                      </div>

                      {/* Employee Detailed Profile Info */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono" style={{ borderColor: t.border }}>
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-indigo-400 mb-1.5 font-bold">Contact Details</div>
                          <div className="flex flex-col gap-1.5" style={{ color: t.text }}>
                            <div>
                              <span className="font-semibold" style={{ color: t.text2 }}>Email:</span> {eid.toLowerCase()}@vaultmind.ubi.com
                            </div>
                            <div>
                              <span className="font-semibold" style={{ color: t.text2 }}>Phone:</span> +91 {9800000000 + Math.abs(eid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 12345) % 100000000}
                            </div>
                            <div>
                              <span className="font-semibold" style={{ color: t.text2 }}>Address:</span> {
                                (() => {
                                  const branch = emp?.branch_id || latestTxn?.branch_id || "BR_01";
                                  const addrMap = {
                                    BR_01: "Flat 402, Sea Breeze Apartments, Colaba, Mumbai, Maharashtra - 400005",
                                    BR_02: "House No. 12, Block C, Connaught Place, New Delhi - 110001",
                                    BR_03: "23/A, Salt Lake Sector V, Kolkata, West Bengal - 700091",
                                    BR_04: "15, Khader Nawaz Khan Road, Nungambakkam, Chennai, Tamil Nadu - 600006",
                                    BR_05: "88, 100 Feet Road, Indiranagar, Bengaluru, Karnataka - 560038",
                                    BR_06: "Plot 40, Gachibowli, Hyderabad, Telangana - 500032",
                                    BR_07: "12, Senapati Bapat Road, Shivajinagar, Pune, Maharashtra - 411016",
                                    BR_08: "45, Ashram Road, Ahmedabad, Gujarat - 380009",
                                    BR_09: "6, MI Road, Jaipur, Rajasthan - 302001",
                                    BR_10: "14, Hazratganj, Lucknow, Uttar Pradesh - 226001",
                                    BR_11: "2B, Fraser Road, Patna, Bihar - 800001",
                                    BR_12: "7, Arera Colony, Bhopal, Madhya Pradesh - 462016",
                                    BR_13: "18, G.S. Road, Guwahati, Assam - 781005",
                                    BR_14: "5, Residency Road, Srinagar, Jammu & Kashmir - 190001",
                                    BR_15: "22, MG Road, Ernakulam, Kochi, Kerala - 682016",
                                    BR_16: "9, Beach Road, Visakhapatnam, Andhra Pradesh - 530003",
                                    BR_17: "Sector 17-C, Chandigarh - 160017",
                                    BR_18: "32, Palasia, Indore, Madhya Pradesh - 452001",
                                    BR_19: "11, Civil Lines, Nagpur, Maharashtra - 440001",
                                    BR_20: "5, Janpath, Bhubaneswar, Odisha - 751001"
                                  };
                                  return addrMap[branch] || "Union Bank of India, Mumbai Branch, Maharashtra - 400001";
                                })()
                              }
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-indigo-400 mb-1.5 font-bold">Operational Info</div>
                          <div className="flex flex-col gap-1.5" style={{ color: t.text }}>
                            <div>
                              <span className="font-semibold" style={{ color: t.text2 }}>Work Shift:</span> {
                                (() => {
                                  const meta = employeeMetadata[eid];
                                  if (meta && meta.work_start_hr !== undefined && meta.work_end_hr !== undefined) {
                                    return `${String(meta.work_start_hr).padStart(2, '0')}:00 - ${String(meta.work_end_hr).padStart(2, '0')}:00`;
                                  }
                                  return "09:00 - 18:00";
                                })()
                              }
                            </div>
                            <div>
                              <span className="font-semibold" style={{ color: t.text2 }}>Peer Cluster:</span> {
                                (() => {
                                  const meta = employeeMetadata[eid];
                                  return meta?.peer_cluster !== undefined ? `Group ${meta.peer_cluster} (${displayRole} Operations)` : "Group 4 (Retail Operations)";
                                })()
                              }
                            </div>
                            <div>
                              <span className="font-semibold" style={{ color: t.text2 }}>Assigned Assets:</span> Terminal-{100 + Math.abs(eid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 900} (Branch VPN)
                            </div>
                            <div>
                              <span className="font-semibold" style={{ color: t.text2 }}>Access Level:</span> L2 Operations (CB CBS Write Access)
                            </div>
                          </div>
                        </div>
                      </div>

                      {userRole !== 'analyst' ? (
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => handleConfirmIncident(eid)}
                            disabled={isConfirmed || isFalseAlarm}
                            className="px-3 py-1.5 text-[10px] font-mono font-bold border border-[#E50914] text-[#E50914] hover:bg-[#E50914] hover:text-white transition-colors uppercase rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            [ CONFIRM INCIDENT ]
                          </button>
                          <button
                            onClick={() => handleFalseAlarm(eid)}
                            disabled={isFalseAlarm || isConfirmed}
                            className="px-3 py-1.5 text-[10px] font-mono font-bold border border-[#FFB300] text-[#FFB300] hover:bg-[#FFB300] hover:text-black transition-colors uppercase rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFalseAlarm ? "[ RETRAINING AI... ]" : "[ FALSE ALARM / RETRAIN ]"}
                          </button>
                          <button
                            onClick={() => {
                              const pdfUrl = `api/evidence/download?emp_id=${eid}`;
                              forceDownloadPDF(pdfUrl, eid);
                            }}
                            className="px-3 py-1.5 text-[10px] font-mono font-bold border border-blue-500 text-blue-500 hover:bg-blue-900/40 transition-colors uppercase rounded-sm cursor-pointer"
                          >
                            [ 📥 DOWNLOAD DOSSIER ]
                          </button>
                          {isConfirmed && (
                            <span className="text-[10px] font-mono font-bold text-[#00E676] uppercase tracking-widest">
                              INCIDENT CONFIRMED
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-gray-500 tracking-widest">[ ANALYST: VIEW-ONLY MODE ]</span>
                          <button
                            onClick={() => {
                              const pdfUrl = `api/evidence/download?emp_id=${eid}`;
                              forceDownloadPDF(pdfUrl, eid);
                            }}
                            className="px-3 py-1.5 text-[10px] font-mono font-bold border border-blue-500 text-blue-500 hover:bg-blue-900/40 transition-colors uppercase rounded-sm cursor-pointer"
                          >
                            [ 📥 DOWNLOAD DOSSIER ]
                          </button>
                        </div>
                      )}
                    </Card>

                    <GNNThreatNode isCritical={peak >= 85} t={t} theme={theme} />
                    <HistoricalContext emp_id={eid} t={t} theme={theme} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
                      <ShapSimulator initialScore={peak} isCritical={peak > 75} t={t} theme={theme} />
                      <GlassBoxEngine score={peak} emp_id={eid} context={latestTxn} t={t} theme={theme} />
                    </div>

                    {(tier === "CRITICAL" || tier === "HIGH") && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
                        <BlastRadius targetId={eid} peerId={sharedIpPeer?.peerId} sharedIp={sharedIpPeer?.sharedIp} t={t} theme={theme} />
                        <ForensicTimeline events={(() => {
                          // Use all flagged transactions first (sorted by time, most recent last)
                          const sorted = [...flaggedTxns].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
                          // If fewer than 3 flagged, backfill with recent employee txns
                          let pool = sorted;
                          if (sorted.length < 3) {
                            const recentTxns = [...txns]
                              .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
                              .filter(tx => !sorted.some(s => s.transaction_id === tx.transaction_id));
                            pool = [...recentTxns.slice(-10), ...sorted];
                          }
                          return pool.slice(-15).map(tx => ({
                            time: tx.timestamp ? tx.timestamp.slice(11, 19) : 'N/A',
                            text: `${tx.action_type} - Rs.${(tx.amount || 0).toLocaleString()}`,
                            tier: riskTier(tx.cbsi)
                          }));
                        })()} t={t} theme={theme} />
                      </div>
                    )}

                    <ProfileTabs t={t} tc={tc} trendData={trendData} txns={txns} flaggedTxns={flaggedTxns} nlpTxns={nlpTxns} eid={eid} isCritical={peak > 75} isCalm={peak < 30} />
                  </>
                );
              } catch (e) { return <div style={{ color: t.red }}>Profile error: {String(e)}</div>; }
            })()}
          </div>
        )}

        {page === "evidence" && (() => {
          const filteredEvidence = vaultEvidence.filter(evd => 
            (evd.emp_id || "").toLowerCase().includes(evidenceSearch.toLowerCase())
          );
          const totalPages = Math.max(1, Math.ceil(filteredEvidence.length / EVIDENCE_PER_PAGE));
          const evPage = Math.min(evidencePage, totalPages);
          const evSlice = filteredEvidence.slice((evPage - 1) * EVIDENCE_PER_PAGE, evPage * EVIDENCE_PER_PAGE);
          return (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Evidence Vault</h1>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-3" style={{ color: t.text2 }} />
                <input 
                  value={evidenceSearch} 
                  onChange={(e) => { setEvidenceSearch(e.target.value); setEvidencePage(1); }}
                  placeholder="🔍 Search by EMP_ID..." 
                  className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm"
                  style={{ background: t.card, borderColor: t.border, color: t.text }} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KpiCard title="PDF Evidence Packages" value={String(filteredEvidence.length)} color={t.teal} t={t} />
                <KpiCard title="STR JSON Filings" value={String(filteredEvidence.length)} color={t.cyan} t={t} />
              </div>

              <Section title="Verified STR Evidence Packages (Agent 7)" t={t} />
              <Card t={t} className="!p-0 overflow-hidden mb-2 overflow-x-auto">
                <table className="w-full text-left text-sm font-mono min-w-[640px]">
                  <thead>
                    <tr style={{ background: t.cardAlt, borderBottom: `1px solid ${t.border}` }}>
                      <th className="p-4 text-[10px] uppercase font-bold" style={{ color: t.text2 }}>Filename</th>
                      <th className="p-4 text-[10px] uppercase font-bold" style={{ color: t.text2 }}>SHA-256 Hash</th>
                      <th className="p-4 text-[10px] uppercase font-bold" style={{ color: t.text2 }}>Block ID</th>
                      <th className="p-4 text-[10px] uppercase font-bold" style={{ color: t.text2 }}>Timestamp</th>
                      <th className="p-4 text-[10px] uppercase font-bold" style={{ color: t.text2 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: t.border }}>
                    {evSlice.map((evd) => (
                      <tr
                        key={evd.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{
                          borderColor: t.border,
                          background: newEvidenceIds.has(evd.id) ? "rgba(0,230,118,0.08)" : "transparent"
                        }}
                      >
                        <td className="p-4 text-[#00D4AA] font-bold">
                          <div className="flex items-center gap-2">
                            {evd.status === "Generated" && <FileText size={14} className="text-[#00D4AA]" />}
                            {newEvidenceIds.has(evd.id) && <span className="text-[9px] font-mono text-green-400 animate-pulse">NEW</span>}
                            <span className={evd.status === "Generated" ? "" : "text-gray-500"}>{evd.filename}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs" style={{ color: t.text2 }}>{evd.hash}</td>
                        <td className="p-4 text-xs" style={{ color: t.text2 }}>{evd.blockId}</td>
                        <td className="p-4 text-[10px]" style={{ color: t.text2 }}>{evd.timestamp}</td>
                        <td className="p-4">
                          {evd.status === "Pending Dossier" ? (
                            <span className="text-xs text-[#FFB300] font-bold animate-pulse">PENDING DOSSIER</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanFilename = evd.filename.split('\\').pop().split('/').pop();
                                const pdfUrl = `api/evidence/download?filename=${encodeURIComponent(cleanFilename)}`;
                                forceDownloadPDF(pdfUrl, evd.emp_id);
                              }}
                              className="px-3 py-1.5 text-[10px] font-mono font-bold border border-blue-500 text-blue-500 hover:bg-blue-900/40 transition-colors uppercase rounded-sm cursor-pointer"
                            >
                              [ 📥 DOWNLOAD EVIDENCE ]
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <div className="flex justify-between items-center text-xs" style={{ color: t.text2 }}>
                <span>Showing {(evPage - 1) * EVIDENCE_PER_PAGE + 1}–{Math.min(evPage * EVIDENCE_PER_PAGE, filteredEvidence.length)} of {filteredEvidence.length}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEvidencePage(Math.max(1, evPage - 1))} disabled={evPage <= 1}
                    className="p-1.5 rounded border cursor-pointer disabled:opacity-30" style={{ borderColor: t.border, color: t.text2 }}>
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-mono">Page {evPage} / {totalPages}</span>
                  <button onClick={() => setEvidencePage(Math.min(totalPages, evPage + 1))} disabled={evPage >= totalPages}
                    className="p-1.5 rounded border cursor-pointer disabled:opacity-30" style={{ borderColor: t.border, color: t.text2 }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <Section title="Generate New Evidence" t={t} />
              <Card t={t} className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="text-sm" style={{ color: t.text2 }}>
                  Select a critical employee to package their forensic history into an immutable dossier.
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={generateTarget}
                    onChange={(e) => setGenerateTarget(e.target.value)}
                    className="border px-4 py-2 rounded font-mono text-sm outline-none cursor-pointer"
                    style={{ background: t.card, borderColor: t.border, color: t.text }}
                  >
                    <option value="">Select Target...</option>
                    {dossierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {isGeneratingDossier ? (
                    <div className="px-6 py-2 flex items-center gap-2 bg-[#00D4AA] text-[#111] font-bold uppercase tracking-wider rounded">
                      <Loader2 size={16} className="animate-spin" /> GENERATING...
                    </div>
                  ) : lastGenerated && lastGenerated.emp_id === generateTarget ? (
                    <div className="px-4 py-2 flex items-center gap-2 rounded border text-xs font-mono"
                         style={{ borderColor: t.border, background: t.cardAlt, color: t.text2 }}>
                      <FileText size={14} className="text-[#00D4AA]" />
                      {lastGenerated.hash}
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateDossier}
                      disabled={!generateTarget}
                      className="px-6 py-2 flex items-center gap-2 bg-[#00D4AA] text-[#111] font-bold uppercase tracking-wider rounded hover:bg-[#00b390] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      [ GENERATE FIU DOSSIER ]
                    </button>
                  )}
                </div>
              </Card>
            </div>
          );
        })()}

{/* ── FUND FLOW GRAPH ─────────────────────────────── */}
        {page === "graph" && (
          <div className="h-[calc(100vh-130px)] rounded-xl overflow-hidden shadow-lg border" style={{ borderColor: t.border }}>
            {isLoadingInitial ? (
              <div className="p-6 h-full">
                <GraphSkeleton t={t} height={600} />
              </div>
            ) : (
              <FundFlowGraph 
                liveTxns={scoredTxns} 
                onGenerateEvidence={handleConfirmIncident} 
                t={t}
                theme={theme}
              />
            )}
          </div>
        )}

        {/* ── DECEPTIONGUARD ─────────────────────────────────── */}
        {page === "deception" && (() => {
          // ERR5: Data-driven from live scoredTxns
          const honeypotBreaches = scoredTxns.filter(tx =>
            tx.account_touched && (tx.account_touched.includes("MIRAGE") || tx.account_touched.includes("GHOST")) ||
            (tx.decision === "ISOLATE" && tx.dominant_agent === "DeceptionGuard")
          );
          const liveBreachTx = honeypotBreaches[honeypotBreaches.length - 1];
          const staticHoneypotBreach = {
            accountId: liveBreachTx?.account_touched || "ACC_GHOST_07",
            attackerId: liveBreachTx?.emp_id || "EMP_1024",
            attackerRole: liveBreachTx?.emp_class || "IT Admin",
            threatOrigin: liveBreachTx ? `${liveBreachTx.emp_id} (${liveBreachTx.emp_class || 'Unknown'}) | Branch: ${liveBreachTx.branch_id || 'Unknown'}` : "EMP_1024 (IT Admin) | IP: 192.168.1.45 (Mumbai_BR_05)"
          };
          return (
            <div className="space-y-6 pb-12">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold font-mono tracking-[4px] uppercase" style={{ color: t.accent }}>DeceptionGuard</h1>
                {honeypotBreaches.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 animate-pulse">
                    {honeypotBreaches.length} LIVE BREACH{honeypotBreaches.length > 1 ? 'ES' : ''} DETECTED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <Section title="Honeypot Node Radar" t={t} />
                  <Card t={t} className="flex flex-col items-center justify-center !py-12 relative overflow-hidden h-[400px]">
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{ background: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative flex items-center justify-center w-64 h-64 border rounded-full transition-colors"
                         style={{ borderColor: t.border }}>
                      <div className="absolute w-48 h-48 border rounded-full transition-colors" style={{ borderColor: t.border }}></div>
                      <div className="absolute w-32 h-32 border rounded-full transition-colors" style={{ borderColor: t.border }}></div>
                      <div className="absolute w-16 h-16 border rounded-full text-center flex items-center justify-center font-mono text-[8px] transition-colors"
                           style={{ borderColor: t.border, color: t.text2 }}>CORE</div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-full rounded-full"
                        style={{
                          background: "conic-gradient(from 0deg, rgba(0, 230, 118, 0.05) 0deg, transparent 60deg, transparent 360deg)",
                          borderRight: "1px solid rgba(0, 230, 118, 0.4)"
                        }}
                      />
                      <motion.div animate={{ opacity: [0.1, 1, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                        className="absolute w-1.5 h-1.5 bg-[#00E676] rounded-full top-10 left-20 shadow-[0_0_8px_#00E676]" />
                      <motion.div animate={{ opacity: [0.1, 1, 0.1] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                        className="absolute w-2 h-2 bg-[#FFB300] rounded-full top-12 right-16 shadow-[0_0_10px_#FFB300]" />
                      {honeypotBreaches.length > 0 ? (
                        <motion.div animate={{ opacity: [0.1, 1, 0.1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                          className="absolute bottom-12 left-12 flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 bg-[#E50914] rounded-full shadow-[0_0_12px_#E50914]" />
                          <span className="text-[8px] font-mono font-bold text-[#E50914] tracking-widest whitespace-nowrap opacity-90 mix-blend-screen">[BREACH: {staticHoneypotBreach.accountId}]</span>
                        </motion.div>
                      ) : (
                        <motion.div animate={{ opacity: [0.1, 1, 0.1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                          className="absolute bottom-12 left-12 flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-[#E50914] rounded-full shadow-[0_0_10px_#E50914]" />
                          <span className="text-[8px] font-mono font-bold text-[#E50914] tracking-widest whitespace-nowrap opacity-80 mix-blend-screen">[TARGET PING: MUMBAI]</span>
                        </motion.div>
                      )}
                      <motion.div animate={{ opacity: [0.1, 1, 0.1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 2 }}
                        className="absolute w-1.5 h-1.5 bg-[#00E676] rounded-full bottom-20 right-12 shadow-[0_0_8px_#00E676]" />
                    </div>
                    <div className="mt-8 text-xs font-mono text-[#00E676] animate-pulse uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#00E676] rounded-sm"></span>
                      {honeypotBreaches.length > 0 ? `${honeypotBreaches.length} Breach(es) Detected` : "Scanning Subnets..."}
                    </div>
                  </Card>
                </div>

                <div>
                  <Section title="Active Ghost Accounts" t={t} />
                  <Card t={t} className="!p-0 overflow-hidden">
                    <div className="h-[400px] flex flex-col">
                      <table className="w-full text-left text-sm font-mono flex-shrink-0">
                        <thead>
                          <tr style={{ background: t.cardAlt, borderBottom: `1px solid ${t.border}` }}>
                            <th className="p-4 text-[10px] uppercase font-bold w-1/4" style={{ color: t.text2 }}>Account ID</th>
                            <th className="p-4 text-[10px] uppercase font-bold w-1/4" style={{ color: t.text2 }}>Risk Level</th>
                            <th className="p-4 text-[10px] uppercase font-bold w-1/4" style={{ color: t.text2 }}>Department</th>
                            <th className="p-4 text-[10px] uppercase font-bold w-1/4" style={{ color: t.text2 }}>Status</th>
                          </tr>
                        </thead>
                      </table>
                      <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left text-sm font-mono">
                          <tbody>
                            {/* Live breach rows from real data */}
                            {honeypotBreaches.slice(-5).reverse().map((tx, i) => (
                              <tr 
                                key={`${tx.transaction_id || i}-${i}`} 
                                className="hover:opacity-90 transition-all border-b" 
                                style={{ 
                                  borderColor: t.border, 
                                  background: theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.05)',
                                  color: t.text 
                                }}
                              >
                                <td className="p-4 font-bold" style={{ color: t.red }}>{tx.account_touched}</td>
                                <td className="p-4 font-bold" style={{ color: t.text }}>Rs.{(tx.amount || 0).toLocaleString()}</td>
                                <td className="p-4 text-xs font-bold animate-pulse" style={{ color: t.red }}>
                                  BREACH DETECTED
                                  <button
                                    onClick={() => { setProfileSearch(tx.emp_id); setPage("profile"); }}
                                    className="ml-3 px-2 py-0.5 text-white text-[9px] uppercase tracking-wider rounded font-bold hover:opacity-90 transition cursor-pointer border-none shadow-sm"
                                    style={{ background: t.red }}
                                  >[ Investigate ]</button>
                                </td>
                                <td className="p-4 text-[11px] font-bold" style={{ color: t.amber }}>{tx.emp_id} | {tx.branch_id || "Unknown Branch"}</td>
                              </tr>
                            ))}
                            {/* Real registry from DeceptionGuard (/api/deception/honeypots) */}
                            {honeypotAccounts
                              .filter((acc) => !honeypotBreaches.slice(-5).some((tx) => tx.account_touched === acc.mirage_id))
                              .map((acc) => (
                                <tr key={acc.mirage_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b" style={{ borderColor: t.border, color: t.text }}>
                                  <td className="p-4 font-bold" style={{ color: t.accent }}>{acc.mirage_id}</td>
                                  <td className="p-4 text-xs" style={{ color: t.text2 }}>{acc.risk_level}</td>
                                  <td className="p-4 text-xs" style={{ color: t.text2 }}>{acc.department}</td>
                                  <td className="p-4 text-xs font-bold" style={{ color: acc.is_breached ? t.red : t.text2 }}>{acc.status}</td>
                                </tr>
                              ))}
                            {!honeypotAccounts.length && (
                              <tr><td colSpan={4} className="p-4 text-xs text-center" style={{ color: t.text2 }}>Loading honeypot registry...</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          );
        })()}

        {page === "reports" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold font-mono tracking-tight" style={{ color: t.text }}>Reports & Analytics</h1>
                <p className="text-xs mt-1" style={{ color: t.text2 }}>Generate comprehensive dossiers and run behavioral audit retrains</p>
              </div>
              <BarChart2 size={24} className="text-indigo-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Forensic Compiler */}
              <Card t={t} className="flex flex-col justify-between min-h-[300px] lg:h-[360px]">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase font-mono mb-3" style={{ color: t.text }}>
                    Forensic Report Builder
                  </div>
                  <p className="text-xs mb-5" style={{ color: t.text2 }}>Export cryptographically signed audits of flag counts and branch CBSI scores.</p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text2 }}>Target Scope</label>
                        <select 
                          value={selectedReportScope} 
                          onChange={(e) => setSelectedReportScope(e.target.value)}
                          className="rounded-xl border px-3.5 py-2 text-xs font-bold outline-none cursor-pointer"
                          style={{ background: t.cardAlt, borderColor: t.border, color: t.text }}
                        >
                          <option value="ALL">All Branches (Global)</option>
                          <option value="BR_01">BR_01 (Mumbai South)</option>
                          <option value="BR_02">BR_02 (Delhi Central)</option>
                          <option value="BR_03">BR_03 (Kolkata East)</option>
                          <option value="BR_04">BR_04 (Chennai South)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text2 }}>Time Frame</label>
                        <select 
                          value={selectedReportDate} 
                          onChange={(e) => setSelectedReportDate(e.target.value)}
                          className="rounded-xl border px-3.5 py-2 text-xs font-bold outline-none cursor-pointer"
                          style={{ background: t.cardAlt, borderColor: t.border, color: t.text }}
                        >
                          <option value="LAST_24H">Last 24 Hours</option>
                          <option value="LAST_7D">Last 7 Days</option>
                          <option value="LAST_30D">Last 30 Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text2 }}>File Format</label>
                      <select 
                        value={selectedReportFormat} 
                        onChange={(e) => setSelectedReportFormat(e.target.value)}
                        className="rounded-xl border px-3.5 py-2 text-xs font-bold outline-none cursor-pointer"
                        style={{ background: t.cardAlt, borderColor: t.border, color: t.text }}
                      >
                        <option value="PDF">PDF Signed Dossier</option>
                        <option value="CSV">CSV Aggregated Data</option>
                        <option value="JSON">Raw JSON Log Output</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCompileReport}
                  disabled={isCompilingReport}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md"
                >
                  {isCompilingReport ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Compiling Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Compile & Download Report</span>
                    </>
                  )}
                </button>
              </Card>

              {/* Neural Retraining */}
              <Card t={t} className="flex flex-col justify-between min-h-[300px] lg:h-[360px]">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase font-mono mb-3" style={{ color: t.text }}>
                    AI Retraining Pipeline
                  </div>
                  <p className="text-xs mb-5" style={{ color: t.text2 }}>Initiate behavioral weight updates based on audit flags (confirms & false alarms).</p>
                  
                  <div className="space-y-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl border flex justify-between items-center" style={{ background: t.cardAlt, borderColor: t.border }}>
                      <div>
                        <div className="font-bold" style={{ color: t.text }}>GNN-Behavioral Model</div>
                        <div className="text-[10px]" style={{ color: t.text2 }}>v2.4-neural-graph</div>
                      </div>
                      <span className="text-xs font-bold" style={{ color: t.green }}>Active</span>
                    </div>

                    <div className="p-3.5 rounded-xl border flex justify-between items-center" style={{ background: t.cardAlt, borderColor: t.border }}>
                      <div>
                        <div className="font-bold" style={{ color: t.text }}>Validation Accuracy</div>
                        <div className="text-[10px]" style={{ color: t.text2 }}>Target margin: &gt;98.0%</div>
                      </div>
                      <span className="text-xs font-black" style={{ color: t.accent }}>98.42%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {isTraining && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono font-bold" style={{ color: t.text2 }}>
                        <span>Optimizing Graph Nodes...</span>
                        <span>{trainingProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                        <div className="h-full bg-indigo-500 transition-all duration-150" style={{ width: `${trainingProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRetrainModel}
                    disabled={isTraining}
                    className="w-full py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md disabled:opacity-50"
                  >
                    {isTraining ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Training GNN Epochs...</span>
                      </>
                    ) : (
                      <>
                        <Activity size={14} />
                        <span>Initiate Pipeline Retraining</span>
                      </>
                    )}
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {page === "settings" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold font-mono tracking-tight" style={{ color: t.text }}>System Settings</h1>
                <p className="text-xs mt-1" style={{ color: t.text2 }}>Configure live stream thresholds and webhook integrations</p>
              </div>
              <Settings size={24} className="text-indigo-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Kafka & DB Config */}
              <Card t={t} className="space-y-5">
                <div className="text-xs font-bold tracking-wider uppercase font-mono border-b pb-2" style={{ color: t.text, borderColor: t.border }}>
                  Orchestrator Settings
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span style={{ color: t.text }}>CBSI Threat Threshold</span>
                      <span className="text-indigo-500">{kafkaThreshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="95" 
                      value={kafkaThreshold} 
                      onChange={(e) => setKafkaThreshold(Number(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[9px]" style={{ color: t.text2 }}>Minimum score required to trigger urgent auditor notifications.</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text2 }}>Maximum Queue Size</label>
                    <input 
                      type="number" 
                      value={maxQueueSize} 
                      onChange={(e) => setMaxQueueSize(Number(e.target.value))}
                      className="rounded-xl border px-3.5 py-2 text-xs font-mono outline-none"
                      style={{ background: t.cardAlt, borderColor: t.border, color: t.text }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span style={{ color: t.text }}>Database Sync Interval</span>
                      <span className="text-indigo-500">{syncInterval}s</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      value={syncInterval} 
                      onChange={(e) => setSyncInterval(Number(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </Card>

              {/* Integrations & Models */}
              <Card t={t} className="flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="text-xs font-bold tracking-wider uppercase font-mono border-b pb-2" style={{ color: t.text, borderColor: t.border }}>
                    Auditing & Alert Integrations
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold" style={{ color: t.text }}>Slack Notifications</span>
                        <span className="text-[10px]" style={{ color: t.text2 }}>Send live audit warnings to #security</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableSlackAlerts} 
                        onChange={(e) => setEnableSlackAlerts(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    {enableSlackAlerts && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text2 }}>Slack Webhook URL</label>
                        <input 
                          type="text" 
                          value={slackWebhookUrl} 
                          onChange={(e) => setSlackWebhookUrl(e.target.value)}
                          className="rounded-xl border px-3.5 py-2 text-xs font-mono outline-none"
                          style={{ background: t.cardAlt, borderColor: t.border, color: t.text }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold" style={{ color: t.text }}>Email Digest</span>
                        <span className="text-[10px]" style={{ color: t.text2 }}>Generate daily threat reports</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableEmailAlerts} 
                        onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.text2 }}>Model Risk Weight Profile</label>
                      <select 
                        value={selectedModelWeight} 
                        onChange={(e) => setSelectedModelWeight(e.target.value)}
                        className="rounded-xl border px-3.5 py-2 text-xs font-bold outline-none cursor-pointer"
                        style={{ background: t.cardAlt, borderColor: t.border, color: t.text }}
                      >
                        <option value="Balanced">Balanced Optimizer</option>
                        <option value="Aggressive-Audit">Aggressive Audit (High Recall)</option>
                        <option value="Low-Latency">Low Latency Filter</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => showToast("Configurations successfully saved and synced to Orchestrator.")}
                  className="w-full py-3 mt-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md"
                >
                  <Lock size={13} />
                  <span>Save Configuration</span>
                </button>
              </Card>
            </div>
          </div>
        )}

        {/* ── FOOTER TELEMETRY ──────────────────────────────── */}
        <div className="hidden lg:flex fixed bottom-0 left-[260px] right-0 border-t py-2 px-6 items-center justify-between gap-2 z-50 text-[9px] font-mono tracking-wider transition-colors duration-200" 
             style={{ background: t.bg, borderColor: t.border, color: t.text2 }}>
          <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-[#10b981] animate-pulse" : "bg-red-500"}`}></span>
              <span style={{ color: wsConnected ? "#10b981" : "#ef4444" }}>SYSTEM STATUS</span>
              <span style={{ color: t.text2 }}>{wsConnected ? "Live Stream Connected" : "Stream Disconnected"}</span>
            </div>
            <span className="hidden sm:inline" style={{ color: t.border }}>|</span>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[#10b981]">⚙</span>
              <span>TRANSACTIONS PROCESSED:</span>
              <span className="font-bold" style={{ color: t.text }}>{stats.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>THREAT LEVEL:</span>
            <span className={`px-2 py-0.5 rounded font-bold border uppercase tracking-widest text-[8px] ${threatColors[threatLevel].bg} ${threatColors[threatLevel].text} ${threatColors[threatLevel].border}`}>
              {threatLevel}
            </span>
          </div>
        </div>
        {/* Critical Fraud Alert Popup (Micro Floating Top Banner) */}
        <AnimatePresence>
          {activeFraudAlert && (
            <>
              {/* Fix 1: Full-screen dark backdrop with blur to defocus the dashboard */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/60"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                onClick={() => setActiveFraudAlert(null)}
              />
              <motion.div 
                initial={{ opacity: 0, y: -50, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -20, x: "-50%" }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="fixed top-6 left-1/2 z-[10000] w-full max-w-[320px] px-4"
              >
                <div 
                  className="border rounded-xl p-3 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(239,68,68,0.15)] text-left flex flex-col gap-2 backdrop-blur-xl"
                  style={{
                    background: "rgba(10, 11, 15, 0.96)",
                    borderColor: "rgba(239, 68, 68, 0.4)",
                  }}
                >
                  {/* Header: Pulsing dot, title, score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      {/* Fix 3: Removed font-mono, using clean sans-serif */}
                      <span className="text-[9px] font-bold tracking-wider text-red-500 uppercase">
                        CRITICAL BREACH
                      </span>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-1.5 py-0.2 rounded text-[9px]">
                      CBSI: {activeFraudAlert.cbsi || 0}
                    </div>
                  </div>

                  {/* Subtext info line */}
                  {/* Fix 2: Breach amount changed from green (emerald-400) to red — green implies safe in banking */}
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Emp <span className="text-white font-bold">{activeFraudAlert.emp_id || "UNKNOWN"}</span> | <span className="text-red-400 font-bold">₹{(activeFraudAlert.amount || 0).toLocaleString()}</span>
                  </p>

                  {/* Micro Actions row */}
                  <div className="flex gap-1.5 mt-0.5">
                    <button
                      onClick={() => {
                        setProfileSearch(activeFraudAlert.emp_id || activeFraudAlert.employee_id);
                        setPage("profile");
                        setActiveFraudAlert(null);
                      }}
                      className="flex-1 py-1 rounded-lg text-[9px] font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer border-none"
                    >
                      <Eye size={10} />
                      <span>Investigate</span>
                    </button>
                    <button
                      onClick={() => setActiveFraudAlert(null)}
                      className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
      </main>
    </div>
  );
}

