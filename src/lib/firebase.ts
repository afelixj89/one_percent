import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from '@firebase/auth';
import { initializeApp } from 'firebase/app';

import { firebaseConfig } from './firebase-config';

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { googleWebClientId } from './firebase-config';
