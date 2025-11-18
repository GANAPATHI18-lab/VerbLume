
import React from 'react';
import type { SavedLesson } from '../types';
import { useSavedLessons } from '../hooks/useSavedLessons';
import Button from './ui/Button';
import TrashIcon from './icons/TrashIcon';
import DownloadIcon from './icons/DownloadIcon';

interface SavedLessonsListProps {
    language: string;
    onOpenLesson: (lesson: SavedLesson) => void;
}

const SavedLessonsList: React.FC<SavedLessonsListProps> = ({ language, onOpenLesson }) => {
    const { savedLessons, removeLesson } = useSavedLessons();

    const filteredLessons = savedLessons.filter(l => l.language === language);

    if (filteredLessons.length === 0) return null;

    return (
        <div className="mb-8 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <DownloadIcon className="text-blue-600 dark:text-blue-400" />
                Offline Library
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {filteredLessons.map(lesson => (
                    <div 
                        key={lesson.id} 
                        className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-lg transition-all"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                                {lesson.mode}
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeLesson(lesson.id); }}
                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                title="Delete saved lesson"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 h-12">
                            {lesson.subCategory}
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            Saved: {new Date(lesson.timestamp).toLocaleDateString()}
                        </div>
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => onOpenLesson(lesson)}
                            className="mt-auto w-full justify-center"
                        >
                            Open
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavedLessonsList;
