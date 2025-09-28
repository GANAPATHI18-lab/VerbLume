
import React, { useState } from 'react';
import Button from './ui/Button';
import PlusIcon from './icons/PlusIcon';

interface AddTopicFormProps {
  categoryName: string;
  onAddTopic: (categoryName: string, topicName:string) => void;
}

const AddTopicForm: React.FC<AddTopicFormProps> = ({ categoryName, onAddTopic }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTopic, setNewTopic] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopic.trim()) {
      onAddTopic(categoryName, newTopic.trim());
      setNewTopic('');
      setIsAdding(false);
    }
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setNewTopic('');
  };

  if (!isAdding) {
    return (
      <Button variant="secondary" onClick={() => setIsAdding(true)} className="w-full sm:w-auto">
        <PlusIcon />
        Add New Topic
      </Button>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-2 animate-fade-in">
      <input
        type="text"
        value={newTopic}
        onChange={(e) => setNewTopic(e.target.value)}
        placeholder="Enter new topic name..."
        className="flex-grow px-3 py-2 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!newTopic.trim()}>Save Topic</Button>
      </div>
    </form>
  );
};

export default AddTopicForm;
