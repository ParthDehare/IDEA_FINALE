import * as React from 'react';
import { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import Svg, { Path, Circle, G, Rect, Defs, Pattern } from 'react-native-svg';
import { INDIA_STATES_PATHS } from './IndiaMapPaths';

const { width: windowWidth } = Dimensions.get('window');

const BRANCH_COORDINATES: Record<string, { name: string; x: number; y: number }> = {
  BR_01: { name: "Mumbai South BR_01", x: 130, y: 460 },
  BR_02: { name: "Delhi Central BR_02", x: 195, y: 215 },
  BR_03: { name: "Kolkata East BR_03", x: 390, y: 330 },
  BR_04: { name: "Chennai South BR_04", x: 230, y: 600 },
  BR_05: { name: "Bengaluru West BR_05", x: 170, y: 580 },
  BR_06: { name: "Hyderabad Central BR_06", x: 210, y: 510 },
  BR_07: { name: "Pune West BR_07", x: 150, y: 480 },
  BR_08: { name: "Ahmedabad North BR_08", x: 90, y: 370 },
  BR_09: { name: "Jaipur North BR_09", x: 150, y: 250 },
  BR_10: { name: "Lucknow East BR_10", x: 260, y: 240 },
  BR_11: { name: "Patna East BR_11", x: 330, y: 260 },
  BR_12: { name: "Bhopal Central BR_12", x: 220, y: 350 },
  BR_13: { name: "Guwahati Northeast BR_13", x: 500, y: 260 },
  BR_14: { name: "Srinagar North BR_14", x: 180, y: 80 },
  BR_15: { name: "Kochi South BR_15", x: 160, y: 650 },
  BR_16: { name: "Visakhapatnam Southeast BR_16", x: 270, y: 490 },
  BR_17: { name: "Chandigarh North BR_17", x: 185, y: 160 },
  BR_18: { name: "Indore Central BR_18", x: 180, y: 370 },
  BR_19: { name: "Nagpur Central BR_19", x: 230, y: 410 },
  BR_20: { name: "Bhubaneswar East BR_20", x: 330, y: 420 },
};

interface ThreatMapProps {
  theme: 'dark' | 'light';
  scoredTxns: any[];
  confirmedIncidents: string[];
  falseAlarms: string[];
  employeeMetadata: Record<string, any>;
  onSelectEmployee: (empId: string) => void;
}

export default function ThreatMap({
  theme,
  scoredTxns = [],
  confirmedIncidents = [],
  falseAlarms = [],
  employeeMetadata = {},
  onSelectEmployee
}: ThreatMapProps) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<any | null>(null);

  const touchStart = useRef({ x: 0, y: 0 });

  // 1. Theme Configuration
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#16181f' : '#f8fafc',
    card: isDark ? '#22252a' : '#ffffff',
    cardAlt: isDark ? '#1c1e22' : '#f1f5f9',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(99, 102, 241, 0.15)',
    text: isDark ? '#f8fafc' : '#0f172a',
    text2: isDark ? '#94a3b8' : '#64748b',
    accent: isDark ? '#6366f1' : '#4f46e5',
    teal: isDark ? '#0ea5e9' : '#0d9488',
    cyan: isDark ? '#06b6d4' : '#06b6d4',
    red: isDark ? '#ef4444' : '#e11d48',
    amber: isDark ? '#f97316' : '#ea580c',
    green: isDark ? '#10b981' : '#16a34a',
    continent: isDark ? '#1c1e2d' : '#e2e8f0',
    continentStroke: isDark ? '#2d3149' : '#cbd5e1',
    grid: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
  };

  // 2. Compute dynamic hotspots from confirmed/flagged fraud transactions
  const safeTxns = Array.isArray(scoredTxns) ? scoredTxns : [];
  
  const criticalTxns = useMemo(() => {
    return safeTxns.filter(tx => {
      if (!tx || !tx.emp_id) return false;
      const empIdUpper = tx.emp_id.toUpperCase();
      
      const isFalseAlarm = falseAlarms.some(fa => fa.toUpperCase() === empIdUpper);
      if (isFalseAlarm) return false;
      
      const isConfirmed = confirmedIncidents.some(ci => ci.toUpperCase() === empIdUpper);
      const isGroundTruthFraud = tx.is_fraud_flag === 1 || tx.is_fraud_flag === '1' || tx.is_fraud_flag === true;
      
      return isGroundTruthFraud || isConfirmed;
    });
  }, [safeTxns, confirmedIncidents, falseAlarms]);

  const { branchAlerts, hotspots } = useMemo(() => {
    const alerts: Record<string, any> = {};
    criticalTxns.forEach(tx => {
      const branchId = tx.branch_id;
      if (!branchId || !BRANCH_COORDINATES[branchId]) return;
      
      if (!alerts[branchId]) {
        alerts[branchId] = {
          id: branchId,
          name: BRANCH_COORDINATES[branchId].name,
          x: BRANCH_COORDINATES[branchId].x,
          y: BRANCH_COORDINATES[branchId].y,
          count: 0,
          maxScore: 0,
          employees: new Set<string>()
        };
      }
      alerts[branchId].count++;
      alerts[branchId].maxScore = Math.max(alerts[branchId].maxScore, tx.cbsi || 0);
      if (tx.emp_id) {
        alerts[branchId].employees.add(tx.emp_id);
      }
    });

    const hsList = Object.values(alerts).map(b => ({
      ...b,
      risk: b.maxScore >= 90 ? "Critical" : "High",
      employees: Array.from(b.employees) as string[]
    }));

    return { branchAlerts: alerts, hotspots: hsList };
  }, [criticalTxns]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) {
        setOffsetX(0);
        setOffsetY(0);
      }
      return next;
    });
  };

  // Zoom/Pan touch handlers
  const handleTouchStart = (e: any) => {
    if (zoom <= 1) return;
    const touch = e.nativeEvent.touches[0];
    touchStart.current = { x: touch.pageX - offsetX, y: touch.pageY - offsetY };
  };

  const handleTouchMove = (e: any) => {
    if (zoom <= 1) return;
    const touch = e.nativeEvent.touches[0];
    setOffsetX(touch.pageX - touchStart.current.x);
    setOffsetY(touch.pageY - touchStart.current.y);
  };

  // Trigger search on parent profile
  const handleBranchClick = (branchId: string) => {
    let foundEmpId = null;
    
    if (employeeMetadata) {
      const match = Object.entries(employeeMetadata).find(
        ([_, meta]) => meta.branch_id === branchId
      );
      if (match) {
        foundEmpId = match[0];
      }
    }
    
    if (!foundEmpId && Array.isArray(scoredTxns)) {
      const match = scoredTxns.find((tx) => tx.branch_id === branchId);
      if (match) {
        foundEmpId = match.emp_id;
      }
    }
    
    if (foundEmpId) {
      onSelectEmployee(foundEmpId);
    } else {
      Alert.alert("Branch Clean", `No active alerts or registered employees mapped to branch ${branchId}.`);
    }
  };

  const handleHotspotClick = (hs: any) => {
    if (hs.employees && hs.employees.length > 0) {
      onSelectEmployee(hs.employees[0]);
    } else {
      handleBranchClick(hs.id);
    }
  };

  return (
    <View style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Map header */}
      <View style={styles.mapHeader}>
        <View style={styles.pulseContainer}>
          <View style={[styles.pulseDot, { backgroundColor: colors.red }]} />
          <Text style={[styles.mapTitle, { color: colors.text }]}>INDIA THREAT MAP</Text>
        </View>
        <Text style={[styles.mapSub, { color: colors.text2 }]}>
          Hotspots: {hotspots.length} ({scoredTxns.length} scanned)
        </Text>
      </View>

      {/* SVG Canvas Map */}
      <View
        style={styles.canvasContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <Svg
          viewBox="0 0 612 696"
          width="100%"
          height={320}
          style={{ overflow: 'hidden' }}
        >
          <G transform={`translate(${offsetX}, ${offsetY}) scale(${zoom})`}>
            {/* Grid Pattern Background */}
            <Defs>
              <Pattern id="gridMobile" width="30" height="30" patternUnits="userSpaceOnUse">
                <Path d="M 30 0 L 0 0 0 30" fill="none" stroke={colors.grid} strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="612" height="696" fill="url(#gridMobile)" />

            {/* India State Boundaries */}
            <G>
              {INDIA_STATES_PATHS.map((state) => (
                <Path
                  key={state.id}
                  d={state.d}
                  fill={colors.continent}
                  stroke={colors.continentStroke}
                  strokeWidth="1.2"
                />
              ))}
            </G>

            {/* Normal Branch Nodes */}
            {Object.entries(BRANCH_COORDINATES).map(([id, info]) => {
              const hasAlert = branchAlerts[id];
              if (hasAlert) return null; // Pulses as red hotspot instead

              // Suppress indicator if close to critical hotspots
              const nearHotspot = hotspots.some(hs => Math.hypot(hs.x - info.x, hs.y - info.y) < 35);
              const dotOpacity = nearHotspot ? 0.05 : 0.6;

              return (
                <G key={`branch-${id}`}>
                  <Circle
                    cx={info.x}
                    cy={info.y}
                    r="4.5"
                    fill={colors.green}
                    opacity={dotOpacity}
                    onPress={() => handleBranchClick(id)}
                  />
                  <Circle
                    cx={info.x}
                    cy={info.y}
                    r="9"
                    fill={colors.green}
                    opacity={nearHotspot ? 0.01 : 0.15}
                    onPress={() => handleBranchClick(id)}
                  />
                </G>
              );
            })}

            {/* Active Threat Hotspots */}
            {hotspots.map((hs) => {
              return (
                <G key={`hotspot-${hs.id}`}>
                  {/* Pulse Ring */}
                  <Circle
                    cx={hs.x}
                    cy={hs.y}
                    r="15"
                    fill={colors.red}
                    opacity={0.35}
                    onPress={() => handleHotspotClick(hs)}
                  />
                  <Circle
                    cx={hs.x}
                    cy={hs.y}
                    r="7.5"
                    fill={colors.red}
                    opacity={0.75}
                    onPress={() => handleHotspotClick(hs)}
                  />
                  <Circle
                    cx={hs.x}
                    cy={hs.y}
                    r="3.5"
                    fill="#ffffff"
                    onPress={() => handleHotspotClick(hs)}
                  />
                </G>
              );
            })}
          </G>
        </Svg>

        {/* Zoom Controls */}
        <View style={styles.zoomContainer}>
          <TouchableOpacity style={[styles.zoomBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]} onPress={handleZoomIn}>
            <Text style={[styles.zoomBtnText, { color: colors.text }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.zoomBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]} onPress={handleZoomOut}>
            <Text style={[styles.zoomBtnText, { color: colors.text }]}>-</Text>
          </TouchableOpacity>
        </View>

        {/* Hotspots Quick Inspector */}
        {hotspots.length > 0 && (
          <View style={[styles.hudInspector, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={[styles.hudHeader, { color: colors.red }]}>ALERT SUMMARY</Text>
            {hotspots.map(hs => (
              <TouchableOpacity
                key={hs.id}
                style={styles.hudRow}
                onPress={() => handleHotspotClick(hs)}
              >
                <Text style={[styles.hudBranch, { color: colors.text }]}>{hs.name.split(' ')[0]}</Text>
                <Text style={[styles.hudScore, { color: colors.red }]}>{hs.maxScore} CBSI</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    paddingBottom: 6,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mapTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  mapSub: {
    fontSize: 9.5,
    fontFamily: 'monospace',
  },
  canvasContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  zoomContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'column',
    gap: 6,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  hudInspector: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    opacity: 0.95,
  },
  hudHeader: {
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 2,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  hudBranch: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  hudScore: {
    fontSize: 8,
    fontFamily: 'monospace',
    marginLeft: 6,
  },
});
