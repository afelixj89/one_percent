import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WorkoutSession } from '@/lib/types';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type ActivityCalendarProps = {
  sessions: WorkoutSession[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
};

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function ActivityCalendar({ sessions, selectedDate, onSelectDate }: ActivityCalendarProps) {
  const theme = useTheme();
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const sessionCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const key = new Date(s.date).toDateString();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const weeks = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();

    const cells: (Date | null)[] = [
      ...Array(leadingBlanks).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [visibleMonth]);

  function shiftMonth(delta: number) {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const isCurrentMonth = visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() === today.getMonth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={12}>
          <ThemedText type="subtitle" style={styles.chevron}>
            ‹
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{monthLabel}</ThemedText>
        <Pressable onPress={() => shiftMonth(1)} disabled={isCurrentMonth} hitSlop={12}>
          <ThemedText
            type="subtitle"
            style={[styles.chevron, isCurrentMonth && styles.chevronDisabled]}>
            ›
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.weekdayLabel}>
            {label}
          </ThemedText>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.dayCell} />;
            const logged = sessionCountByDay.has(day.toDateString());
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

            return (
              <Pressable key={di} style={styles.dayCell} onPress={() => onSelectDate(day)}>
                <View
                  style={[
                    styles.dayCircle,
                    logged && { backgroundColor: theme.accent },
                    isSelected && { borderColor: theme.text, borderWidth: 2 },
                    isToday && !isSelected && { borderColor: theme.textSecondary, borderWidth: 1 },
                  ]}>
                  <ThemedText
                    type="small"
                    style={logged && { color: theme.accentText }}
                    themeColor={logged ? undefined : 'text'}>
                    {day.getDate()}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  chevron: {
    fontSize: 22,
    lineHeight: 26,
    paddingHorizontal: Spacing.two,
  },
  chevronDisabled: {
    opacity: 0.3,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: '78%',
    height: '78%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
