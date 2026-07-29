import React from "react";
import { motion } from "framer-motion";
import { Card } from "../components/Card.jsx";
import { Section } from "../components/Section.jsx";

export function DeceptionView({
  t,
  theme,
  scoredTxns,
  honeypotAccounts,
  setProfileSearch,
  setPage
}) {
  const honeypotBreaches = scoredTxns.filter(tx =>
    (tx.account_touched && (tx.account_touched.includes("MIRAGE") || tx.account_touched.includes("GHOST"))) ||
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
}
