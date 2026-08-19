import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from '@firebase/app';
import { getReactNativePersistence, initializeAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';

import { firebaseConfig } from './firebase-config';

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(firebaseApp);

export { googleWebClientId } from './firebase-config';
