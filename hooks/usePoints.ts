
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'verblume-points';

const getStoredPoints = (): number => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const points = stored ? parseInt(stored, 10) : 0;
    return !isNaN(points) ? points : 0;
  } catch (error) {
    console.error("Failed to parse points from localStorage", error);
    return 0;
  }
};

export const usePoints = (): { points: number; addPoints: (amount: number) => void; } => {
  const [points, setPoints] = useState<number>(getStoredPoints);

  const addPoints = useCallback((amount: number) => {
    if (amount <= 0) return;
    setPoints(prevPoints => {
      const newPoints = prevPoints + amount;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(newPoints));
      } catch (error) {
        console.error("Failed to save points to localStorage", error);
      }
      return newPoints;
    });
  }, []);

  return { points, addPoints };
};
