import React from "react";
import { 
  Shield, AlertTriangle, TrendingUp, Lock, Activity, 
  AlertCircle 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar 
} from "recharts";
import { Card } from "../components/Card.jsx";
import { KpiCard } from "../components/KpiCard.jsx";
import WorldMap from "../components/WorldMap.jsx";
import { LoadingShimmer } from "../components/LoadingShimmer.jsx";
import { GraphSkeleton } from "../components/GraphSkeleton.jsx";
import { forceDownloadPDF } from "../utils.js";

export function DashboardView({
  t,
  theme,
  stats,
  trends,
  sparklines,
  isLoadingInitial,
  scoredTxns,
  confirmedIncidents,
  falseAlarms,
  setProfileSearch,
  setPage,
  cbsiTrendData
}) {
  return (
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
  );
}
