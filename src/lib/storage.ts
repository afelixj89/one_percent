import { collection, deleteDoc, doc, getDocs, setDoc } from '@firebase/firestore';

import { auth, db } from './firebase';
import { WorkoutSession } from './types';

function sessionsCollection(uid: string) {
  return collection(db, 'users', uid, 'sessions');
}

export async function getSessions(): Promise<WorkoutSession[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(sessionsCollection(uid));
  return snapshot.docs.map((d) => d.data() as WorkoutSession);
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  await setDoc(doc(sessionsCollection(uid), session.id), session);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  await deleteDoc(doc(sessionsCollection(uid), sessionId));
}
