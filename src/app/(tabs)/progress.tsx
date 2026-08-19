import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityCalendar } from '@/components/activity-calendar';
import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { StatTile, StatTileRow } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import {
  compareExercises,
  compareToLastWeek,
  ComparisonStatus,
  getSessionsOnSameWeekdayLastWeek,
} from '@/lib/benchmark';
import { computePRs } from '@/lib/pr-utils';
import { computeActivityStats } from '@/lib/stats';
import { getSessions } from '@/lib/storage';
import { PersonalRecord, WorkoutSession } from '@/lib/types';
import { getDisplayName } from '@/lib/user-display';
import { useTheme } from '@/hooks/use-theme';

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function ProgressScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getSessions().then((loaded) => {
        if (cancelled) return;
        const sorted = [...loaded].sort((a, b) => b.date.localeCompare(a.date));
        setSessions(sorted);
        setPrs(computePRs(loaded));
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const stats = useMemo(() => computeActivityStats(sessions), [sessions]);
  const prList = Object.values(prs).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

  const selectedDaySessions = selectedDate
    ? sessions.filter((s) => new Date(s.date).toDateString() === selectedDate.toDateString())
    : [];

  const lastWeekSameDaySessions = selectedDate ? getSessionsOnSameWeekdayLastWeek(sessions, selectedDate) : [];
  const dayComparisons =
    selectedDate && (selectedDaySessions.length > 0 || lastWeekSameDaySessions.length > 0)
      ? compareExercises(selectedDaySessions, lastWeekSameDaySessions)
      : [];

  const comparisonColor: Record<ComparisonStatus, keyof typeof theme> = {
    better: 'success',
    worse: 'warning',
    same: 'textSecondary',
    new: 'textSecondary',
    missed: 'textSecondary',
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            Progress
          </ThemedText>

          <StatTileRow>
            <StatTile value={String(stats.currentStreak)} label="Day streak" accent={stats.currentStreak > 0} />
            <StatTile value={String(stats.totalSessions)} label="Sessions" />
            <StatTile value={String(stats.longestStreak)} label="Best streak" />
          </StatTileRow>

          <Card>
            <SectionHeader
              title={
                stats.firstSessionDate
                  ? `Training since ${formatShortDate(stats.firstSessionDate)}`
                  : 'Activity'
              }
            />
            <ActivityCalendar sessions={sessions} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            {selectedDate && (
              <View style={[styles.selectedDayBlock, { borderTopColor: theme.border }]}>
                <ThemedText type="smallBold">{formatDate(selectedDate)}</ThemedText>
                {selectedDaySessions.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No workout logged.
                  </ThemedText>
                ) : (
                  selectedDaySessions.map((session) =>
                    session.exercises.map((ex, i) => (
                      <ThemedText key={`${session.id}-${i}`} type="small" themeColor="textSecondary">
                        {ex.exerciseName} — {ex.strengthSets.length + ex.cardioSets.length} set(s)
                      </ThemedText>
                    ))
                  )
                )}
              </View>
            )}

            {selectedDate && dayComparisons.length > 0 && (
              <View style={[styles.selectedDayBlock, { borderTopColor: theme.border }]}>
                <ThemedText type="smallBold">
                  vs. last {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
                </ThemedText>
                {dayComparisons.map((comparison) => {
                  const result = compareToLastWeek(comparison);
                  return (
                    <View key={comparison.exerciseId} style={styles.prRow}>
                      <ThemedText type="small">{comparison.exerciseName}</ThemedText>
                      <ThemedText type="small" themeColor={comparisonColor[result.status]}>
                        {result.message}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          <Card>
            <SectionHeader title="Personal Records" />
            {prList.length === 0 ? (
              <ThemedText themeColor="textSecondary">No PRs yet — log a workout to start.</ThemedText>
            ) : (
              prList.map((pr) => (
                <View key={pr.exerciseId} style={styles.prRow}>
                  <View>
                    <ThemedText type="small">{pr.exerciseName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatDate(pr.date)}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold">
                    {pr.type === 'strength'
                      ? `${pr.bestWeight} lbs x ${pr.bestReps}`
                      : `${pr.bestSpeed?.toFixed(1)} mph`}
                  </ThemedText>
                </View>
              ))
            )}
          </Card>

          <Card>
            <SectionHeader title="All Sessions" />
            {sessions.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nothing logged yet.</ThemedText>
            ) : (
              sessions.map((session) => (
                <View key={session.id} style={styles.sessionBlock}>
                  <ThemedText type="smallBold">{formatDate(session.date)}</ThemedText>
                  {session.exercises.map((ex, i) => (
                    <ThemedText key={i} type="small" themeColor="textSecondary">
                      {ex.exerciseName} — {ex.strengthSets.length + ex.cardioSets.length} set(s)
                    </ThemedText>
                  ))}
                </View>
              ))
            )}
          </Card>

          <Card>
            <SectionHeader title="Account" />
            <ThemedText type="smallBold">{getDisplayName(user)}</ThemedText>
            {user?.displayName && user?.email && (
              <ThemedText type="small" themeColor="textSecondary">
                {user.email}
              </ThemedText>
            )}
            <Pressable style={[styles.signOutButton, { borderColor: theme.border }]} onPress={() => signOut()}>
              <ThemedText type="smallBold">Sign Out</ThemedText>
            </Pressable>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    marginTop: Spacing.two,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionBlock: {
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
  selectedDayBlock: {
    gap: Spacing.half,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
});
