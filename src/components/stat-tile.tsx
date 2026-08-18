import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatTileProps = {
  value: string;
  label: string;
  accent?: boolean;
};

export function StatTile({ value, label, accent }: StatTileProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.tile, { borderColor: theme.border }]}>
      <ThemedText type="stat" themeColor={accent ? 'accent' : 'text'}>
        {value}
      </ThemedText>
      <ThemedText type="statLabel" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

export function StatTileRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
