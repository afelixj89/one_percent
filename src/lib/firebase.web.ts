import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

import { firebaseConfig } from './firebase-config';

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

export { googleWebClientId } from './firebase-config';
