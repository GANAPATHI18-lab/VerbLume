
import React, { useState } from 'react';
import Button from './ui/Button';
import PlusIcon from './icons/PlusIcon';

interface AddCategoryFormProps {
  onAddCategory: (name: string, icon: string) => Promise<void>;
}

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ onAddCategory }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && icon.trim() && !isGenerating) {
      setIsGenerating(true);
      try {
        await onAddCategory(name.trim(), icon.trim());
        setName('');
        setIcon('');
        setIsAdding(false);
      } catch (error) {
        console.error("Failed to add category:", error);
        alert(`Could not create category: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsGenerating(false);
      }
    }
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setName('');
    setIcon('');
    setIsGenerating(false);
  };

  if (!isAdding) {
    return (
      <div className="mt-6">
        <Button variant="secondary" onClick={() => setIsAdding(true)} className="w-full sm:w-auto">
          <PlusIcon />
          Add New Main Category
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 mt-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-fade-in shadow-inner">
      <h3 className="font-bold mb-3 text-lg text-gray-800 dark:text-gray-100">Create a New Category</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Our AI will automatically generate relevant sub-topics for your new category.
      </p>
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Icon (e.g., ✨)"
              className="px-3 py-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-center w-full sm:w-1/4"
              maxLength={2}
              disabled={isGenerating}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new category name..."
              className="flex-grow px-3 py-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              autoFocus
              disabled={isGenerating}
            />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={isGenerating}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!name.trim() || !icon.trim() || isGenerating}>
            {isGenerating ? 'Generating...' : 'Save Category'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCategoryForm;