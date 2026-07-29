import React from "react";
import { BarChart2, Loader2, Download, Activity } from "lucide-react";
import { Card } from "../components/Card.jsx";

export function ReportsView({
  t,
  selectedReportScope,
  setSelectedReportScope,
  selectedReportDate,
  setSelectedReportDate,
  selectedReportFormat,
  setSelectedReportFormat,
  isCompilingReport,
  handleCompileReport,
  isTraining,
  trainingProgress,
  handleRetrainModel
}) {
  return (
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
  );
}
