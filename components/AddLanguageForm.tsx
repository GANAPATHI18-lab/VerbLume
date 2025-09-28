import React, { useState } from 'react';
import Button from './ui/Button';
import PlusIcon from './icons/PlusIcon';
import Spinner from './ui/Spinner';
import Card from './ui/Card';

interface AddLanguageFormProps {
  onAddLanguage: (name: string) => Promise<void>;
}

const AddLanguageForm: React.FC<AddLanguageFormProps> = ({ onAddLanguage }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLangName, setNewLangName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangName.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      await onAddLanguage(newLangName.trim());
      setNewLangName('');
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add language.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewLangName('');
    setError(null);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full h-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
      >
        <PlusIcon className="w-8 h-8 mb-2" />
        <span className="font-semibold">Add New Language</span>
      </button>
    );
  }

  return (
    <Card className="p-4 bg-gray-100 dark:bg-gray-700/50">
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <h4 className="font-bold text-center text-gray-800 dark:text-gray-100">Add a Language</h4>
        <input
          type="text"
          value={newLangName}
          onChange={(e) => setNewLangName(e.target.value)}
          placeholder="e.g., Japanese"
          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          autoFocus
          disabled={isGenerating}
        />
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div className="flex gap-2 justify-center">
          <Button type="button" size="sm" variant="secondary" onClick={handleCancel} disabled={isGenerating}>
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="primary" disabled={!newLangName.trim() || isGenerating}>
            {isGenerating ? <><Spinner className="w-4 h-4 mr-1" /> Adding...</> : 'Add'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddLanguageForm;
