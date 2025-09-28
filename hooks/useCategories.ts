



import { useState } from 'react';
import type { Category } from '../types';
import { CATEGORIES as defaultCategories } from '../constants';
import { generateSubCategories } from '../services/geminiService';

const STORAGE_KEY = 'verblume-categories';

const getStoredCategories = (): Category[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Basic validation to ensure it's an array of categories
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => 'name' in item && 'subCategories' in item)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse categories from localStorage", error);
  }
  // If nothing stored or parsing fails, return default
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCategories));
  return defaultCategories;
};

export const useCategories = (): [
  Category[],
  (categoryName: string, topicName: string) => void,
  (name: string, icon: string) => Promise<void>,
  (categoryName: string) => void,
  (categoryName: string, topicName: string) => void
] => {
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);

  const persistCategories = (newCategories: Category[]) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
      } catch (error) {
        console.error("Failed to save categories to localStorage", error);
      }
  }

  const addTopic = (categoryName: string, topicName: string) => {
    const trimmedTopic = topicName.trim();
    if (!trimmedTopic) return;

    setCategories(prevCategories => {
      let topicExists = false;
      const newCategories = prevCategories.map(category => {
        if (category.name === categoryName) {
          if (category.subCategories.find(sub => sub.toLowerCase() === trimmedTopic.toLowerCase())) {
            topicExists = true;
            return category;
          }
          return {
            ...category,
            subCategories: [...category.subCategories, trimmedTopic],
          };
        }
        return category;
      });
      
      if (topicExists) {
          alert(`Topic "${trimmedTopic}" already exists in this category.`);
          return prevCategories;
      }

      persistCategories(newCategories);
      return newCategories;
    });
  };

  const addCategory = async (name: string, icon: string) => {
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim();
    if (!trimmedName || !trimmedIcon) return;
    
    const categoryExists = categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (categoryExists) {
      alert(`Category "${trimmedName}" already exists.`);
      return;
    }

    const generatedSubs = await generateSubCategories(trimmedName);
    const newCategory: Category = { name: trimmedName, icon: trimmedIcon, subCategories: generatedSubs };

    setCategories(prevCategories => {
      const newCategories = [...prevCategories, newCategory];
      persistCategories(newCategories);
      return newCategories;
    });
  };

  const removeCategory = (categoryName: string) => {
    setCategories(prevCategories => {
        const newCategories = prevCategories.filter(cat => cat.name !== categoryName);
        persistCategories(newCategories);
        return newCategories;
    });
  };

  const removeTopic = (categoryName: string, topicName: string) => {
    setCategories(prevCategories => {
        const newCategories = prevCategories.map(cat => {
            if (cat.name === categoryName) {
                return {
                    ...cat,
                    subCategories: cat.subCategories.filter(sub => sub !== topicName)
                };
            }
            return cat;
        });
        persistCategories(newCategories);
        return newCategories;
    });
  };


  return [categories, addTopic, addCategory, removeCategory, removeTopic];
};
