import Svg, { Circle, Polyline } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
};

export function Sparkline({ values, width = 72, height = 28 }: SparklineProps) {
  const theme = useTheme();

  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pad = 4;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const allPoints = points.map(([x, y]) => `${x},${y}`).join(' ');
  const lastTwo = points.slice(-2).map(([x, y]) => `${x},${y}`).join(' ');
  const [endX, endY] = points[points.length - 1];

  return (
    <Svg width={width} height={height}>
      <Polyline points={allPoints} fill="none" stroke={theme.textSecondary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Polyline points={lastTwo} fill="none" stroke={theme.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={endX} cy={endY} r={4} fill={theme.accent} stroke={theme.background} strokeWidth={2} />
    </Svg>
  );
}
