import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { addCustomExercise, getCustomExercises, MY_EXERCISES_CATEGORY } from '@/lib/custom-exercises';
import { CATEGORIES, EXERCISES } from '@/lib/exercises';
import { computePRs, feedbackForCardioSet, feedbackForStrengthSet, SetFeedback } from '@/lib/pr-utils';
import { saveSession, getSessions } from '@/lib/storage';
import { CardioSet, Exercise, ExerciseType, LoggedExercise, PersonalRecord, StrengthSet } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ALL_CATEGORIES = [...CATEGORIES, MY_EXERCISES_CATEGORY];

export default function LogWorkoutScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [category, setCategory] = useState<string>(ALL_CATEGORIES[0]);
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

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<ExerciseType>('strength');
  const [submittingCustom, setSubmittingCustom] = useState(false);

  const refreshPRs = useCallback(() => {
    getSessions().then((sessions) => setPrs(computePRs(sessions)));
  }, []);

  useEffect(() => {
    refreshPRs();
    getCustomExercises().then(setCustomExercises);
  }, [refreshPRs]);

  const exercisesInCategory = useMemo(() => {
    if (category === MY_EXERCISES_CATEGORY) return customExercises;
    const builtIn = EXERCISES.filter((e) => e.category === category);
    const custom = customExercises.filter((e) => e.category === category);
    return [...builtIn, ...custom];
  }, [category, customExercises]);

  function selectCategory(c: string) {
    setCategory(c);
    setShowCustomForm(false);
    setCustomName('');
  }

  function openCustomForm() {
    setCustomType(category === 'Cardio' ? 'cardio' : 'strength');
    setShowCustomForm(true);
  }

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

  async function submitCustomExercise() {
    if (!customName.trim() || submittingCustom) return;
    setSubmittingCustom(true);
    const exercise = await addCustomExercise(customName, customType, category);
    setCustomExercises((prev) => [...prev, exercise]);
    setCustomName('');
    setShowCustomForm(false);
    setSubmittingCustom(false);
    pickExercise(exercise);
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
    pr: theme.success,
    close: theme.warning,
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
                  {ALL_CATEGORIES.map((c) => (
                    <Pressable key={c} onPress={() => selectCategory(c)}>
                      <View
                        style={[
                          styles.categoryChip,
                          { borderColor: c === category ? theme.accent : theme.border },
                          c === category && { backgroundColor: theme.accent },
                        ]}>
                        <ThemedText
                          type="small"
                          style={c === category && { color: theme.accentText }}>
                          {c}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.exerciseList}>
                  {exercisesInCategory.map((ex) => (
                    <Pressable key={ex.id} onPress={() => pickExercise(ex)}>
                      <View style={[styles.exerciseRow, { borderColor: theme.border }]}>
                        <ThemedText>{ex.name}</ThemedText>
                        {prs[ex.id] && (
                          <ThemedText type="small" themeColor="textSecondary">
                            PR:{' '}
                            {ex.type === 'strength'
                              ? `${prs[ex.id].bestWeight} lbs x ${prs[ex.id].bestReps}`
                              : `${prs[ex.id].bestSpeed?.toFixed(1)} mph`}
                          </ThemedText>
                        )}
                      </View>
                    </Pressable>
                  ))}

                  {category !== MY_EXERCISES_CATEGORY && !showCustomForm && (
                    <Pressable onPress={openCustomForm}>
                      <View style={[styles.exerciseRow, styles.addRow, { borderColor: theme.accent }]}>
                        <ThemedText type="smallBold" themeColor="accent">
                          + Add your own {category} exercise
                        </ThemedText>
                      </View>
                    </Pressable>
                  )}

                  {category !== MY_EXERCISES_CATEGORY && showCustomForm && (
                    <Card>
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Exercise name"
                        placeholderTextColor={theme.textSecondary}
                        value={customName}
                        onChangeText={setCustomName}
                        autoFocus
                      />
                      <View style={styles.typeToggleRow}>
                        {(['strength', 'cardio'] as ExerciseType[]).map((t) => (
                          <Pressable key={t} style={styles.flex} onPress={() => setCustomType(t)}>
                            <View
                              style={[
                                styles.typeToggle,
                                { borderColor: t === customType ? theme.accent : theme.border },
                                t === customType && { backgroundColor: theme.accent },
                              ]}>
                              <ThemedText
                                type="small"
                                style={t === customType && { color: theme.accentText }}>
                                {t === 'strength' ? 'Strength' : 'Cardio'}
                              </ThemedText>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                      <Pressable
                        disabled={submittingCustom}
                        style={[
                          styles.primaryButton,
                          { backgroundColor: theme.accent },
                          submittingCustom && styles.disabled,
                        ]}
                        onPress={submitCustomExercise}>
                        <ThemedText type="smallBold" style={{ color: theme.accentText }}>
                          Add & Select
                        </ThemedText>
                      </Pressable>
                    </Card>
                  )}
                </View>
              </>
            )}

            {selectedExercise && (
              <Card>
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
                        style={[styles.input, styles.flex, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Weight (lbs)"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={weight}
                        onChangeText={setWeight}
                      />
                      <TextInput
                        style={[styles.input, styles.flex, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Reps"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                        value={reps}
                        onChangeText={setReps}
                      />
                      <Pressable style={[styles.addSetButton, { backgroundColor: theme.accent }]} onPress={addStrengthSet}>
                        <ThemedText style={{ color: theme.accentText }} type="smallBold">
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
                        style={[styles.input, styles.flex, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Distance (mi)"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={distance}
                        onChangeText={setDistance}
                      />
                      <TextInput
                        style={[styles.input, styles.flex, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Minutes"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={minutes}
                        onChangeText={setMinutes}
                      />
                      <Pressable style={[styles.addSetButton, { backgroundColor: theme.accent }]} onPress={addCardioSet}>
                        <ThemedText style={{ color: theme.accentText }} type="smallBold">
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
              </Card>
            )}

            {loggedExercises.length > 0 && (
              <Card>
                <SectionHeader title="This Session" />
                {loggedExercises.map((le, i) => (
                  <ThemedText key={i} type="small">
                    {le.exerciseName} — {le.strengthSets.length + le.cardioSets.length} set(s)
                  </ThemedText>
                ))}
              </Card>
            )}

            <Pressable
              disabled={loggedExercises.length === 0 || saving}
              style={[
                styles.finishButton,
                { backgroundColor: theme.accent },
                (loggedExercises.length === 0 || saving) && styles.disabled,
              ]}
              onPress={finishWorkout}>
              <ThemedText style={{ color: theme.accentText }} type="smallBold">
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
    borderWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  addRow: {
    justifyContent: 'center',
    borderStyle: 'dashed',
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
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeToggle: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  addSetButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  primaryButton: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
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
