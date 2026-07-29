import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Switch, ActivityIndicator, SafeAreaView } from 'react-native';
import { User, Shield, Sliders, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, Search, ShieldAlert } from 'lucide-react-native';
import { getRiskTier } from '../components/CommonUI';

export function ProfileDetailModal({
  styles,
  COLORS,
  profileModalVisible,
  setProfileModalVisible,
  selectedEmployee,
  selectedEmpId,
  setSelectedEmpId,
  profileSearch,
  setProfileSearch,
  selectedEmpMeta,
  selectedEmpPeak,
  movingAvg,
  activeProfileTab,
  setActiveProfileTab,
  timelineEvents,
  timelinePlaying,
  timelineVisibleCount,
  setTimelineVisibleCount,
  startTimelineSimulation,
  simWithdrawal,
  setSimWithdrawal,
  simOffHours,
  setSimOffHours,
  simChannel,
  setSimChannel,
  simAction,
  setSimAction,
  simulatedScore,
  simulatedRules,
  loadingExplanation,
  explanation,
  explanationError,
  fetchExplanation,
  handleAction,
  TIER_COLORS,
  sharedIpPeer
}: any) {
  return (
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          {/* Modal Header */}
          <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: '#222', paddingHorizontal: 16 }]}>
            <View>
              <Text style={styles.headerTitle}>PROFILE DOSSIER</Text>
              <Text style={{ color: COLORS.text2, fontSize: 9, fontFamily: 'monospace' }}>
                AUDIT LOGS & GLASSBOX INTERACTIVE
              </Text>
            </View>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={{ padding: 6 }}>
              <XCircle color="#ff4d4d" size={22} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Search Input */}
            <View style={styles.profileSearchRow}>
              <TextInput
                style={styles.profileSearchInput}
                value={profileSearch}
                onChangeText={setProfileSearch}
                placeholder="Lookup employee (e.g. EMP_1024)..."
                placeholderTextColor="#666"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.profileSearchBtn}
                onPress={() => {
                  if (profileSearch.trim()) {
                    setSelectedEmpId(profileSearch.trim().toUpperCase());
                  }
                }}
              >
                <Search color="#fff" size={14} />
              </TouchableOpacity>
            </View>

            {/* Profile Header Summary */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.profileHeaderTop}>
                <View>
                  <Text style={styles.profileTitleText}>{selectedEmpId}</Text>
                  <Text style={styles.profileMetaText}>
                    Class: {selectedEmpMeta.emp_class} | Branch: {selectedEmpMeta.branch_id}
                  </Text>
                </View>
                <View
                  style={[
                    styles.profileRiskBadge,
                    {
                      borderColor: TIER_COLORS[getRiskTier(selectedEmpPeak)],
                      backgroundColor: TIER_COLORS[getRiskTier(selectedEmpPeak)] + '15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.profileRiskBadgeText,
                      { color: TIER_COLORS[getRiskTier(selectedEmpPeak)] },
                    ]}
                  >
                    {getRiskTier(selectedEmpPeak)} ({selectedEmpPeak} CBSI)
                  </Text>
                </View>
              </View>

              {/* Moving Average Volume (Historical Context) */}
              <View style={styles.profileHistoryRow}>
                <Text style={styles.profileHistoryLabel}>7-DAY MOVING AVG VOLUME:</Text>
                <Text style={styles.profileHistoryValue}>
                  {movingAvg !== null ? `Rs. ${movingAvg.toLocaleString()}` : 'No historical logs'}
                </Text>
              </View>
            </View>

            {/* GNN Structural Anomaly warning banner */}
            {selectedEmpPeak >= 85 && (
              <View style={styles.gnnWarningBanner}>
                <ShieldAlert color={COLORS.red} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.gnnWarningTitle}>GNN STRUCTURAL ANOMALY</Text>
                  <Text style={styles.gnnWarningText}>
                    Graph Neural Network detected suspicious peer-to-peer money layering pattern.
                  </Text>
                </View>
              </View>
            )}

            {/* Profile Subtabs */}
            <View style={styles.profileTabsRow}>
              <TouchableOpacity
                style={[
                  styles.profileTabButton,
                  activeProfileTab === 'timeline' && styles.activeProfileTabButton,
                ]}
                onPress={() => setActiveProfileTab('timeline')}
              >
                <Text style={styles.profileTabButtonText}>Timeline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.profileTabButton,
                  activeProfileTab === 'glassbox' && styles.activeProfileTabButton,
                ]}
                onPress={() => setActiveProfileTab('glassbox')}
              >
                <Text style={styles.profileTabButtonText}>GlassBox</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.profileTabButton,
                  activeProfileTab === 'shap' && styles.activeProfileTabButton,
                ]}
                onPress={() => setActiveProfileTab('shap')}
              >
                <Text style={styles.profileTabButtonText}>SHAP Sim</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.profileTabButton,
                  activeProfileTab === 'blast' && styles.activeProfileTabButton,
                ]}
                onPress={() => setActiveProfileTab('blast')}
              >
                <Text style={styles.profileTabButtonText}>Blast Radius</Text>
              </TouchableOpacity>
            </View>

            {/* Subtab Contents */}
            {activeProfileTab === 'timeline' && (
              <View style={styles.subtabContent}>
                <View style={styles.subtabHeaderRow}>
                  <Text style={styles.subtabTitle}>Forensic Action Timeline</Text>
                  <TouchableOpacity 
                    style={styles.playbackBtn} 
                    onPress={startTimelineSimulation}
                    disabled={timelinePlaying}
                  >
                    <Play color="#fff" size={10} fill={timelinePlaying ? '#888' : '#fff'} />
                    <Text style={styles.playbackBtnText}>
                      {timelinePlaying ? 'SIMULATING...' : 'PLAY CCTV'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {timelineEvents.length === 0 ? (
                  <Text style={styles.emptySubText}>No transactions logged for this employee.</Text>
                ) : (
                  timelineEvents
                    .slice(0, timelinePlaying ? timelineVisibleCount : timelineEvents.length)
                    .map((item: any, idx: number) => {
                      const c = TIER_COLORS[item.tier];
                      return (
                        <View key={idx} style={[styles.timelineItem, { borderLeftColor: c }]}>
                          <View style={[styles.timelinePoint, { backgroundColor: c }]} />
                          <Text style={styles.timelineTime}>{item.time}</Text>
                          <Text style={styles.timelineDesc}>{item.text}</Text>
                          <Text style={styles.timelineDetails}>
                            CBSI Score: <Text style={{ color: c, fontWeight: 'bold' }}>{item.cbsi}</Text>
                          </Text>
                        </View>
                      );
                    })
                )}
              </View>
            )}

            {activeProfileTab === 'glassbox' && (
              <View style={styles.subtabContent}>
                <Text style={styles.subtabTitle}>AI Decision Explanation</Text>
                
                {/* Live Explainer explanation */}
                <View style={[styles.explainerCard, { borderColor: selectedEmpPeak >= 70 ? COLORS.red : COLORS.green }]}>
                  {loadingExplanation ? (
                    <View style={styles.loadingWrapper}>
                      <ActivityIndicator color={COLORS.accent} />
                      <Text style={styles.loadingText}>Synthesizing AI logic model...</Text>
                    </View>
                  ) : explanationError ? (
                    <Text style={styles.errorText}>{explanationError}</Text>
                  ) : (
                    <Text style={styles.explainerText}>
                      {explanation || 'No real-time decision explanation found. Run more simulation tests.'}
                    </Text>
                  )}
                </View>

                <Text style={[styles.subtabTitle, { marginTop: 16 }]}>Active Agent Parameters</Text>
                {/* Risk Factors */}
                <View style={styles.factorCard}>
                  <Text style={styles.factorName}>Behavioral Watch (Agent 3)</Text>
                  <View style={styles.progressBarWrapper}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${selectedEmpPeak > 60 ? 80 : 30}%`,
                          backgroundColor: selectedEmpPeak > 60 ? COLORS.red : COLORS.cyan,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.factorStatus}>
                    {selectedEmpPeak > 60
                      ? 'Detected abnormal bulk file export & non-matching roles'
                      : 'Empirical default baseline active'}
                  </Text>
                </View>

                <View style={styles.factorCard}>
                  <Text style={styles.factorName}>FundFlow Network Watch (Agent 5)</Text>
                  <View style={styles.progressBarWrapper}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${selectedEmpPeak > 75 ? 90 : 40}%`,
                          backgroundColor: selectedEmpPeak > 75 ? COLORS.red : COLORS.teal,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.factorStatus}>
                    {selectedEmpPeak > 75
                      ? 'High velocity flow detected through linked Accounts'
                      : 'Normal transactions flow monitored'}
                  </Text>
                </View>

                <View style={styles.factorCard}>
                  <Text style={styles.factorName}>NLP Sentiment Monitor (Agent 4)</Text>
                  <View style={styles.progressBarWrapper}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${selectedEmpPeak > 50 ? 75 : 10}%`,
                          backgroundColor: selectedEmpPeak > 50 ? COLORS.amber : COLORS.green,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.factorStatus}>
                    {selectedEmpPeak > 50
                      ? "Whistleblower/Extortion phrases matched in raw logs"
                      : "No critical keywords matched"}
                  </Text>
                </View>
              </View>
            )}

            {activeProfileTab === 'shap' && (
              <View style={styles.subtabContent}>
                <Text style={styles.subtabTitle}>SHAP Simulator & Explainer</Text>
                <Text style={styles.subtabSubtitle}>
                  Simulate the ML anomaly scoring by adjusting variables in real-time.
                </Text>

                {/* Simulated withdrawal amount */}
                <View style={styles.simulatorRow}>
                  <Text style={styles.simLabel}>
                    Withdrawal: Rs.{(simWithdrawal).toLocaleString()}
                  </Text>
                  <View style={styles.simButtonsContainer}>
                    <TouchableOpacity
                      style={styles.simBtn}
                      onPress={() => setSimWithdrawal((prev: any) => Math.max(0, prev - 1000000))}
                    >
                      <Text style={styles.simBtnText}>- 1M</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.simBtn}
                      onPress={() => setSimWithdrawal((prev: any) => prev + 1000000)}
                    >
                      <Text style={styles.simBtnText}>+ 1M</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Off-Hours Switch */}
                <View style={styles.simulatorRow}>
                  <Text style={styles.simLabel}>Off-Hours Activity (2 AM - 5 AM)</Text>
                  <Switch
                    trackColor={{ false: '#767577', true: COLORS.red + '66' }}
                    thumbColor={simOffHours ? COLORS.red : '#f4f3f4'}
                    onValueChange={setSimOffHours}
                    value={simOffHours}
                  />
                </View>

                {/* Action select */}
                <View style={styles.simulatorRow}>
                  <Text style={styles.simLabel}>Action Type</Text>
                  <View style={styles.simButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.simOptionBtn,
                        simAction === 'Initiate' && styles.activeSimOptionBtn,
                      ]}
                      onPress={() => setSimAction('Initiate')}
                    >
                      <Text style={styles.simOptionBtnText}>Initiate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.simOptionBtn,
                        simAction === 'SYSTEM_BULK_EXPORT' && styles.activeSimOptionBtn,
                      ]}
                      onPress={() => setSimAction('SYSTEM_BULK_EXPORT')}
                    >
                      <Text style={styles.simOptionBtnText}>Bulk Export</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Calculated Simulated CBSI */}
                <View style={styles.simResultCard}>
                  <Sliders color={COLORS.cyan} size={20} />
                  <View style={styles.simResultRight}>
                    <Text style={styles.simResultTitle}>Simulated Anomaly Score</Text>
                    <Text
                      style={[
                        styles.simResultValue,
                        { color: TIER_COLORS[getRiskTier(simulatedScore)] },
                      ]}
                    >
                      {simulatedScore} CBSI ({getRiskTier(simulatedScore)})
                    </Text>
                  </View>
                </View>

                {/* Triggered rules list */}
                <Text style={[styles.subtabSubtitle, { marginTop: 12 }]}>
                  Triggered ML Engine Rules:
                </Text>
                {simulatedRules.length === 0 ? (
                  <Text style={styles.emptySubText}>No high-risk parameters simulated.</Text>
                ) : (
                  simulatedRules.map((rule: any, idx: number) => (
                    <View key={idx} style={styles.simRuleRow}>
                      <AlertTriangle color={COLORS.amber} size={12} />
                      <Text style={styles.simRuleText}>{rule}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeProfileTab === 'blast' && (
              <View style={styles.subtabContent}>
                <Text style={styles.subtabTitle}>Blast Radius / Peer Contagion</Text>
                
                {sharedIpPeer ? (
                  <View style={[styles.explainerCard, { borderColor: COLORS.red }]}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <AlertTriangle color={COLORS.red} size={18} />
                      <Text style={[styles.simResultTitle, { color: COLORS.red, fontWeight: 'bold' }]}>
                        LATERAL MOVEMENT DETECTION
                      </Text>
                    </View>
                    <Text style={styles.explainerText}>
                      Employee shares the network terminal/IP address ({sharedIpPeer.sharedIp}) with active peer {sharedIpPeer.peerId}. High likelihood of shared physical terminal or credential theft.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.explainerCard, { borderColor: COLORS.green }]}>
                    <Text style={[styles.explainerText, { color: COLORS.green }]}>
                      No shared network nodes, terminal IP layering, or peer threat contagion detected for this profile.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
  );
}

export function FraudAlertModal({
  styles,
  COLORS,
  activeFraudAlert,
  setActiveFraudAlert,
  showProfileModal,
  handleAction
}: any) {
  return (
      <Modal
        visible={activeFraudAlert !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveFraudAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalAlertCard}>
            <View style={styles.modalAlertHeader}>
              <AlertTriangle color={COLORS.red} size={24} />
              <View>
                <Text style={styles.modalAlertTitle}>CRITICAL FRAUD THREAT</Text>
                <Text style={styles.modalAlertSubtitle}>ORCHESTRATOR CORRELATION</Text>
              </View>
            </View>

            {activeFraudAlert && (
              <View style={styles.modalAlertBody}>
                <View style={styles.modalAlertRow}>
                  <Text style={styles.modalAlertLabel}>EMPLOYEE ID:</Text>
                  <Text style={[styles.modalAlertValue, { color: COLORS.red }]}>
                    {activeFraudAlert.emp_id}
                  </Text>
                </View>
                <View style={styles.modalAlertRow}>
                  <Text style={styles.modalAlertLabel}>CBSI RISK INDEX:</Text>
                  <Text style={[styles.modalAlertValue, { color: COLORS.red }]}>
                    {activeFraudAlert.cbsi} / 100
                  </Text>
                </View>
                <View style={styles.modalAlertRow}>
                  <Text style={styles.modalAlertLabel}>AMOUNT:</Text>
                  <Text style={styles.modalAlertValue}>
                    Rs. {activeFraudAlert.amount?.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.modalAlertRow}>
                  <Text style={styles.modalAlertLabel}>DESTINATION:</Text>
                  <Text style={[styles.modalAlertValue, { color: COLORS.amber }]}>
                    {activeFraudAlert.account_touched}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalAlertActions}>
              <TouchableOpacity
                style={styles.modalAlertActionBtnConfirm}
                onPress={() => {
                  if (activeFraudAlert) {
                    handleAction(activeFraudAlert.emp_id, 'CONFIRM');
                  }
                  setActiveFraudAlert(null);
                }}
              >
                <Text style={styles.modalAlertActionBtnText}>ISOLATE & REPORT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalAlertActionBtnDismiss}
                onPress={() => setActiveFraudAlert(null)}
              >
                <Text style={[styles.modalAlertActionBtnText, { color: '#888' }]}>ACKNOWLEDGE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );
}
