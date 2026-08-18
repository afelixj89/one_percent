import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from '@firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from './firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signUpWithEmail: async (email, password, name) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name?.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
        // updateProfile mutates the same User instance in place, so React
        // won't detect a change unless we hand it a fresh reference.
        setUser(Object.assign(Object.create(Object.getPrototypeOf(credential.user)), credential.user));
      }
    },
    signInWithGoogleIdToken: async (idToken) => {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    },
    signOut: async () => {
      await firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
