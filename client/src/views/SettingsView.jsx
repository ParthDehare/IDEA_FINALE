import React from "react";
import { Settings, Lock } from "lucide-react";
import { Card } from "../components/Card.jsx";

export function SettingsView({
  t,
  kafkaThreshold,
  setKafkaThreshold,
  maxQueueSize,
  setMaxQueueSize,
  syncInterval,
  setSyncInterval,
  enableSlackAlerts,
  setEnableSlackAlerts,
  slackWebhookUrl,
  setSlackWebhookUrl,
  enableEmailAlerts,
  setEnableEmailAlerts,
  selectedModelWeight,
  setSelectedModelWeight,
  showToast
}) {
  return (
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
  );
}
