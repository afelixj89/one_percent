import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { computePRs } from '@/lib/pr-utils';
import { getSessions } from '@/lib/storage';
import { PersonalRecord, WorkoutSession } from '@/lib/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProgressScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});

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

  const prList = Object.values(prs).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

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

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Personal Records
            </ThemedText>
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
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Session History
            </ThemedText>
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
          </ThemedView>
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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
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
});
