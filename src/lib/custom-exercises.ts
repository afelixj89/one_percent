import AsyncStorage from '@react-native-async-storage/async-storage';

import { Exercise, ExerciseType } from './types';

const CUSTOM_EXERCISES_KEY = 'onepercent:customExercises';

export const MY_EXERCISES_CATEGORY = 'My Exercises';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getCustomExercises(): Promise<Exercise[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Exercise[];
  } catch {
    return [];
  }
}

export async function addCustomExercise(name: string, type: ExerciseType, category: string): Promise<Exercise> {
  const existing = await getCustomExercises();
  const exercise: Exercise = {
    id: `custom-${slugify(name)}-${Date.now()}`,
    name: name.trim(),
    category,
    type,
  };
  await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify([...existing, exercise]));
  return exercise;
}
