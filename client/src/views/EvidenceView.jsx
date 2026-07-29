import React from "react";
import { Search, FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "../components/Card.jsx";
import { KpiCard } from "../components/KpiCard.jsx";
import { Section } from "../components/Section.jsx";
import { forceDownloadPDF } from "../utils.js";

export function EvidenceView({
  t,
  vaultEvidence,
  evidenceSearch,
  setEvidenceSearch,
  evidencePage,
  setEvidencePage,
  newEvidenceIds,
  EVIDENCE_PER_PAGE,
  generateTarget,
  setGenerateTarget,
  isGeneratingDossier,
  lastGenerated,
  dossierOptions,
  handleGenerateDossier
}) {
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
}
