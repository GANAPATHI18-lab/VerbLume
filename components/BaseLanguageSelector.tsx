
import React from 'react';
import Card from './ui/Card';

interface BaseLanguageSelectorProps {
  onSelect: (language: string) => void;
}

// A static list of languages to choose as the base language.
const supportedBaseLanguages = [
  { name: 'English', nativeName: 'English', emoji: '🇬🇧' },
  { name: 'Telugu', nativeName: 'తెలుగు', emoji: '🛕' },
  { name: 'Hindi', nativeName: 'हिन्दी', emoji: '🇮🇳' },
  { name: 'Spanish', nativeName: 'Español', emoji: '🇪🇸' },
  { name: 'French', nativeName: 'Français', emoji: '🇫🇷' },
];

const BaseLanguageSelector: React.FC<BaseLanguageSelectorProps> = ({ onSelect }) => {
  return (
    <div className="animate-fade-in min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <div className="text-center mb-10">
        <span className="text-5xl">🎓</span>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400 mt-2">
            Welcome to VerbLume
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-8">
            First, choose your instruction language
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
            This is the language you already know. All lessons and explanations will be in this language.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-5xl">
        {supportedBaseLanguages.map((lang) => (
          <Card
            key={lang.name}
            onClick={() => onSelect(lang.name)}
            className="flex flex-col items-center justify-center p-6 text-center group"
          >
            <span className="text-6xl mb-4">{lang.emoji}</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{lang.name}</h3>
            <p className="text-gray-500 dark:text-gray-400">{lang.nativeName}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BaseLanguageSelector;
