
import React, { useState, useEffect } from 'react';
import type { LearningMode, Language, Category, QuizType, Tone, Difficulty, GrammarTopicDetails, SavedLesson } from '../types';
import { LEARNING_MODES, QUIZ_TYPES, TONES, DIFFICULTY_LEVELS } from '../types';
import type { PerformanceData } from '../hooks/usePerformance';
import { generateGrammarTopicDetails } from '../services/geminiService';
import PerformanceIndicator from './ui/PerformanceIndicator';
import AddTopicForm from './AddTopicForm';
import AddCategoryForm from './AddCategoryForm';
import Leaderboard from './Leaderboard';
import TrashIcon from './icons/TrashIcon';
import TrophyIcon from './icons/TrophyIcon';
import Button from './ui/Button';
import SavedLessonsList from './SavedLessonsList';

interface CategoryViewProps {
  onSelectMode: (category: string, subCategory: string, mode: LearningMode, options?: { quizType?: QuizType, tone?: Tone, difficulty?: Difficulty }) => void;
  onSelectSavedLesson: (lesson: SavedLesson) => void;
  performanceData: PerformanceData;
  language: Language;
  baseLanguage: Language;
  overallMastery: number;
  categories: Category[];
  points: number;
  onAddTopic: (categoryName: string, topicName: string) => void;
  onAddCategory: (name: string, icon: string) => Promise<void>;
  onRemoveCategory: (categoryName: string) => void;
  onRemoveTopic: (categoryName: string, topicName: string) => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({ onSelectMode, onSelectSavedLesson, performanceData, language, baseLanguage, overallMastery, categories, points, onAddTopic, onAddCategory, onRemoveCategory, onRemoveTopic }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(categories.length > 0 ? categories[0].name : null);
  const [quizSelectionFor, setQuizSelectionFor] = useState<string | null>(null);
  const [visualContextSelectionFor, setVisualContextSelectionFor] = useState<string | null>(null);
  const [storyboardSelectionFor, setStoryboardSelectionFor] = useState<string | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [pendingDifficultySelection, setPendingDifficultySelection] = useState<{
    category: string;
    subCategory: string;
    mode: LearningMode;
    options?: { quizType?: QuizType; tone?: Tone };
  } | null>(null);

  const [detailedTopics, setDetailedTopics] = useState<Record<string, Record<string, GrammarTopicDetails>>>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());

  // Prefetch details for special categories on mount or when language changes
  useEffect(() => {
    const prefetchDetails = () => {
      const specialCategoryNames = ['Core Grammar', 'Auxiliary & Modal Verbs'];
      const categoriesToFetch = categories.filter(c => 
        specialCategoryNames.includes(c.name) && !detailedTopics[c.name] && !loadingCategories.has(c.name)
      );

      if (categoriesToFetch.length === 0) return;
      
      categoriesToFetch.forEach(async (category) => {
        setLoadingCategories(prev => new Set(prev).add(category.name));
        
        try {
          const detailsArray = await generateGrammarTopicDetails(category.subCategories, language, baseLanguage);
          if (detailsArray.length > 0) {
            const detailsMap = detailsArray.reduce((acc, detail) => {
                if (detail.originalTopic) { // Ensure the key exists before assigning
                  acc[detail.originalTopic] = detail;
                }
                return acc;
            }, {} as Record<string, GrammarTopicDetails>);
            setDetailedTopics(prev => ({ ...prev, [category.name]: detailsMap }));
          } else {
             // If the API returns empty, set an empty object to prevent retries
             setDetailedTopics(prev => ({ ...prev, [category.name]: {} }));
          }
        } catch (error) {
          console.error(`Failed to prefetch details for ${category.name}:`, error);
          // Also set empty object on failure
          setDetailedTopics(prev => ({ ...prev, [category.name]: {} }));
        } finally {
          setLoadingCategories(prev => {
            const newSet = new Set(prev);
            newSet.delete(category.name);
            return newSet;
          });
        }
      });
    };

    prefetchDetails();
  }, [categories, language, baseLanguage, detailedTopics, loadingCategories]);

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
    setQuizSelectionFor(null);
    setVisualContextSelectionFor(null);
    setStoryboardSelectionFor(null);
  };
  
  const handleRemoveCategory = (e: React.MouseEvent, categoryName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
        onRemoveCategory(categoryName);
    }
  }
  
  const handleRemoveTopic = (e: React.MouseEvent, categoryName: string, topicName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the topic "${topicName}"? This action cannot be undone.`)) {
        onRemoveTopic(categoryName, topicName);
    }
  }

  const handleDifficultySelect = (difficulty: Difficulty) => {
    if (pendingDifficultySelection) {
      onSelectMode(
        pendingDifficultySelection.category,
        pendingDifficultySelection.subCategory,
        pendingDifficultySelection.mode,
        { ...pendingDifficultySelection.options, difficulty }
      );
      setPendingDifficultySelection(null);
    }
  };

  const getButtonClass = (mode: LearningMode) => {
    switch (mode) {
      case 'Quiz':
        return "text-green-800 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800";
      case 'Visual Context':
        return "text-orange-800 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800";
      case 'Storyboard Scenario':
        return "text-indigo-800 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800";
      case 'Situational Practice':
          return "text-rose-800 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:hover:bg-rose-800";
      case 'AI Role-Play':
          return "text-purple-800 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800";
      case 'AI Tutor':
          return "text-cyan-800 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:hover:bg-cyan-800";
      default:
        return "text-blue-800 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800";
    }
  };


  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-center sm:text-left">
                <PerformanceIndicator score={overallMastery} size="lg" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Overall {language} Mastery
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Your average score across all completed topics.
                    </p>
                </div>
            </div>
            <Button variant="secondary" onClick={() => setIsLeaderboardOpen(true)}>
                <TrophyIcon />
                Leaderboard
            </Button>
        </div>

        <SavedLessonsList language={language} onOpenLesson={onSelectSavedLesson} />

         <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Select a Topic</h2>
        {categories.map((category) => (
          <div key={category.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full text-left p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{category.icon}</span>
                <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                  <button
                      onClick={(e) => handleRemoveCategory(e, category.name)}
                      className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
                      title={`Delete category: ${category.name}`}
                  >
                      <TrashIcon />
                  </button>
                  <span className={`transform transition-transform duration-300 ${openCategory === category.name ? 'rotate-180' : 'rotate-0'}`}>
                    ▼
                  </span>
              </div>
            </button>
            {openCategory === category.name && (
              <div className="p-4 bg-white dark:bg-gray-800 animate-fade-in-down">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.subCategories.map((subCategory) => {
                    const compositeKey = `${language}:${subCategory}`;
                    const performance = performanceData[compositeKey];
                    const isQuizSelection = quizSelectionFor === subCategory;
                    const isVisualContextSelection = visualContextSelectionFor === subCategory;
                    const isStoryboardSelection = storyboardSelectionFor === subCategory;
                    
                    const isSpecialCategory = category.name === 'Core Grammar' || category.name === 'Auxiliary & Modal Verbs';
                    const isLoadingDetails = loadingCategories.has(category.name);
                    const details = detailedTopics[category.name]?.[subCategory];

                    return (
                    <div key={subCategory} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 flex flex-col">
                        <div className="flex justify-between items-start mb-2 gap-2 flex-grow">
                            <div className="flex-1">
                                {isSpecialCategory ? (
                                    <>
                                        {isLoadingDetails && !details ? (
                                            <div className="animate-pulse space-y-2">
                                                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                                            </div>
                                        ) : details ? (
                                            <div>
                                                <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400">{details.topicInTargetLanguage}</h4>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mt-1">
                                                    <p><span className="font-semibold uppercase text-gray-400 dark:text-gray-500 text-[10px]">EN:</span> {details.originalTopic}</p>
                                                    <p><span className="font-semibold uppercase text-gray-400 dark:text-gray-500 text-[10px]">{baseLanguage.substring(0,3)}:</span> {details.topicInBaseLanguage}</p>
                                                    <div className="pt-1">
                                                        <p className="font-mono text-emerald-700 dark:text-emerald-300">/{details.pronunciationEn}/</p>
                                                        <p className="text-emerald-700 dark:text-emerald-300">({details.pronunciationInBase})</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{subCategory}</h4>
                                        )}
                                    </>
                                ) : (
                                     <h4 className="font-semibold text-gray-800 dark:text-gray-200">{subCategory}</h4>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={(e) => handleRemoveTopic(e, category.name, subCategory)}
                                    className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
                                    title={`Delete topic: ${subCategory}`}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                                <PerformanceIndicator score={performance?.average} size="sm" />
                            </div>
                        </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {isQuizSelection ? (
                          <>
                            {QUIZ_TYPES.map((quizType) => (
                                <Button
                                  key={quizType}
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setPendingDifficultySelection({ category: category.name, subCategory, mode: 'Quiz', options: { quizType } })}
                                  className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                                >
                                  {quizType}
                                </Button>
                            ))}
                            <Button size="sm" variant="secondary" onClick={() => setQuizSelectionFor(null)}>Back</Button>
                          </>
                        ) : isVisualContextSelection ? (
                          <>
                            {TONES.map((tone) => (
                                <Button
                                  key={tone}
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setPendingDifficultySelection({ category: category.name, subCategory, mode: 'Visual Context', options: { tone } })}
                                  className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                                >
                                  {tone}
                                </Button>
                            ))}
                            <Button size="sm" variant="secondary" onClick={() => setVisualContextSelectionFor(null)}>Back</Button>
                          </>
                        ) : isStoryboardSelection ? (
                           <>
                            {TONES.map((tone) => (
                                <Button
                                  key={tone}
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setPendingDifficultySelection({ category: category.name, subCategory, mode: 'Storyboard Scenario', options: { tone } })}
                                  className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                                >
                                  {tone}
                                </Button>
                            ))}
                            <Button size="sm" variant="secondary" onClick={() => setStoryboardSelectionFor(null)}>Back</Button>
                          </>
                        ) : (
                          <>
                            {LEARNING_MODES.map((mode) => {
                              if (mode === 'Quiz') {
                                return (
                                  <Button
                                    key={mode}
                                    size="sm"
                                    onClick={() => setQuizSelectionFor(subCategory)}
                                    className={getButtonClass(mode)}
                                  >
                                    {mode}
                                  </Button>
                                )
                              }
                              if (mode === 'Visual Context') {
                                 return (
                                  <Button
                                    key={mode}
                                    size="sm"
                                    onClick={() => setVisualContextSelectionFor(subCategory)}
                                    className={getButtonClass(mode)}
                                  >
                                    {mode}
                                  </Button>
                                )
                              }
                               if (mode === 'Storyboard Scenario') {
                                 return (
                                  <Button
                                    key={mode}
                                    size="sm"
                                    onClick={() => setStoryboardSelectionFor(subCategory)}
                                    className={getButtonClass(mode)}
                                  >
                                    {mode}
                                  </Button>
                                )
                              }
                              
                              return (
                                  <Button
                                    key={mode}
                                    size="sm"
                                    onClick={() => setPendingDifficultySelection({ category: category.name, subCategory, mode })}
                                    className={getButtonClass(mode)}
                                  >
                                    {mode}
                                  </Button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <AddTopicForm categoryName={category.name} onAddTopic={onAddTopic} />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <AddCategoryForm onAddCategory={onAddCategory} />
        </div>
      </div>

      <Leaderboard 
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        userPoints={points}
      />

      {pendingDifficultySelection && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all animate-fade-in-down">
            <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">Select Difficulty</h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              For: <span className="font-semibold">{pendingDifficultySelection.mode}{pendingDifficultySelection.options?.quizType ? ` - ${pendingDifficultySelection.options.quizType}` : ''}{pendingDifficultySelection.options?.tone ? ` - ${pendingDifficultySelection.options.tone}` : ''} - {pendingDifficultySelection.subCategory}</span>
            </p>
            <div className="flex flex-col gap-3">
              {DIFFICULTY_LEVELS.map(level => (
                <Button key={level} variant="primary" onClick={() => handleDifficultySelect(level)} className="justify-center py-3 text-base">
                  {level}
                </Button>
              ))}
              <Button variant="secondary" onClick={() => setPendingDifficultySelection(null)} className="mt-2 justify-center py-3 text-base">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryView;
