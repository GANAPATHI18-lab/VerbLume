
import React, { useState, useCallback, useEffect } from 'react';
import type { Selection, Language, LearningMode, QuizType, Tone, Difficulty, SavedLesson, LearningContent } from './types';
import LanguageSelector from './components/LanguageSelector';
import CategoryView from './components/CategoryView';
import LearningModule from './components/LearningModule';
import { usePerformance } from './hooks/usePerformance';
import { useCategories } from './hooks/useCategories';
import { useLanguages } from './hooks/useLanguages';
import { useStreak } from './hooks/useStreak';
import { usePoints } from './hooks/usePoints';
import { useActivityLog } from './hooks/useActivityLog';
import { useZoom } from './hooks/useZoom';
import FloatingActionButton from './components/FloatingActionButton';
import SparklesIcon from './components/icons/SparklesIcon';
import CoDeveloperPanel from './components/CoDeveloperPanel';
import StreakCounter from './components/ui/StreakCounter';
import PointsDisplay from './components/ui/PointsDisplay';
import ZoomControls from './components/ui/ZoomControls';
import BaseLanguageSelector from './components/BaseLanguageSelector';
import Spinner from './components/ui/Spinner';
import WifiIcon from './components/icons/WifiIcon';

const App: React.FC = () => {
  const [baseLanguage, setBaseLanguage] = useState<string | null>(() => localStorage.getItem('verblume-base-language'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [selection, setSelection] = useState<Selection>({
    language: null,
    category: null,
    subCategory: null,
    mode: null,
    quizType: null,
    tone: null,
    difficulty: null,
  });

  const [preloadedContent, setPreloadedContent] = useState<LearningContent | null>(null);

  const [performanceData, updatePerformance, calculateOverallMastery, removeLanguagePerformance] = usePerformance();
  const [categories, addTopic, addCategory, removeCategory, removeTopic] = useCategories();
  const [languages, addLanguage, removeLanguage, reinitializeLanguages, loadingLanguages] = useLanguages();
  const { streak, recordActivity } = useStreak();
  const { points, addPoints } = usePoints();
  const { hasCompletedToday, markAsCompleted } = useActivityLog();
  const [isCoDevPanelOpen, setIsCoDevPanelOpen] = useState(false);
  const [zoomLevel, zoomIn, zoomOut, resetZoom] = useZoom();
  
  useEffect(() => {
    if (baseLanguage) {
      reinitializeLanguages(baseLanguage);
    }
  }, [baseLanguage, reinitializeLanguages]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);

  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  const handleBaseLanguageSelect = (lang: string) => {
    localStorage.setItem('verblume-base-language', lang);
    setBaseLanguage(lang);
  };

  const handleLanguageSelect = useCallback((language: Language) => {
    if (language === baseLanguage) {
        alert("You can't learn your base language. Please select a different language.");
        return;
    }
    setSelection({
      language,
      category: null,
      subCategory: null,
      mode: null,
      quizType: null,
      tone: null,
      difficulty: null,
    });
  }, [baseLanguage]);

  const handleModeSelect = useCallback((category: string, subCategory: string, mode: LearningMode, options: { quizType?: QuizType; tone?: Tone; difficulty?: Difficulty; } = {}) => {
    setPreloadedContent(null); // Ensure we are not using old preloaded content
    setSelection(prev => ({ ...prev, category, subCategory, mode, quizType: options.quizType || null, tone: options.tone || null, difficulty: options.difficulty || null }));
  }, []);
  
  const handleSelectSavedLesson = useCallback((lesson: SavedLesson) => {
      setPreloadedContent(lesson.content);
      setSelection({
          language: lesson.language,
          category: lesson.category,
          subCategory: lesson.subCategory,
          mode: lesson.mode,
          quizType: lesson.quizType || null,
          tone: lesson.tone || null,
          difficulty: lesson.difficulty || null
      });
  }, []);

  const handleQuizComplete = useCallback((subCategory: string, score: number) => {
    if (selection.language) {
      updatePerformance(selection.language, subCategory, score);
      recordActivity();
      addPoints(Math.round(score * 100));
    }
  }, [updatePerformance, selection.language, recordActivity, addPoints]);
  
  const handleContentLoaded = useCallback((activityId: string) => {
    if (!hasCompletedToday(activityId)) {
      recordActivity();
      addPoints(15);
      markAsCompleted(activityId);
    }
  }, [hasCompletedToday, recordActivity, addPoints, markAsCompleted]);

  const handleBack = useCallback(() => {
    setSelection(prev => {
      if (prev.mode) {
        return { ...prev, mode: null, quizType: null, tone: null, difficulty: null };
      }
      if (prev.language) {
        return { ...prev, language: null, category: null, subCategory: null, mode: null, quizType: null, tone: null, difficulty: null };
      }
      return prev;
    });
    setPreloadedContent(null); // Clear content on back
  }, []);
  
  const handleHome = useCallback(() => {
      setSelection({ language: null, category: null, subCategory: null, mode: null, quizType: null, tone: null, difficulty: null });
      setPreloadedContent(null);
  }, []);
  
  const handleAddTopic = useCallback((categoryName: string, topicName: string) => {
    addTopic(categoryName, topicName);
  }, [addTopic]);

  const handleAddCategory = useCallback(async (name: string, icon: string) => {
    await addCategory(name, icon);
  }, [addCategory]);

  const handleRemoveCategory = useCallback((categoryName: string) => {
    removeCategory(categoryName);
  }, [removeCategory]);
  
  const handleRemoveTopic = useCallback((categoryName: string, topicName: string) => {
    removeTopic(categoryName, topicName);
  }, [removeTopic]);
  
  const handleAddLanguage = useCallback(async (name: string) => {
      if (baseLanguage) {
          await addLanguage(name, baseLanguage);
      }
  }, [addLanguage, baseLanguage]);

  const handleRemoveLanguage = useCallback((name: string) => {
      removeLanguage(name);
      removeLanguagePerformance(name);
  }, [removeLanguage, removeLanguagePerformance]);

  const getContextString = () => {
    if (!baseLanguage) return "User is on the Base Language Selection screen.";
    if (selection.mode && selection.language) {
        let details = `Mode: ${selection.mode}`;
        if (selection.quizType) details += `, Quiz Type: ${selection.quizType}`;
        if (selection.tone) details += `, Tone: ${selection.tone}`;
        if (selection.difficulty) details += `, Difficulty: ${selection.difficulty}`;
        return `User is in the Learning Module. Language: ${selection.language}, Category: ${selection.category}, Sub-Category: ${selection.subCategory}. ${details}. Base Language: ${baseLanguage}.`;
    }
    if (selection.language) {
        return `User is viewing the Category List for language: ${selection.language}. Base Language: ${baseLanguage}.`;
    }
    return `User is on the Language Selection screen. Base Language: ${baseLanguage}.`;
  };

  const overallMastery = selection.language ? calculateOverallMastery(selection.language) : 0;

  if (!baseLanguage) {
    return <BaseLanguageSelector onSelect={handleBaseLanguageSelect} />;
  }
  
  if (loadingLanguages) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <Spinner />
          </div>
      );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1
          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400 cursor-pointer"
          onClick={handleHome}
        >
          VerbLume
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
            {!isOnline && (
                <div className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <WifiIcon className="w-4 h-4" offline />
                    Offline
                </div>
            )}
            <ZoomControls zoomLevel={zoomLevel} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
            <StreakCounter streak={streak} />
            <PointsDisplay points={points} />
        </div>
      </header>

      <main>
        {selection.mode && selection.language && selection.category && selection.subCategory ? (
          <LearningModule
            language={selection.language}
            baseLanguage={baseLanguage}
            languages={languages}
            category={selection.category}
            subCategory={selection.subCategory}
            mode={selection.mode}
            quizType={selection.quizType}
            tone={selection.tone}
            difficulty={selection.difficulty}
            preloadedContent={preloadedContent}
            onBack={handleBack}
            onQuizComplete={(score) => selection.subCategory && handleQuizComplete(selection.subCategory, score)}
            onContentLoaded={handleContentLoaded}
          />
        ) : selection.language ? (
          <CategoryView
            onSelectMode={handleModeSelect}
            onSelectSavedLesson={handleSelectSavedLesson}
            performanceData={performanceData}
            language={selection.language}
            baseLanguage={baseLanguage}
            overallMastery={overallMastery}
            categories={categories}
            points={points}
            onAddTopic={handleAddTopic}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
            onRemoveTopic={handleRemoveTopic}
          />
        ) : (
          <LanguageSelector 
            onSelect={handleLanguageSelect}
            languages={languages}
            baseLanguage={baseLanguage}
            onAddLanguage={handleAddLanguage}
            onRemoveLanguage={handleRemoveLanguage}
          />
        )}
      </main>
      <FloatingActionButton onClick={() => setIsCoDevPanelOpen(true)}>
          <SparklesIcon />
      </FloatingActionButton>
      <CoDeveloperPanel 
        isOpen={isCoDevPanelOpen} 
        onClose={() => setIsCoDevPanelOpen(false)} 
        currentContext={getContextString()}
      />
    </div>
  );
};

export default App;
