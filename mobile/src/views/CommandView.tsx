import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Shield, AlertTriangle, TrendingUp, CheckCircle, Activity, RefreshCw, XCircle } from 'lucide-react-native';
import ThreatMap from '../components/ThreatMap';
import { KpiCard, getRiskTier } from '../components/CommonUI';

export function CommandView({
  styles,
  COLORS,
  stats,
  trends,
  sparklines,
  fetchNextTransaction,
  theme,
  scoredTxns,
  confirmedIncidents,
  falseAlarms,
  employeeMetadata,
  showProfileModal,
  recentCriticalAlerts,
  recentTransactions,
  TIER_COLORS,
  handleAction
}: any) {
  return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Page Header */}
            <View style={styles.pageTitleRow}>
              <Text style={styles.pageTitle}>Command Centre</Text>
              <View style={styles.liveIndicator}>
                <Text style={styles.liveIndicatorText}>LIVE ALERTS</Text>
              </View>
            </View>

            {/* Quick manual fetch */}
            <TouchableOpacity style={styles.fetchBtn} onPress={fetchNextTransaction}>
              <RefreshCw color="#fff" size={14} />
              <Text style={styles.fetchBtnText}>Fetch Next Transaction</Text>
            </TouchableOpacity>

            {/* KPI Cards Horizontal Scroller with Sparklines */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiContainer}>
              <KpiCard
                title="TOTAL SCANNED"
                value={stats.total}
                color={COLORS.accent}
                COLORS={COLORS}
                trend={trends.total.trend}
                trendDirection={trends.total.direction}
                icon={Shield}
                sparkPoints={sparklines.total}
                styles={styles}
              />
              <KpiCard
                title="CRITICAL ALERTS"
                value={stats.critical}
                color={COLORS.red}
                COLORS={COLORS}
                trend={trends.critical.trend}
                trendDirection={trends.critical.direction}
                icon={AlertTriangle}
                sparkPoints={sparklines.critical}
                styles={styles}
              />
              <KpiCard
                title="HIGH-RISK FLAGS"
                value={stats.high}
                color={COLORS.amber}
                COLORS={COLORS}
                trend={trends.high.trend}
                trendDirection={trends.high.direction}
                icon={TrendingUp}
                sparkPoints={sparklines.high}
                styles={styles}
              />
              <KpiCard
                title="CONFIRMED FRAUD"
                value={stats.fraud}
                color={COLORS.green}
                COLORS={COLORS}
                trend={trends.fraud.trend}
                trendDirection={trends.fraud.direction}
                icon={CheckCircle}
                sparkPoints={sparklines.fraud}
                styles={styles}
              />
              <KpiCard
                title="AVG CBSI SCORE"
                value={stats.avg}
                color={COLORS.teal}
                COLORS={COLORS}
                trend={trends.avg.trend}
                trendDirection={trends.avg.direction}
                icon={Activity}
                sparkPoints={sparklines.avg}
                styles={styles}
              />
            </ScrollView>

            {/* Geographic Threat Map */}
            <ThreatMap
              theme={theme}
              scoredTxns={scoredTxns}
              confirmedIncidents={confirmedIncidents}
              falseAlarms={falseAlarms}
              employeeMetadata={employeeMetadata}
              onSelectEmployee={showProfileModal}
            />

            {/* Section: Critical Alerts */}
            <View style={styles.sectionHeader}>
              <AlertTriangle color={COLORS.red} size={15} />
              <Text style={styles.sectionTitle}>Critical Alerts (CBSI ≥ 70)</Text>
            </View>

            {recentCriticalAlerts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Waiting for incoming Kafka stream alerts...</Text>
              </View>
            ) : (
              recentCriticalAlerts.map((tx: any) => {
                const tier = getRiskTier(tx.cbsi);
                const c = TIER_COLORS[tier];
                const isConfirmed = confirmedIncidents.includes(tx.emp_id?.toUpperCase());
                const isFalse = falseAlarms.includes(tx.emp_id?.toUpperCase());

                return (
                  <View key={tx.transaction_id} style={[styles.alertCard, { borderLeftColor: c }]}>
                    <TouchableOpacity
                      onPress={() => showProfileModal(tx.emp_id)}
                    >
                      <View style={styles.alertHeader}>
                        <Text style={[styles.alertEmpId, { color: c }]}>{tx.emp_id}</Text>
                        <Text style={styles.alertMeta}>
                          {tx.action_type} | {tx.transfer_channel}
                        </Text>
                        <Text style={[styles.alertCbsi, { color: c }]}>{tx.cbsi} CBSI</Text>
                      </View>
                      <Text style={styles.alertAmount}>Rs. {(tx.amount || 0).toLocaleString()}</Text>
                      {tx.raw_complaint_text ? (
                        <Text style={styles.complaintText}>Complaint: {tx.raw_complaint_text}</Text>
                      ) : null}
                    </TouchableOpacity>

                    {/* Enforcement Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          styles.confirmBtn,
                          isConfirmed && styles.disabledBtn,
                        ]}
                        onPress={() => handleAction(tx.emp_id, 'CONFIRM')}
                        disabled={isConfirmed || isFalse}
                      >
                        <CheckCircle color="#fff" size={13} />
                        <Text style={styles.actionBtnText}>
                          {isConfirmed ? 'CONFIRMED' : 'CONFIRM'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.dismissBtn, isFalse && styles.disabledBtn]}
                        onPress={() => handleAction(tx.emp_id, 'FALSE_ALARM')}
                        disabled={isConfirmed || isFalse}
                      >
                        <XCircle color="#fff" size={13} />
                        <Text style={styles.actionBtnText}>{isFalse ? 'DISMISSED' : 'DISMISS'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Section: Live Transaction Stream */}
            <View style={styles.sectionHeader}>
              <Activity color={COLORS.cyan} size={15} />
              <Text style={styles.sectionTitle}>Live Activity Logs</Text>
            </View>

            {recentTransactions.map((tx: any) => {
              const c = TIER_COLORS[getRiskTier(tx.cbsi)];
              return (
                <TouchableOpacity
                  key={tx.transaction_id}
                  style={[styles.txRow, { borderLeftColor: c }]}
                  onPress={() => showProfileModal(tx.emp_id)}
                >
                  <View style={styles.txLeft}>
                    <Text style={styles.txEmpId}>{tx.emp_id}</Text>
                    <Text style={styles.txMeta}>{tx.action_type || 'Unknown'}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>Rs. {(tx.amount || 0).toLocaleString()}</Text>
                    <Text style={[styles.txCbsi, { color: c }]}>CBSI {tx.cbsi}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

  );
}
