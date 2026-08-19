import { estimate1RM, cardioSpeed } from './pr-utils';
import { ExerciseType, LoggedExercise, WorkoutSession } from './types';

/** Sessions logged exactly 7 days before the given date (same weekday). */
export function getSessionsOnSameWeekdayLastWeek(
  sessions: WorkoutSession[],
  date: Date
): WorkoutSession[] {
  const target = new Date(date);
  target.setDate(target.getDate() - 7);
  return sessions.filter((s) => new Date(s.date).toDateString() === target.toDateString());
}

export interface ExerciseComparison {
  exerciseId: string;
  exerciseName: string;
  type: ExerciseType;
  current?: LoggedExercise;
  previous?: LoggedExercise;
}

/** Pairs up exercises between two sets of sessions (same day, a week apart) by exercise id. */
export function compareExercises(
  currentSessions: WorkoutSession[],
  previousSessions: WorkoutSession[]
): ExerciseComparison[] {
  const currentMap = new Map<string, LoggedExercise>();
  const previousMap = new Map<string, LoggedExercise>();
  const names = new Map<string, string>();

  for (const session of currentSessions) {
    for (const ex of session.exercises) {
      currentMap.set(ex.exerciseId, ex);
      names.set(ex.exerciseId, ex.exerciseName);
    }
  }
  for (const session of previousSessions) {
    for (const ex of session.exercises) {
      if (!previousMap.has(ex.exerciseId)) previousMap.set(ex.exerciseId, ex);
      names.set(ex.exerciseId, ex.exerciseName);
    }
  }

  return Array.from(names.entries()).map(([exerciseId, exerciseName]) => {
    const current = currentMap.get(exerciseId);
    const previous = previousMap.get(exerciseId);
    return {
      exerciseId,
      exerciseName,
      type: (current ?? previous)!.type,
      current,
      previous,
    };
  });
}

export type ComparisonStatus = 'better' | 'same' | 'worse' | 'new' | 'missed';

export interface ComparisonResult {
  status: ComparisonStatus;
  message: string;
}

function bestStrengthE1RM(ex: LoggedExercise | undefined): number | null {
  if (!ex || ex.strengthSets.length === 0) return null;
  return Math.max(...ex.strengthSets.map((s) => estimate1RM(s.weight, s.reps)));
}

function bestCardioSpeed(ex: LoggedExercise | undefined): number | null {
  if (!ex || ex.cardioSets.length === 0) return null;
  return Math.max(...ex.cardioSets.map((s) => cardioSpeed(s)));
}

export function compareToLastWeek(comparison: ExerciseComparison): ComparisonResult {
  if (!comparison.previous) {
    return { status: 'new', message: "Didn't do this last week" };
  }
  if (!comparison.current) {
    return { status: 'missed', message: 'Not logged yet this week' };
  }

  if (comparison.type === 'strength') {
    const curr = bestStrengthE1RM(comparison.current)!;
    const prev = bestStrengthE1RM(comparison.previous)!;
    const diff = curr - prev;
    if (diff > 0.01) return { status: 'better', message: `Up ${diff.toFixed(1)} lbs (est.)` };
    if (diff < -0.01) return { status: 'worse', message: `Down ${Math.abs(diff).toFixed(1)} lbs (est.)` };
    return { status: 'same', message: 'Matched last week' };
  }

  const curr = bestCardioSpeed(comparison.current)!;
  const prev = bestCardioSpeed(comparison.previous)!;
  const diff = curr - prev;
  if (diff > 0.01) return { status: 'better', message: `Up ${diff.toFixed(1)} mph` };
  if (diff < -0.01) return { status: 'worse', message: `Down ${Math.abs(diff).toFixed(1)} mph` };
  return { status: 'same', message: 'Matched last week' };
}
