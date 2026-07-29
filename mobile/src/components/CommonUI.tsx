import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export function cumulativeBuckets(items: any[], numBuckets: number, reducer: (slice: any[]) => number, emptyValue: number): number[] {
  const n = items.length;
  if (n === 0) return Array(numBuckets).fill(emptyValue);
  const out: number[] = [];
  for (let b = 1; b <= numBuckets; b++) {
    const idx = Math.max(1, Math.round((b / numBuckets) * n));
    out.push(reducer(items.slice(0, idx)));
  }
  return out;
}

export const avgCbsi = (txns: any[]): number => 
  txns.length ? Math.round((txns.reduce((s, x) => s + (x.cbsi || 0), 0) / txns.length) * 10) / 10 : 0;


export function getRiskTier(score: number): 'CRITICAL' | 'HIGH' | 'WATCH' | 'NORMAL' {
  if (score >= 70) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 30) return 'WATCH';
  return 'NORMAL';
}


export function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points || points.length < 2) {
    return (
      <Svg width={75} height={24}>
        <Line x1={0} y1={12} x2={75} y2={12} stroke={color} strokeWidth={1} opacity={0.3} />
      </Svg>
    );
  }
  
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;
  
  const width = 75;
  const height = 24;
  const padding = 2;
  
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 4) + 2;
    const y = height - padding - ((p - min) / range) * (height - 2 * padding);
    return { x, y };
  });
  
  const pathData = coords.reduce((acc, c, i) => {
    return i === 0 ? `M ${c.x},${c.y}` : `${acc} L ${c.x},${c.y}`;
  }, '');

  const areaData = `${pathData} L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`;
  const lastCoord = coords[coords.length - 1];

  return (
    <Svg width={width} height={height} style={{ overflow: 'visible' }}>
      <Path d={areaData} fill={color} opacity={0.07} />
      <Path d={pathData} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={lastCoord.x} cy={lastCoord.y} r={2.5} fill={color} />
      <Circle cx={lastCoord.x} cy={lastCoord.y} r={0.8} fill="#ffffff" />
    </Svg>
  );
}


export function KpiCard({
  title,
  value,
  color,
  COLORS,
  trend,
  trendDirection,
  icon: Icon,
  sparkPoints,
  styles
}: {
  title: string;
  value: string | number;
  color: string;
  COLORS: any;
  trend: string;
  trendDirection: string;
  icon: any;
  sparkPoints: number[];
  styles: any;
}) {
  const isDown = trendDirection === 'down';
  const isOrange = trendDirection === 'up-orange';
  const isRed = trendDirection === 'up-red';

  let trendColor = COLORS.green;
  if (isDown) trendColor = COLORS.cyan;
  if (isOrange) trendColor = COLORS.amber;
  if (isRed) trendColor = COLORS.red;

  const isPositive = trendDirection !== 'down';

  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <View style={styles.kpiHeaderRow}>
        <Text style={styles.kpiTitle}>{title}</Text>
        {Icon && (
          <View style={[styles.kpiIconWrapper, { backgroundColor: color + '15' }]}>
            <Icon color={color} size={13} />
          </View>
        )}
      </View>

      <Text style={styles.kpiValue}>{value}</Text>

      <View style={styles.kpiFooterRow}>
        <View style={[styles.kpiTrendBadge, { backgroundColor: trendColor + '15' }]}>
          <Text style={[styles.kpiTrendText, { color: trendColor }]}>
            {isPositive ? '▲' : '▼'} {trend}
          </Text>
        </View>
        <View style={styles.kpiSparklineWrapper}>
          <Sparkline points={sparkPoints} color={color} />
        </View>
      </View>
    </View>
  );
}


export async function safeJsonParse(response: any) {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    return { detail: text || `HTTP ${response.status}: ${response.statusText}` };
  } catch (e: any) {
    return { detail: e.message || 'Parser Error' };
  }
}

