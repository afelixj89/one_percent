import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { CategoryDot } from '@/components/category-dot';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCustomExercises } from '@/lib/custom-exercises';
import { EXERCISES } from '@/lib/exercises';
import { cardioSpeed, estimate1RM } from '@/lib/pr-utils';
import { getSessions } from '@/lib/storage';
import { Exercise, WorkoutSession } from '@/lib/types';
import { TrendChart, TrendPoint } from '@/components/trend-chart';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ExerciseDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    getSessions().then((loaded) => setSessions([...loaded].sort((a, b) => b.date.localeCompare(a.date))));
    getCustomExercises().then(setCustomExercises);
  }, []);

  const exerciseInfo = useMemo(
    () => EXERCISES.find((e) => e.id === id) ?? customExercises.find((e) => e.id === id),
    [id, customExercises]
  );

  const exerciseSessions = useMemo(
    () => sessions.filter((s) => s.exercises.some((e) => e.exerciseId === id)),
    [sessions, id]
  );

  const exerciseName = exerciseInfo?.name ?? exerciseSessions[0]?.exercises.find((e) => e.exerciseId === id)?.exerciseName ?? 'Exercise';
  const exerciseType = exerciseInfo?.type ?? exerciseSessions[0]?.exercises.find((e) => e.exerciseId === id)?.type;

  const trendPoints: TrendPoint[] = useMemo(() => {
    const chronological = [...exerciseSessions].sort((a, b) => a.date.localeCompare(b.date));
    const points: TrendPoint[] = [];
    for (const session of chronological) {
      const match = session.exercises.find((e) => e.exerciseId === id);
      if (!match) continue;
      if (match.type === 'strength' && match.strengthSets.length > 0) {
        const best = Math.max(...match.strengthSets.map((s) => estimate1RM(s.weight, s.reps)));
        points.push({ date: session.date, value: best });
      } else if (match.type === 'cardio' && match.cardioSets.length > 0) {
        const best = Math.max(...match.cardioSets.map((s) => cardioSpeed(s)));
        points.push({ date: session.date, value: best });
      }
    }
    return points;
  }, [exerciseSessions, id]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="link" themeColor="accent">
              ‹ Back
            </ThemedText>
          </Pressable>

          <View style={styles.titleRow}>
            {exerciseInfo && <CategoryDot category={exerciseInfo.category} size={14} />}
            <ThemedText type="title" style={styles.title}>
              {exerciseName}
            </ThemedText>
          </View>

          <Card>
            <SectionHeader title={exerciseType === 'cardio' ? 'Pace Trend' : 'Estimated 1RM Trend'} />
            <TrendChart
              points={trendPoints}
              valueLabel={(v) => (exerciseType === 'cardio' ? `${v.toFixed(1)} mph` : `${v.toFixed(0)} lbs (est.)`)}
            />
          </Card>

          <Card>
            <SectionHeader title="History" />
            {exerciseSessions.length === 0 ? (
              <ThemedText themeColor="textSecondary">No sets logged yet.</ThemedText>
            ) : (
              exerciseSessions.map((session) => {
                const match = session.exercises.find((e) => e.exerciseId === id);
                if (!match) return null;
                return (
                  <View key={session.id} style={[styles.historyRow, { borderColor: theme.border }]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatDate(session.date)}
                    </ThemedText>
                    <View style={styles.setList}>
                      {match.strengthSets.map((s, i) => (
                        <ThemedText key={i} type="small">
                          {s.weight} lbs × {s.reps}
                        </ThemedText>
                      ))}
                      {match.cardioSets.map((s, i) => (
                        <ThemedText key={i} type="small">
                          {s.distance} mi in {(s.durationSeconds / 60).toFixed(1)} min
                        </ThemedText>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  setList: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
});
