import React from "react";
import { Search } from "lucide-react";
import { Card } from "../components/Card.jsx";
import { Badge } from "../components/Badge.jsx";
import { riskTier, forceDownloadPDF } from "../utils.js";
import { ForensicTimeline, GlassBoxEngine, BlastRadius, ShapSimulator, GNNThreatNode, HistoricalContext } from "../ProfileComponents.jsx";
import { ProfileTabs } from "../components/ProfileTabs.jsx";

export function ProfileView({
  t,
  tc,
  theme,
  profileSearch,
  setProfileSearch,
  scoredTxns,
  confirmedIncidents,
  falseAlarms,
  employeeMetadata,
  userRole,
  handleConfirmIncident,
  handleFalseAlarm
}) {
  return (
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
                    const sortedFlagged = [...flaggedTxns].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
                    const recentNormal = [...txns]
                      .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
                      .filter(tx => !sortedFlagged.some(s => s.transaction_id === tx.transaction_id));
                    
                    const pool = [...recentNormal.slice(-8), ...sortedFlagged.slice(-7)];
                    pool.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
                    return pool.slice(-15).map(tx => {
                      const actionName = (tx.action_type || 'Execute').split(' ')[0];
                      const tagVal = tx.transfer_channel || (tx.action_type || 'SYSTEM_AUDIT').toUpperCase().replace(/[^A-Z0-9]/g, '_');
                      const tierVal = riskTier(tx.cbsi);
                      const variantVal = (tierVal === 'CRITICAL' || tierVal === 'HIGH' || tx.is_fraud_flag) ? 'destructive' : 'outline';
                      const subtextVal = tx.reason ? `Bypass Reason: ${tx.reason}` : (tx.destination_account ? `Target A/c: ${tx.destination_account}` : `Target A/c: ${tx.account_touched || 'XXXXX9082'}`);
                      return {
                        time: tx.timestamp ? tx.timestamp.slice(11, 19) : 'N/A',
                        action: actionName,
                        tag: tagVal,
                        tagVariant: variantVal,
                        amount: `Rs. ${(tx.amount || 0).toLocaleString()}`,
                        subtext: subtextVal,
                        tier: tierVal,
                        text: `${tx.action_type} - Rs.${(tx.amount || 0).toLocaleString()}`
                      };
                    });
                  })()} t={t} theme={theme} />
                </div>
              )}

              <ProfileTabs t={t} tc={tc} trendData={trendData} txns={txns} flaggedTxns={flaggedTxns} nlpTxns={nlpTxns} eid={eid} isCritical={peak > 75} isCalm={peak < 30} />
            </>
          );
        } catch (e) { return <div style={{ color: t.red }}>Profile error: {String(e)}</div>; }
      })()}
    </div>
  );
}
