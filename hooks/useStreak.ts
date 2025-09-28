
import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'verblume-streak-log';

const getStoredLog = (): number[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) && parsed.every(item => typeof item === 'number') ? parsed : [];
  } catch (error) {
    console.error("Failed to parse streak log from localStorage", error);
    return [];
  }
};

const calculateStreak = (log: number[]): number => {
    if (log.length === 0) return 0;

    // Get unique days by setting time to 0, then sort descending
    const uniqueDays = [...new Set(log.map(ts => new Date(ts).setHours(0, 0, 0, 0)))].sort((a, b) => b - a);

    if (uniqueDays.length === 0) return 0;

    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today).setDate(new Date(today).getDate() - 1);

    const mostRecentDay = uniqueDays[0];

    // If the last activity wasn't today or yesterday, the streak is broken
    if (mostRecentDay !== today && mostRecentDay !== yesterday) {
        return 0;
    }

    let currentStreak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
        const currentDay = uniqueDays[i];
        const previousDay = uniqueDays[i + 1];
        const oneDay = 24 * 60 * 60 * 1000;

        // Check if the previous day is exactly one day before the current day
        if (currentDay - previousDay === oneDay) {
            currentStreak++;
        } else {
            // A gap was found, so the streak ends here
            break;
        }
    }

    return currentStreak;
};


export const useStreak = (): { streak: number, recordActivity: () => void } => {
  const [activityLog, setActivityLog] = useState<number[]>(getStoredLog);

  const recordActivity = useCallback(() => {
    setActivityLog(prevLog => {
      const now = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);

      // Check if an activity has already been logged today
      const hasActivityToday = prevLog.some(ts => {
          const logDayStart = new Date(ts).setHours(0, 0, 0, 0);
          return logDayStart === todayStart;
      });

      if (hasActivityToday) {
        return prevLog; // No change needed
      }

      const newLog = [...prevLog, now];
      
      try {
        // Keep the log from getting excessively large, e.g., store last 365 days of activity
        const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
        const filteredLog = newLog.filter(ts => ts > oneYearAgo);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLog));
      } catch (error) {
        console.error("Failed to save streak log to localStorage", error);
      }

      return newLog;
    });
  }, []);

  const streak = useMemo(() => calculateStreak(activityLog), [activityLog]);

  return { streak, recordActivity };
};
