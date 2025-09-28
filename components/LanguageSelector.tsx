import React from 'react';
import type { Language, LanguageDetails } from '../types';
import Card from './ui/Card';
import AddLanguageForm from './AddLanguageForm';
import TrashIcon from './icons/TrashIcon';

interface LanguageSelectorProps {
  onSelect: (language: Language) => void;
  languages: LanguageDetails[];
  baseLanguage: Language;
  onAddLanguage: (name: string) => Promise<void>;
  onRemoveLanguage: (name: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect, languages, baseLanguage, onAddLanguage, onRemoveLanguage }) => {
  
  const handleRemove = (e: React.MouseEvent, languageName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${languageName}? All of your progress for this language will be permanently lost.`)) {
        onRemoveLanguage(languageName);
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-2">
        Choose a Language to Learn
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        (All instructions will be in {baseLanguage})
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {languages.map((lang) => (
          <Card
            key={lang.name}
            onClick={() => onSelect(lang.name)}
            className="flex flex-col items-center justify-center p-6 text-center group relative"
          >
            {lang.isCustom && (
                <button 
                    onClick={(e) => handleRemove(e, lang.name)}
                    className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 bg-white/50 dark:bg-gray-900/50 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-all"
                    title={`Remove ${lang.name}`}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}
            <span className="text-6xl mb-4">{lang.emoji}</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{lang.name}</h3>
            <p className="text-gray-500 dark:text-gray-400">{lang.nativeName}</p>
          </Card>
        ))}
        <AddLanguageForm onAddLanguage={onAddLanguage} />
      </div>
    </div>
  );
};

export default LanguageSelector;
