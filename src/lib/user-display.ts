import { User } from '@firebase/auth';

export function getFirstName(user: User | null | undefined): string {
  if (user?.displayName) return user.displayName.trim().split(' ')[0];
  if (user?.email) return user.email.split('@')[0];
  return 'there';
}

export function getDisplayName(user: User | null | undefined): string {
  return user?.displayName?.trim() || user?.email || 'Signed in';
}
