import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Path, G, Marker, Defs } from 'react-native-svg';
import { Info } from 'lucide-react-native';

export function ProfileView({
  styles,
  COLORS,
  uniqueEmployeesInTxns,
  graphSelectedEmpId,
  setGraphSelectedEmpId,
  scoredTxns,
  width,
  dashOffset,
  destinationAccounts,
  selectedEmpPeak,
  showProfileModal
}: any) {
  return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.pageTitleRow}>
              <Text style={styles.pageTitle}>Fund Flow Graph</Text>
              <View style={[styles.liveIndicator, { backgroundColor: COLORS.cyan + '20' }]}>
                <Text style={[styles.liveIndicatorText, { color: COLORS.cyan }]}>NETWORK FLOW</Text>
              </View>
            </View>

            {/* Flagged Employees Selection list */}
            <View style={styles.graphSelectorContainer}>
              <Text style={styles.graphSelectorTitle}>SELECT EMPLOYEE FOCUS:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.graphSelectorScroll}>
                {uniqueEmployeesInTxns.map((empId: string) => {
                  const isSelected = graphSelectedEmpId === empId;
                  const empTxns = scoredTxns.filter((tx: any) => tx.emp_id === empId);
                  const maxCbsi = Math.max(...empTxns.map((tx: any) => tx.cbsi || 0), 0);
                  const isFraud = maxCbsi >= 70;
                  return (
                    <TouchableOpacity
                      key={empId}
                      style={[
                        styles.graphSelectorTag,
                        isSelected && styles.graphSelectorTagActive,
                        { borderColor: isFraud ? COLORS.red : COLORS.cyan }
                      ]}
                      onPress={() => setGraphSelectedEmpId(empId)}
                    >
                      <Text style={[
                        styles.graphSelectorTagText,
                        isSelected && styles.graphSelectorTagTextActive,
                        { color: isFraud ? COLORS.red : COLORS.cyan }
                      ]}>
                        {empId} ({maxCbsi})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Svg Canvas container */}
            <View style={styles.graphCanvasContainer}>
              <Svg width={width - 32} height={360}>
                <Defs>
                  <Marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <Path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
                  </Marker>
                  <Marker id="arrow-red" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <Path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.red} />
                  </Marker>
                </Defs>

                {/* Draw flow lines */}
                {destinationAccounts.map((acc: any, i: number) => {
                  const angle = (2 * Math.PI * i) / destinationAccounts.length;
                  const centerX = (width - 32) / 2;
                  const centerY = 180;
                  const radius = 100;
                  const nodeX = centerX + radius * Math.cos(angle);
                  const nodeY = centerY + radius * Math.sin(angle);
                  const isFraudFlow = acc.cbsi >= 70;
                  
                  return (
                    <G key={acc.id}>
                      <Line
                        x1={centerX}
                        y1={centerY}
                        x2={nodeX}
                        y2={nodeY}
                        stroke={isFraudFlow ? COLORS.red : '#444'}
                        strokeWidth={isFraudFlow ? 3 : 1.5}
                        strokeDasharray="6, 6"
                        strokeDashoffset={dashOffset}
                      />
                    </G>
                  );
                })}

                {/* Draw center node */}
                {(() => {
                  const centerX = (width - 32) / 2;
                  const centerY = 180;
                  return (
                    <G>
                      <Circle
                        cx={centerX}
                        cy={centerY}
                        r={24}
                        fill="#16181f"
                        stroke={selectedEmpPeak >= 70 ? COLORS.red : COLORS.cyan}
                        strokeWidth={2}
                      />
                      <Circle
                        cx={centerX}
                        cy={centerY}
                        r={18}
                        fill={selectedEmpPeak >= 70 ? COLORS.red + '33' : COLORS.cyan + '33'}
                      />
                      <SvgText
                        x={centerX}
                        y={centerY + 4}
                        fill="#fff"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {graphSelectedEmpId.slice(-4)}
                      </SvgText>
                    </G>
                  );
                })()}

                {/* Draw outer nodes */}
                {destinationAccounts.map((acc: any, i: number) => {
                  const angle = (2 * Math.PI * i) / destinationAccounts.length;
                  const centerX = (width - 32) / 2;
                  const centerY = 180;
                  const radius = 100;
                  const nodeX = centerX + radius * Math.cos(angle);
                  const nodeY = centerY + radius * Math.sin(angle);
                  
                  return (
                    <G key={acc.id}>
                      <Circle
                        cx={nodeX}
                        cy={nodeY}
                        r={16}
                        fill="#16181f"
                        stroke={acc.isHoneypot ? COLORS.amber : '#555'}
                        strokeWidth={2}
                      />
                      <Circle
                        cx={nodeX}
                        cy={nodeY}
                        r={12}
                        fill={acc.isHoneypot ? COLORS.amber + '33' : '#55555533'}
                      />
                      <SvgText
                        x={nodeX}
                        y={nodeY + 3}
                        fill="#fff"
                        fontSize="6"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {acc.id.slice(-4)}
                      </SvgText>
                      <SvgText
                        x={(centerX + nodeX) / 2}
                        y={(centerY + nodeY) / 2 - 4}
                        fill="#aaa"
                        fontSize="7"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        Rs.{acc.amount >= 100000 ? `${(acc.amount / 100000).toFixed(1)}L` : acc.amount.toLocaleString()}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            </View>

            {/* Bottom Node Inspector card */}
            <View style={styles.graphInspectorCard}>
              <View style={styles.graphInspectorHeader}>
                <Text style={styles.graphInspectorEmpId}>{graphSelectedEmpId}</Text>
                <Text style={[styles.graphInspectorCbsi, { color: selectedEmpPeak >= 70 ? COLORS.red : COLORS.cyan }]}>
                  {selectedEmpPeak} Peak CBSI
                </Text>
              </View>
              <Text style={styles.graphInspectorText}>
                Active connections: {destinationAccounts.length} destination accounts.
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.cyan }]}
                  onPress={() => showProfileModal(graphSelectedEmpId)}
                >
                  <Info color="#fff" size={13} />
                  <Text style={styles.actionBtnText}>INSPECT PROFILE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
  );
}
