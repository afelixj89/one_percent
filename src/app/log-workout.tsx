import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORIES, EXERCISES } from '@/lib/exercises';
import { computePRs, feedbackForCardioSet, feedbackForStrengthSet, SetFeedback } from '@/lib/pr-utils';
import { saveSession, getSessions } from '@/lib/storage';
import { CardioSet, Exercise, LoggedExercise, PersonalRecord, StrengthSet } from '@/lib/types';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function LogWorkoutScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [strengthSets, setStrengthSets] = useState<StrengthSet[]>([]);
  const [cardioSets, setCardioSets] = useState<CardioSet[]>([]);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [lastFeedback, setLastFeedback] = useState<SetFeedback | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSessions().then((sessions) => setPrs(computePRs(sessions)));
  }, []);

  const exercisesInCategory = useMemo(
    () => EXERCISES.filter((e) => e.category === category),
    [category]
  );

  function pickExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setStrengthSets([]);
    setCardioSets([]);
    setLastFeedback(null);
    setReps('');
    setWeight('');
    setDistance('');
    setMinutes('');
  }

  function addStrengthSet() {
    if (!selectedExercise) return;
    const repsNum = parseFloat(reps);
    const weightNum = parseFloat(weight);
    if (!repsNum || !weightNum) return;

    const set: StrengthSet = { reps: repsNum, weight: weightNum };
    setStrengthSets((prev) => [...prev, set]);
    setLastFeedback(feedbackForStrengthSet(set, prs[selectedExercise.id]));
    setReps('');
    setWeight('');
  }

  function addCardioSet() {
    if (!selectedExercise) return;
    const distNum = parseFloat(distance);
    const minNum = parseFloat(minutes);
    if (!distNum || !minNum) return;

    const set: CardioSet = { distance: distNum, durationSeconds: minNum * 60 };
    setCardioSets((prev) => [...prev, set]);
    setLastFeedback(feedbackForCardioSet(set, prs[selectedExercise.id]));
    setDistance('');
    setMinutes('');
  }

  function finishExercise() {
    if (!selectedExercise) return;
    if (strengthSets.length === 0 && cardioSets.length === 0) return;

    setLoggedExercises((prev) => [
      ...prev,
      {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        type: selectedExercise.type,
        strengthSets,
        cardioSets,
      },
    ]);
    setSelectedExercise(null);
    setStrengthSets([]);
    setCardioSets([]);
    setLastFeedback(null);
  }

  async function finishWorkout() {
    if (loggedExercises.length === 0 || saving) return;
    setSaving(true);
    await saveSession({
      id: makeId(),
      date: new Date().toISOString(),
      exercises: loggedExercises,
    });
    setSaving(false);
    setLoggedExercises([]);
    router.push('/');
  }

  const feedbackColor = {
    pr: '#2FB44E',
    close: '#E0A400',
    behind: theme.textSecondary,
    first: theme.textSecondary,
  } as const;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.title}>
              Log Workout
            </ThemedText>

            {!selectedExercise && (
              <>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((c) => (
                    <Pressable key={c} onPress={() => setCategory(c)}>
                      <ThemedView
                        type={c === category ? 'backgroundSelected' : 'backgroundElement'}
                        style={styles.categoryChip}>
                        <ThemedText type="small">{c}</ThemedText>
                      </ThemedView>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.exerciseList}>
                  {exercisesInCategory.map((ex) => (
                    <Pressable key={ex.id} onPress={() => pickExercise(ex)}>
                      <ThemedView type="backgroundElement" style={styles.exerciseRow}>
                        <ThemedText>{ex.name}</ThemedText>
                        {prs[ex.id] && (
                          <ThemedText type="small" themeColor="textSecondary">
                            PR:{' '}
                            {ex.type === 'strength'
                              ? `${prs[ex.id].bestWeight} lbs x ${prs[ex.id].bestReps}`
                              : `${prs[ex.id].bestSpeed?.toFixed(1)} mph`}
                          </ThemedText>
                        )}
                      </ThemedView>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {selectedExercise && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    {selectedExercise.name}
                  </ThemedText>
                  <Pressable onPress={() => setSelectedExercise(null)}>
                    <ThemedText type="link" themeColor="textSecondary">
                      Change
                    </ThemedText>
                  </Pressable>
                </View>

                {selectedExercise.type === 'strength' ? (
                  <>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                        placeholder="Weight (lbs)"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={weight}
                        onChangeText={setWeight}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                        placeholder="Reps"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                        value={reps}
                        onChangeText={setReps}
                      />
                      <Pressable style={[styles.addSetButton, { backgroundColor: theme.text }]} onPress={addStrengthSet}>
                        <ThemedText style={{ color: theme.background }} type="smallBold">
                          Add
                        </ThemedText>
                      </Pressable>
                    </View>
                    {strengthSets.map((s, i) => (
                      <ThemedText key={i} type="small" themeColor="textSecondary">
                        Set {i + 1}: {s.weight} lbs x {s.reps}
                      </ThemedText>
                    ))}
                  </>
                ) : (
                  <>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                        placeholder="Distance (mi)"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={distance}
                        onChangeText={setDistance}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                        placeholder="Minutes"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={minutes}
                        onChangeText={setMinutes}
                      />
                      <Pressable style={[styles.addSetButton, { backgroundColor: theme.text }]} onPress={addCardioSet}>
                        <ThemedText style={{ color: theme.background }} type="smallBold">
                          Add
                        </ThemedText>
                      </Pressable>
                    </View>
                    {cardioSets.map((s, i) => (
                      <ThemedText key={i} type="small" themeColor="textSecondary">
                        Set {i + 1}: {s.distance} mi in {(s.durationSeconds / 60).toFixed(1)} min
                      </ThemedText>
                    ))}
                  </>
                )}

                {lastFeedback && (
                  <ThemedText type="smallBold" style={{ color: feedbackColor[lastFeedback.status] }}>
                    {lastFeedback.message}
                  </ThemedText>
                )}

                <Pressable
                  style={[styles.doneButton, { borderColor: theme.text }]}
                  onPress={finishExercise}>
                  <ThemedText type="smallBold">Done with this exercise</ThemedText>
                </Pressable>
              </ThemedView>
            )}

            {loggedExercises.length > 0 && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  This Session
                </ThemedText>
                {loggedExercises.map((le, i) => (
                  <ThemedText key={i} type="small">
                    {le.exerciseName} — {le.strengthSets.length + le.cardioSets.length} set(s)
                  </ThemedText>
                ))}
              </ThemedView>
            )}

            <Pressable
              disabled={loggedExercises.length === 0 || saving}
              style={[
                styles.finishButton,
                { backgroundColor: theme.text },
                (loggedExercises.length === 0 || saving) && styles.disabled,
              ]}
              onPress={finishWorkout}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {saving ? 'Saving…' : 'Finish Workout'}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  exerciseList: {
    gap: Spacing.two,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  addSetButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  doneButton: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  finishButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
