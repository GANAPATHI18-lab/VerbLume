
import { useState, useCallback } from 'react';
import type { LanguageDetails } from '../types';
import { generateLanguageDetails } from '../services/geminiService';

const CUSTOM_LANGS_STORAGE_KEY = 'verblume-custom-languages';

// Base languages offered by the app
const defaultLanguagesConfig = [
  { name: 'English', emoji: '🇬🇧', ttsCode: 'en-US' },
  { name: 'Hindi', emoji: '🇮🇳', ttsCode: 'hi-IN' },
  { name: 'Kannada', emoji: '🌸', ttsCode: 'kn-IN' },
  { name: 'Tamil', emoji: '☀️', ttsCode: 'ta-IN' },
  { name: 'Malayalam', emoji: '🌴', ttsCode: 'ml-IN' },
  { name: 'Telugu', emoji: '🛕', ttsCode: 'te-IN' }
];

const getStoredCustomLanguages = (): Omit<LanguageDetails, 'nativeName'>[] => {
  try {
    const stored = window.localStorage.getItem(CUSTOM_LANGS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed) && parsed.every(item => 'name' in item && 'ttsCode' in item)) {
        return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to parse custom languages from localStorage", error);
    return [];
  }
};

export const useLanguages = (): [
  LanguageDetails[],
  (languageName: string, baseLanguage: string) => Promise<void>,
  (languageName: string) => void,
  (baseLanguage: string) => Promise<void>,
  boolean
] => {
  const [languages, setLanguages] = useState<LanguageDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const persistCustomLanguages = (customLanguages: Omit<LanguageDetails, 'nativeName'>[]) => {
      try {
        window.localStorage.setItem(CUSTOM_LANGS_STORAGE_KEY, JSON.stringify(customLanguages));
      } catch (error) {
        console.error("Failed to save custom languages to localStorage", error);
      }
  }
  
  const reinitializeLanguages = useCallback(async (baseLanguage: string) => {
    setLoading(true);
    try {
        const fetchDetails = async (lang: {name: string, emoji: string, ttsCode: string}) => {
            const details = await generateLanguageDetails(lang.name, baseLanguage);
            return { ...lang, nativeName: details.nativeName };
        };

        const defaultLangsPromises = defaultLanguagesConfig.map(lang => 
            fetchDetails(lang).then(d => ({...d, isCustom: false}))
        );

        const customLangs = getStoredCustomLanguages();
        const customLangsPromises = customLangs.map(lang => 
            fetchDetails(lang).then(d => ({...d, isCustom: true}))
        );

        const allLangs = await Promise.all([...defaultLangsPromises, ...customLangsPromises]);
        
        setLanguages(allLangs);

    } catch (error) {
        console.error("Failed to initialize languages:", error);
        // Fallback to basic names if API fails
        setLanguages(defaultLanguagesConfig.map(l => ({...l, nativeName: l.name, isCustom: false })));
    } finally {
        setLoading(false);
    }
  }, []);

  const addLanguage = useCallback(async (languageName: string, baseLanguage: string) => {
    const trimmedName = languageName.trim();
    if (!trimmedName) return;

    if (languages.some(lang => lang.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert(`Language "${trimmedName}" already exists.`);
        return;
    }

    try {
        const details = await generateLanguageDetails(trimmedName, baseLanguage);
        const newLanguage: LanguageDetails = {
            name: trimmedName,
            nativeName: details.nativeName,
            emoji: details.emoji,
            ttsCode: details.ttsCode,
            isCustom: true
        };
        
        setLanguages(prev => [...prev, newLanguage]);

        const customLangs = getStoredCustomLanguages();
        persistCustomLanguages([...customLangs, {name: newLanguage.name, emoji: newLanguage.emoji, ttsCode: newLanguage.ttsCode, isCustom: true}]);

    } catch (error) {
        console.error("Failed to add new language:", error);
        if (error instanceof Error) alert(`Could not add language: ${error.message}`);
        else alert("An unknown error occurred while adding the language.");
        throw error;
    }

  }, [languages]);

  const removeLanguage = useCallback((languageName: string) => {
    setLanguages(prev => prev.filter(lang => lang.name !== languageName));
    const customLangs = getStoredCustomLanguages();
    persistCustomLanguages(customLangs.filter(lang => lang.name !== languageName));
  }, []);

  return [languages, addLanguage, removeLanguage, reinitializeLanguages, loading];
};
