import React from 'react';
import FireIcon from '../icons/FireIcon';

interface StreakCounterProps {
  streak: number;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => {
  if (streak === 0) {
    return null; // Don't show the counter if there's no streak
  }
  
  return (
    <div 
        className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 font-bold px-3 py-1.5 rounded-full"
        title={`${streak}-day learning streak! Keep it going!`}
    >
      <span className="text-lg">{streak}</span>
      <FireIcon className="w-5 h-5" />
    </div>
  );
};

export default StreakCounter;
