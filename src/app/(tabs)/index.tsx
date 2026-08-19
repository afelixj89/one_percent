import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { StatTile, StatTileRow } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { getSessionsOnSameWeekdayLastWeek } from '@/lib/benchmark';
import { getTodaysFocus, getSuggestedExercises } from '@/lib/exercises';
import { computePRs } from '@/lib/pr-utils';
import { computeActivityStats } from '@/lib/stats';
import { getSessions } from '@/lib/storage';
import { PersonalRecord, WorkoutSession } from '@/lib/types';
import { getFirstName } from '@/lib/user-display';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getSessions().then((loaded) => {
        if (cancelled) return;
        setSessions(loaded);
        setPrs(computePRs(loaded));
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const today = new Date();
  const stats = useMemo(() => computeActivityStats(sessions), [sessions]);

  const focusCategories = getTodaysFocus(today);
  const suggestions = getSuggestedExercises(today);

  const recentPRs = Object.values(prs)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const sessionsThisWeek = sessions.filter((s) => new Date(s.date) >= weekStart).length;

  const lastWeekSameDay = useMemo(
    () => getSessionsOnSameWeekdayLastWeek(sessions, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions]
  );
  const weekdayName = today.toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="eyebrow" themeColor="textSecondary">
            One Percent
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Hello, {getFirstName(user)}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </ThemedText>

          <StatTileRow>
            <StatTile value={String(stats.currentStreak)} label="Day streak" accent={stats.currentStreak > 0} />
            <StatTile value={String(sessionsThisWeek)} label="This week" />
            <StatTile value={String(stats.totalSessions)} label="All time" />
          </StatTileRow>

          <Card>
            <SectionHeader title="Today's Focus" />
            <ThemedText type="small" themeColor="textSecondary">
              {focusCategories.join(' + ')} — pick what you want, this is just a starting point.
            </ThemedText>
            <View style={styles.suggestionList}>
              {suggestions.map((ex) => (
                <View key={ex.id} style={[styles.suggestionChip, { borderColor: theme.border }]}>
                  <ThemedText type="small">{ex.name}</ThemedText>
                </View>
              ))}
            </View>
          </Card>

          {lastWeekSameDay.length > 0 && (
            <Card>
              <SectionHeader title={`Last ${weekdayName}`} />
              {lastWeekSameDay.map((session) =>
                session.exercises.map((ex, i) => (
                  <View key={`${session.id}-${i}`} style={styles.prRow}>
                    <ThemedText type="small">{ex.exerciseName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {ex.strengthSets.length > 0
                        ? `${ex.strengthSets[0].weight} lbs x ${ex.strengthSets[0].reps}`
                        : ex.cardioSets.length > 0
                          ? `${ex.cardioSets[0].distance} mi`
                          : ''}
                    </ThemedText>
                  </View>
                ))
              )}
              <Pressable
                style={[styles.beatItButton, { borderColor: theme.accent }]}
                onPress={() => router.push('/log-workout')}>
                <ThemedText type="smallBold" themeColor="accent">
                  Beat It
                </ThemedText>
              </Pressable>
            </Card>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.logButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/log-workout')}>
            <ThemedText style={{ color: theme.accentText }} type="smallBold">
              + Log Workout
            </ThemedText>
          </Pressable>

          <Card>
            <SectionHeader title="Recent PRs" />
            {recentPRs.length === 0 ? (
              <ThemedText themeColor="textSecondary">Log a workout to start setting records.</ThemedText>
            ) : (
              recentPRs.map((pr) => (
                <View key={pr.exerciseId} style={styles.prRow}>
                  <ThemedText type="small">{pr.exerciseName}</ThemedText>
                  <ThemedText type="smallBold" themeColor="success">
                    {pr.type === 'strength'
                      ? `${pr.bestWeight} lbs x ${pr.bestReps}`
                      : `${pr.bestSpeed?.toFixed(1)} mph`}
                  </ThemedText>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  beatItButton: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
