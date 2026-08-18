import type { Persistence } from '@firebase/auth';

/**
 * @firebase/auth's package.json lists a universal "types" condition before
 * its "react-native" condition, so TypeScript always resolves to the
 * browser-only public types and never sees getReactNativePersistence, even
 * though Metro correctly bundles the real React Native implementation at
 * runtime. This augmentation restores the type for that one function.
 */
declare module '@firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
