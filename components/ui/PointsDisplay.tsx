import React from 'react';
import StarIcon from '../icons/StarIcon';

interface PointsDisplayProps {
  points: number;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ points }) => {
  return (
    <div 
        className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300 font-bold px-3 py-1.5 rounded-full"
        title={`${points} total points earned`}
    >
      <span className="text-lg">{points}</span>
      <StarIcon className="w-5 h-5" />
    </div>
  );
};

export default PointsDisplay;
