import { View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TrendPoint {
  date: string;
  value: number;
}

type TrendChartProps = {
  points: TrendPoint[];
  valueLabel: (v: number) => string;
  height?: number;
};

// Virtual coordinate width — the SVG scales this to whatever the container's
// real width turns out to be via viewBox, so no layout measurement is needed.
const VIRTUAL_WIDTH = 300;

export function TrendChart({ points, valueLabel, height = 140 }: TrendChartProps) {
  const theme = useTheme();

  if (points.length < 2) {
    return (
      <View style={{ height, justifyContent: 'center' }}>
        <ThemedText type="small" themeColor="textSecondary">
          Log this exercise a couple more times to see a trend.
        </ThemedText>
      </View>
    );
  }

  const padTop = 16;
  const padBottom = 24;
  const values = points.map((p) => p.value);
  const maxV = Math.max(...values);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const times = points.map((p) => new Date(p.date).getTime());
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const timeRange = maxT - minT || 1;

  const usableHeight = height - padTop - padBottom;

  const coords = points.map((p) => {
    const t = new Date(p.date).getTime();
    const x = points.length === 1 ? 0 : VIRTUAL_WIDTH * ((t - minT) / timeRange);
    const y = padTop + (1 - (p.value - minV) / range) * usableHeight;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const baselineY = padTop + usableHeight;
  const areaPoints = [
    `${coords[0].x},${baselineY}`,
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1].x},${baselineY}`,
  ].join(' ');

  const last = coords[coords.length - 1];
  const first = coords[0];

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIRTUAL_WIDTH} ${height}`} preserveAspectRatio="none">
        <Line x1={0} y1={baselineY} x2={VIRTUAL_WIDTH} y2={baselineY} stroke={theme.border} strokeWidth={1} />
        <Polygon points={areaPoints} fill={theme.accent} fillOpacity={0.1} />
        <Path d={linePath} stroke={theme.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={last.x} cy={last.y} r={4} fill={theme.accent} stroke={theme.background} strokeWidth={2} />
      </Svg>
      <View style={styles.labelRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {new Date(first.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="accent">
          {valueLabel(last.value)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = {
  labelRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: Spacing.one,
  },
};
