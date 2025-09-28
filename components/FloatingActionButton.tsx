import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-110"
      aria-label="Open AI Co-Developer"
      title="Open AI Co-Developer"
    >
      {children}
    </button>
  );
};

export default FloatingActionButton;
