
import { useState, useCallback, useEffect } from 'react';
import type { SavedLesson } from '../types';

const STORAGE_KEY = 'verblume-saved-lessons';
const MAX_SAVED_LESSONS = 15;

export const useSavedLessons = () => {
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedLessons(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load saved lessons:", error);
    }
  }, []);

  const persist = (lessons: SavedLesson[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
      setSavedLessons(lessons);
    } catch (error) {
      console.error("Failed to save lessons to localStorage:", error);
      alert("Failed to save lesson. Storage might be full.");
    }
  };

  const saveLesson = useCallback((lesson: SavedLesson) => {
    setSavedLessons(prev => {
      // Check for duplicates based on ID
      if (prev.some(l => l.id === lesson.id)) return prev;

      if (prev.length >= MAX_SAVED_LESSONS) {
        alert(`You can only save up to ${MAX_SAVED_LESSONS} lessons offline. Please remove some old lessons first.`);
        return prev;
      }

      const newLessons = [lesson, ...prev];
      persist(newLessons);
      return newLessons;
    });
  }, []);

  const removeLesson = useCallback((id: string) => {
    setSavedLessons(prev => {
      const newLessons = prev.filter(l => l.id !== id);
      persist(newLessons);
      return newLessons;
    });
  }, []);

  const isLessonSaved = useCallback((id: string) => {
    return savedLessons.some(l => l.id === id);
  }, [savedLessons]);

  return { savedLessons, saveLesson, removeLesson, isLessonSaved };
};
