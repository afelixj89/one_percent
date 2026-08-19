import { WorkoutSession } from './types';

export interface StrengthSuggestion {
  type: 'strength';
  label: string;
  weight: number;
  reps: number;
}

export interface CardioSuggestion {
  type: 'cardio';
  label: string;
  distance: number;
  durationSeconds: number;
}

/** Most recent time this exercise was logged, regardless of PR status. */
function lastLoggedExercise(sessions: WorkoutSession[], exerciseId: string) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const session of sorted) {
    const match = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (match) return match;
  }
  return undefined;
}

/** Two ways to progress from last time: heavier at the same reps, or more reps at the same weight. */
export function getStrengthSuggestions(sessions: WorkoutSession[], exerciseId: string): StrengthSuggestion[] {
  const last = lastLoggedExercise(sessions, exerciseId);
  if (!last || last.strengthSets.length === 0) return [];

  const baseline = [...last.strengthSets].sort((a, b) => b.weight - a.weight)[0];
  const weightIncrement = baseline.weight >= 60 ? 5 : 2.5;

  return [
    {
      type: 'strength',
      label: `+${weightIncrement} lbs — ${baseline.weight + weightIncrement} × ${baseline.reps}`,
      weight: baseline.weight + weightIncrement,
      reps: baseline.reps,
    },
    {
      type: 'strength',
      label: `+1 rep — ${baseline.weight} × ${baseline.reps + 1}`,
      weight: baseline.weight,
      reps: baseline.reps + 1,
    },
  ];
}

/** Aim ~3% faster at the same distance as last time. */
export function getCardioSuggestion(sessions: WorkoutSession[], exerciseId: string): CardioSuggestion | null {
  const last = lastLoggedExercise(sessions, exerciseId);
  if (!last || last.cardioSets.length === 0) return null;

  const baseline = last.cardioSets[0];
  const targetDuration = Math.round(baseline.durationSeconds * 0.97);

  return {
    type: 'cardio',
    label: `${baseline.distance} mi in ~${Math.round(targetDuration / 60)} min`,
    distance: baseline.distance,
    durationSeconds: targetDuration,
  };
}
