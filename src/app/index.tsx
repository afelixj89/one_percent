import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getTodaysFocus, getSuggestedExercises } from '@/lib/exercises';
import { computePRs } from '@/lib/pr-utils';
import { getSessions } from '@/lib/storage';
import { PersonalRecord, WorkoutSession } from '@/lib/types';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
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
  const weekStart = startOfWeek(today);
  const loggedDays = new Set(sessions.map((s) => new Date(s.date).toDateString()));

  const focusCategories = getTodaysFocus(today);
  const suggestions = getSuggestedExercises(today);

  const recentPRs = Object.values(prs)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const sessionsThisWeek = sessions.filter((s) => new Date(s.date) >= weekStart).length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            One Percent
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {sessionsThisWeek === 0
              ? "No sessions logged this week yet — let's start."
              : `${sessionsThisWeek} session${sessionsThisWeek === 1 ? '' : 's'} logged this week.`}
          </ThemedText>

          <View style={styles.weekStrip}>
            {WEEKDAY_LABELS.map((label, i) => {
              const day = new Date(weekStart);
              day.setDate(weekStart.getDate() + i);
              const logged = loggedDays.has(day.toDateString());
              const isToday = isSameDay(day, today);
              return (
                <View key={i} style={styles.weekDay}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {label}
                  </ThemedText>
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: logged ? theme.text : theme.backgroundElement },
                      isToday && { borderColor: theme.text, borderWidth: 2 },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Today&apos;s Focus
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.cardSubtitle}>
              {focusCategories.join(' + ')} — pick what you want, this is just a starting point.
            </ThemedText>
            <View style={styles.suggestionList}>
              {suggestions.map((ex) => (
                <ThemedView key={ex.id} type="backgroundSelected" style={styles.suggestionChip}>
                  <ThemedText type="small">{ex.name}</ThemedText>
                </ThemedView>
              ))}
            </View>
          </ThemedView>

          <Pressable
            style={({ pressed }) => [styles.logButton, { backgroundColor: theme.text }, pressed && styles.pressed]}
            onPress={() => router.push('/log-workout')}>
            <ThemedText style={{ color: theme.background }} type="smallBold">
              + Log Workout
            </ThemedText>
          </Pressable>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Recent PRs
            </ThemedText>
            {recentPRs.length === 0 ? (
              <ThemedText themeColor="textSecondary" style={styles.cardSubtitle}>
                Log a workout to start setting records.
              </ThemedText>
            ) : (
              recentPRs.map((pr) => (
                <View key={pr.exerciseId} style={styles.prRow}>
                  <ThemedText type="small">{pr.exerciseName}</ThemedText>
                  <ThemedText type="smallBold">
                    {pr.type === 'strength'
                      ? `${pr.bestWeight} lbs x ${pr.bestReps}`
                      : `${pr.bestSpeed?.toFixed(1)} mph`}
                  </ThemedText>
                </View>
              ))
            )}
          </ThemedView>
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    marginTop: Spacing.two,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  weekDay: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  cardSubtitle: {},
  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  logButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
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
