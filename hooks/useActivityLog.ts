
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'verblume-daily-activity-log';

interface DailyLog {
  date: string; // YYYY-MM-DD
  completedIds: string[];
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const getStoredLog = (): DailyLog => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: DailyLog = JSON.parse(stored);
      // If the stored log is not for today, reset it.
      if (parsed.date === getTodayString()) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse activity log from localStorage", error);
  }
  // Return a fresh log for today
  return { date: getTodayString(), completedIds: [] };
};

export const useActivityLog = () => {
  const [log, setLog] = useState<DailyLog>(getStoredLog);

  const persistLog = (newLog: DailyLog) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newLog));
    } catch (error) {
      console.error("Failed to save activity log to localStorage", error);
    }
  };

  const hasCompletedToday = useCallback((activityId: string): boolean => {
    // A bit of defensive programming: if the log in state is old, create a new one on the fly for the check
    const today = getTodayString();
    const currentLog = log.date === today ? log : { date: today, completedIds: [] };
    return currentLog.completedIds.includes(activityId);
  }, [log]);

  const markAsCompleted = useCallback((activityId: string) => {
    setLog(prevLog => {
      const today = getTodayString();
      // If the log in state is from a previous day, start a new one
      const currentLog = prevLog.date === today ? prevLog : { date: today, completedIds: [] };
      
      if (currentLog.completedIds.includes(activityId)) {
        return prevLog; // Already completed, no change needed
      }

      const newLog: DailyLog = {
        ...currentLog,
        completedIds: [...currentLog.completedIds, activityId],
      };
      persistLog(newLog);
      return newLog;
    });
  }, []);

  return { hasCompletedToday, markAsCompleted };
};
