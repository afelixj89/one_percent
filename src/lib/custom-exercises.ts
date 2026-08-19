import { collection, doc, getDocs, setDoc } from '@firebase/firestore';

import { auth, db } from './firebase';
import { Exercise, ExerciseType } from './types';

export const MY_EXERCISES_CATEGORY = 'My Exercises';

function customExercisesCollection(uid: string) {
  return collection(db, 'users', uid, 'customExercises');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getCustomExercises(): Promise<Exercise[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(customExercisesCollection(uid));
  return snapshot.docs.map((d) => d.data() as Exercise);
}

export async function addCustomExercise(name: string, type: ExerciseType, category: string): Promise<Exercise> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const exercise: Exercise = {
    id: `custom-${slugify(name)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    category,
    type,
  };
  await setDoc(doc(customExercisesCollection(uid), exercise.id), exercise);
  return exercise;
}
