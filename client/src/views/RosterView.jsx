import React from "react";
import { User, GitBranch, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "../components/Card.jsx";
import { Badge } from "../components/Badge.jsx";

export function RosterView({
  t,
  empScores,
  rosterRole,
  setRosterRole,
  rosterTier,
  setRosterTier,
  rosterSearch,
  setRosterSearch,
  rosterPage,
  setRosterPage,
  setProfileSearch,
  setPage,
  ROWS_PER_PAGE,
  TIER_COLORS
}) {
  try {
    let filtered = [...empScores];
    if (rosterRole !== "ALL") filtered = filtered.filter((e) => e.emp_class === rosterRole);
    if (rosterTier !== "ALL") filtered = filtered.filter((e) => e.status === rosterTier);
    if (rosterSearch.trim()) filtered = filtered.filter((e) => e.emp_id.toLowerCase().includes(rosterSearch.toLowerCase()));
    
    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const cp = Math.min(rosterPage, totalPages);
    const slice = filtered.slice((cp - 1) * ROWS_PER_PAGE, cp * ROWS_PER_PAGE);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-mono tracking-tight" style={{ color: t.text }}>Employee Roster</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6">
          <select value={rosterRole} onChange={(e) => { setRosterRole(e.target.value); setRosterPage(1); }}
            className="rounded-xl border px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer outline-none focus:border-indigo-500" style={{ background: t.card, borderColor: t.border, color: t.text }}>
            <option value="ALL">All Roles</option>
            <option value="CLERK">CLERK</option>
            <option value="MANAGER">MANAGER</option>
            <option value="IT_ADMIN">IT_ADMIN</option>
            <option value="SENIOR_MGR">SENIOR_MGR</option>
            <option value="TELLER">TELLER</option>
            <option value="LOAN_OFFICER">LOAN_OFFICER</option>
            <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
            <option value="SWIFT_OPERATOR">SWIFT_OPERATOR</option>
            <option value="CORE_DBA">CORE_DBA</option>
            <option value="RISK_AUDITOR">RISK_AUDITOR</option>
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
      </div>
    );
  } catch (e) {
    return <div style={{ color: t.red }}>Roster error: {String(e)}</div>;
  }
}
