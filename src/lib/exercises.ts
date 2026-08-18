import { Exercise } from './types';

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', category: 'Chest', type: 'strength' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', category: 'Chest', type: 'strength' },
  { id: 'push-ups', name: 'Push-Ups', category: 'Chest', type: 'strength' },
  { id: 'cable-fly', name: 'Cable Fly', category: 'Chest', type: 'strength' },
  // Back
  { id: 'deadlift', name: 'Deadlift', category: 'Back', type: 'strength' },
  { id: 'pull-ups', name: 'Pull-Ups', category: 'Back', type: 'strength' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'Back', type: 'strength' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', type: 'strength' },
  // Legs
  { id: 'squat', name: 'Back Squat', category: 'Legs', type: 'strength' },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', type: 'strength' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Legs', type: 'strength' },
  { id: 'walking-lunge', name: 'Walking Lunge', category: 'Legs', type: 'strength' },
  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', category: 'Shoulders', type: 'strength' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'Shoulders', type: 'strength' },
  { id: 'face-pull', name: 'Face Pull', category: 'Shoulders', type: 'strength' },
  // Arms
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'Arms', type: 'strength' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Arms', type: 'strength' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'Arms', type: 'strength' },
  // Core
  { id: 'plank', name: 'Plank', category: 'Core', type: 'strength' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'Core', type: 'strength' },
  { id: 'cable-crunch', name: 'Cable Crunch', category: 'Core', type: 'strength' },
  // Cardio
  { id: 'running', name: 'Running', category: 'Cardio', type: 'cardio' },
  { id: 'cycling', name: 'Cycling', category: 'Cardio', type: 'cardio' },
  { id: 'rowing', name: 'Rowing', category: 'Cardio', type: 'cardio' },
  { id: 'incline-walk', name: 'Incline Walk', category: 'Cardio', type: 'cardio' },
];

export const CATEGORIES = Array.from(new Set(EXERCISES.map((e) => e.category)));

// A simple push/pull/legs/cardio split by day of week, used only as a
// starting suggestion on the Home screen — the user builds their own plan.
const DAY_FOCUS: Record<number, string[]> = {
  0: ['Cardio', 'Core'], // Sunday
  1: ['Chest', 'Shoulders'], // Monday
  2: ['Back', 'Arms'], // Tuesday
  3: ['Legs'], // Wednesday
  4: ['Chest', 'Back'], // Thursday
  5: ['Legs', 'Core'], // Friday
  6: ['Cardio'], // Saturday
};

export function getTodaysFocus(date: Date = new Date()): string[] {
  return DAY_FOCUS[date.getDay()];
}

export function getSuggestedExercises(date: Date = new Date(), limit = 4): Exercise[] {
  const focus = getTodaysFocus(date);
  return EXERCISES.filter((e) => focus.includes(e.category)).slice(0, limit);
}

export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
