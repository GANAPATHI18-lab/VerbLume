import React from 'react';
import MinusIcon from '../icons/MinusIcon';
import PlusIcon from '../icons/PlusIcon';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoomLevel, onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-full p-0.5" title="Adjust text size">
      <button
        onClick={onZoomOut}
        disabled={zoomLevel <= 70}
        className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom Out"
      >
        <MinusIcon className="w-4 h-4" />
      </button>
      <button 
        onClick={onReset}
        className="font-bold text-xs w-10 text-center text-gray-700 dark:text-gray-200 tabular-nums hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md py-1"
        title="Reset Zoom to 100%"
        aria-label={`Current zoom level: ${zoomLevel}%. Click to reset.`}
      >
        {zoomLevel}%
      </button>
      <button
        onClick={onZoomIn}
        disabled={zoomLevel >= 150}
        className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom In"
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ZoomControls;
