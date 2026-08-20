import { WorkoutSession } from './types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(date: Date): string {
  return date.toDateString();
}

export interface ActivityStats {
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  firstSessionDate: Date | null;
}

export function computeActivityStats(sessions: WorkoutSession[]): ActivityStats {
  if (sessions.length === 0) {
    return { totalSessions: 0, currentStreak: 0, longestStreak: 0, firstSessionDate: null };
  }

  const loggedDays = new Set(sessions.map((s) => toDayKey(new Date(s.date))));
  const sortedDates = [...loggedDays]
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  // Current streak: consecutive logged days counting back from today (streak
  // stays "alive" through today even if today isn't logged yet).
  let currentStreak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!loggedDays.has(toDayKey(cursor))) {
    cursor.setTime(cursor.getTime() - ONE_DAY_MS);
  }
  while (loggedDays.has(toDayKey(cursor))) {
    currentStreak++;
    cursor.setTime(cursor.getTime() - ONE_DAY_MS);
  }

  // Longest streak: longest run of consecutive calendar days in history.
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
    run = gap === ONE_DAY_MS ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  return {
    totalSessions: sessions.length,
    currentStreak,
    longestStreak,
    firstSessionDate: sortedDates[0],
  };
}

/** Session count per week for the trailing `weeks` weeks, oldest first, current week last. */
export function computeWeeklySessionCounts(sessions: WorkoutSession[], weeks = 8): number[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

  const counts = new Array(weeks).fill(0);
  for (const session of sessions) {
    const date = new Date(session.date);
    date.setHours(0, 0, 0, 0);
    const sessionWeekStart = new Date(date);
    sessionWeekStart.setDate(sessionWeekStart.getDate() - sessionWeekStart.getDay());
    const weeksAgo = Math.round((currentWeekStart.getTime() - sessionWeekStart.getTime()) / (7 * ONE_DAY_MS));
    const index = weeks - 1 - weeksAgo;
    if (index >= 0 && index < weeks) counts[index]++;
  }
  return counts;
}
