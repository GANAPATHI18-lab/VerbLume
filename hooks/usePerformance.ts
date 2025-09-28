
import { useState, useCallback } from 'react';
import type { Language } from '../types';

const STORAGE_KEY = 'verblume-performance';

interface PerformanceRecord {
  scores: number[]; // Store individual scores
  average: number; // The calculated average
}

export interface PerformanceData {
  [compositeKey: string]: PerformanceRecord; // key is `language:subCategory`
}

const getStoredPerformance = (): PerformanceData => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to parse performance data from localStorage", error);
    return {};
  }
};

export const usePerformance = (): [
  PerformanceData, 
  (language: Language, subCategory: string, score: number) => void,
  (language: Language) => number,
  (language: Language) => void
] => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>(getStoredPerformance);

  const updatePerformance = useCallback((language: Language, subCategory: string, newScore: number) => {
    // Score must be between 0 and 1
    if (newScore < 0 || newScore > 1) return;

    setPerformanceData(prevData => {
      const compositeKey = `${language}:${subCategory}`;
      const existingRecord = prevData[compositeKey] || { scores: [], average: 0 };
      
      const newScores = [...existingRecord.scores, newScore];
      const newAverage = newScores.reduce((acc, s) => acc + s, 0) / newScores.length;

      const newData = {
        ...prevData,
        [compositeKey]: {
          scores: newScores,
          average: newAverage,
        }
      };
      
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      } catch (error) {
        console.error("Failed to save performance data to localStorage", error);
      }

      return newData;
    });
  }, []);

  const calculateOverallMastery = useCallback((language: Language): number => {
    const languageScores = Object.entries(performanceData)
      .filter(([key]) => key.startsWith(`${language}:`))
      // FIX: Cast `record` to `PerformanceRecord` to resolve a type inference issue where
      // TypeScript was treating it as `unknown`.
      .map(([, record]) => (record as PerformanceRecord).average);

    if (languageScores.length === 0) {
      return 0;
    }

    const total = languageScores.reduce((acc, score) => acc + score, 0);
    return total / languageScores.length;

  }, [performanceData]);

  const removeLanguagePerformance = useCallback((language: Language) => {
    setPerformanceData(prevData => {
      const newData: PerformanceData = {};
      Object.keys(prevData).forEach(key => {
        if (!key.startsWith(`${language}:`)) {
          newData[key] = prevData[key];
        }
      });

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      } catch (error) {
        console.error("Failed to save performance data to localStorage", error);
      }
      return newData;
    });
  }, []);

  return [performanceData, updatePerformance, calculateOverallMastery, removeLanguagePerformance];
};
