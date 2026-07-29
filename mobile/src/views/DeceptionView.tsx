import React from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Path, G } from 'react-native-svg';
import { Database, Network } from 'lucide-react-native';

const AnimatedG = Animated.createAnimatedComponent(G);

export function DeceptionView({
  styles,
  COLORS,
  width,
  spin,
  honeypots
}: any) {
  return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.pageTitleRow}>
              <Text style={styles.pageTitle}>DeceptionGuard</Text>
              <View style={[styles.liveIndicator, { backgroundColor: COLORS.teal + '20' }]}>
                <Text style={[styles.liveIndicatorText, { color: COLORS.teal }]}>HONEYPOT MONITOR</Text>
              </View>
            </View>

            <Text style={styles.sectionDescText}>
              Decoy system accounts deployed in active memory bank. Any unauthorized read/access immediately alerts threat operations.
            </Text>

            {/* Radar Screen Section */}
            <View style={styles.radarCard}>
              <Svg width={width - 32} height={280}>
                <Circle cx={(width - 32) / 2} cy={140} r={120} fill="none" stroke={COLORS.teal + '33'} strokeWidth={1} />
                <Circle cx={(width - 32) / 2} cy={140} r={80} fill="none" stroke={COLORS.teal + '22'} strokeWidth={1} />
                <Circle cx={(width - 32) / 2} cy={140} r={40} fill="none" stroke={COLORS.teal + '11'} strokeWidth={1} />
                
                <Line x1={(width - 32) / 2} y1={20} x2={(width - 32) / 2} y2={260} stroke={COLORS.teal + '22'} strokeWidth={1} />
                <Line x1={(width - 32) / 2 - 120} y1={140} x2={(width - 32) / 2 + 120} y2={140} stroke={COLORS.teal + '22'} strokeWidth={1} />

                {/* Sweeper rotating line */}
                <G transform={`translate(${(width - 32) / 2}, 140)`}>
                  <AnimatedG transform={[{ rotate: spin.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  }) }]}>
                    <Line x1={0} y1={0} x2={120} y2={0} stroke={COLORS.teal} strokeWidth={2} opacity={0.8} />
                    <Path d="M 0 0 L 115 30 A 120 120 0 0 0 120 0 Z" fill={COLORS.teal + '22'} />
                  </AnimatedG>
                </G>

                {/* Center Core Node */}
                <Circle cx={(width - 32) / 2} cy={140} r={6} fill={COLORS.teal} />
                <Circle cx={(width - 32) / 2} cy={140} r={12} fill="none" stroke={COLORS.teal} strokeWidth={1} opacity={0.5} />

                {/* Deployed Honey Account Targets */}
                {(() => {
                  const centerX = (width - 32) / 2;
                  const centerY = 140;
                  
                  const targets = honeypots.length > 0 
                    ? honeypots.map((hp: any, idx: number) => {
                        const angle = (2 * Math.PI * idx) / honeypots.length;
                        const radius = 50 + 50 * (idx % 2); // alternate orbits
                        return {
                          id: hp.mirage_id,
                          x: (radius * Math.cos(angle)) / 120,
                          y: (radius * Math.sin(angle)) / 120,
                          label: hp.mirage_id.replace("EMP_", "").split("_")[0] + "_DEC",
                          isBreached: hp.is_breached || hp.status === "BREACH DETECTED"
                        };
                      })
                    : [
                        { id: 'EMP_1024_HONEYPOT', x: 0.5, y: -0.5, label: 'HONEYPOT', isBreached: false },
                        { id: 'EMP_1033_MIRAGE', x: -0.7, y: 0.3, label: 'CLERK_DEC', isBreached: false },
                        { id: 'EMP_1099_DECOY', x: 0.3, y: 0.8, label: 'MGR_DEC', isBreached: false },
                        { id: 'EMP_2041_GHOST', x: -0.3, y: -0.6, label: 'ADMIN_DEC', isBreached: false },
                        { id: 'EMP_3102_MIRAGE', x: 0.8, y: 0.1, label: 'EXEC_DEC', isBreached: false },
                      ];

                  return targets.map((node: any) => {
                    const nodeX = centerX + node.x * 120;
                    const nodeY = centerY + node.y * 120;
                    const dotColor = node.isBreached ? COLORS.red : COLORS.teal;
                    return (
                      <G key={node.id}>
                        <Circle cx={nodeX} cy={nodeY} r={node.isBreached ? 7 : 5} fill={dotColor} />
                        <Circle cx={nodeX} cy={nodeY} r={node.isBreached ? 14 : 10} fill="none" stroke={dotColor} strokeWidth={1} opacity={0.3} />
                        <SvgText
                          x={nodeX}
                          y={nodeY - 8}
                          fill={node.isBreached ? COLORS.red : "#ffffff"}
                          fontSize="7"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          opacity={0.9}
                        >
                          {node.label}
                        </SvgText>
                      </G>
                    );
                  });
                })()}
              </Svg>
            </View>

            {/* Honey Accounts Total */}
            <View style={styles.deceptionCard}>
              <Database color={COLORS.teal} size={24} style={styles.cardIcon} />
              <Text style={styles.deceptionCardTitle}>Active Mirage Accounts</Text>
              <Text style={styles.deceptionCardValue}>{honeypots.length || 10} Deployed</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Network color={COLORS.teal} size={15} />
              <Text style={styles.sectionTitle}>Mirage Accounts Registry</Text>
            </View>

            {honeypots.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No registered honeypots found in registry.</Text>
              </View>
            ) : (
              honeypots.map((hp: any, index: number) => {
                const isBreached = hp.is_breached || hp.status === "BREACH DETECTED";
                const statusColor = isBreached ? COLORS.red : COLORS.green;
                return (
                  <View key={index} style={styles.mirageRow}>
                    <Text style={styles.mirageId}>{hp.mirage_id || 'DECOY_ACC'}</Text>
                    <Text style={styles.mirageClass}>{hp.department || 'HONEYPOT'}</Text>
                    <Text style={[styles.mirageStatus, { color: statusColor, fontWeight: 'bold' }]}>
                      {hp.status || 'MONITORING'}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
  );
}
