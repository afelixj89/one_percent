import { CardioSet, PersonalRecord, StrengthSet, WorkoutSession } from './types';

/** Epley formula: a standard estimate of 1-rep max from a submaximal set. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

/** Average speed in mph for a cardio set. */
export function cardioSpeed(set: CardioSet): number {
  if (set.durationSeconds <= 0) return 0;
  return set.distance / (set.durationSeconds / 3600);
}

/** Scans full workout history and returns the best-ever record per exercise. */
export function computePRs(sessions: WorkoutSession[]): Record<string, PersonalRecord> {
  const prs: Record<string, PersonalRecord> = {};

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  for (const session of sorted) {
    for (const exercise of session.exercises) {
      if (exercise.type === 'strength') {
        for (const set of exercise.strengthSets) {
          const e1rm = estimate1RM(set.weight, set.reps);
          const existing = prs[exercise.exerciseId];
          if (!existing || (existing.estimated1RM ?? 0) < e1rm) {
            prs[exercise.exerciseId] = {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              type: 'strength',
              date: session.date,
              estimated1RM: e1rm,
              bestWeight: set.weight,
              bestReps: set.reps,
            };
          }
        }
      } else {
        for (const set of exercise.cardioSets) {
          const speed = cardioSpeed(set);
          const existing = prs[exercise.exerciseId];
          if (!existing || (existing.bestSpeed ?? 0) < speed) {
            prs[exercise.exerciseId] = {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              type: 'cardio',
              date: session.date,
              bestSpeed: speed,
              bestDistance: set.distance,
              bestDurationSeconds: set.durationSeconds,
            };
          }
        }
      }
    }
  }

  return prs;
}

export type SetFeedbackStatus = 'pr' | 'close' | 'behind' | 'first';

export interface SetFeedback {
  status: SetFeedbackStatus;
  message: string;
}

/** Live feedback for a strength set as it's being entered, vs. the current PR. */
export function feedbackForStrengthSet(set: StrengthSet, pr: PersonalRecord | undefined): SetFeedback {
  const e1rm = estimate1RM(set.weight, set.reps);

  if (!pr || pr.estimated1RM === undefined) {
    return { status: 'first', message: "First time logging this — let's set a baseline." };
  }

  const diff = e1rm - pr.estimated1RM;
  const pctDiff = (diff / pr.estimated1RM) * 100;

  if (diff > 0) {
    return { status: 'pr', message: `New PR! Est. 1RM up ${diff.toFixed(1)} lbs.` };
  }
  if (pctDiff >= -5) {
    return {
      status: 'close',
      message: `Close to your PR (${Math.abs(pctDiff).toFixed(0)}% off). Try +2.5 lbs or +1 rep next time.`,
    };
  }
  return {
    status: 'behind',
    message: `${Math.abs(pctDiff).toFixed(0)}% below your PR of ${pr.bestWeight} lbs x ${pr.bestReps}.`,
  };
}

/** Live feedback for a cardio set as it's being entered, vs. the current PR. */
export function feedbackForCardioSet(set: CardioSet, pr: PersonalRecord | undefined): SetFeedback {
  const speed = cardioSpeed(set);

  if (!pr || pr.bestSpeed === undefined) {
    return { status: 'first', message: "First time logging this — let's set a baseline." };
  }

  const diff = speed - pr.bestSpeed;
  const pctDiff = (diff / pr.bestSpeed) * 100;

  if (diff > 0) {
    return { status: 'pr', message: `New PR! Pace up ${diff.toFixed(1)} mph.` };
  }
  if (pctDiff >= -5) {
    return { status: 'close', message: `Close to your PR pace (${Math.abs(pctDiff).toFixed(0)}% off).` };
  }
  return { status: 'behind', message: `${Math.abs(pctDiff).toFixed(0)}% slower than your best pace.` };
}
