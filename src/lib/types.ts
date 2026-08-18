export type ExerciseType = 'strength' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  type: ExerciseType;
}

export interface StrengthSet {
  reps: number;
  weight: number;
}

export interface CardioSet {
  distance: number; // miles
  durationSeconds: number;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  type: ExerciseType;
  strengthSets: StrengthSet[];
  cardioSets: CardioSet[];
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date string
  exercises: LoggedExercise[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: ExerciseType;
  date: string;
  // strength: best estimated 1-rep max
  estimated1RM?: number;
  bestWeight?: number;
  bestReps?: number;
  // cardio: best speed (mph)
  bestSpeed?: number;
  bestDistance?: number;
  bestDurationSeconds?: number;
}
