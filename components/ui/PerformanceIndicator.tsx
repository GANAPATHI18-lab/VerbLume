import React from 'react';

interface PerformanceIndicatorProps {
  score: number | null | undefined;
  size?: 'sm' | 'lg';
}

const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ score, size = 'sm' }) => {
  if (score === null || score === undefined) {
    return null; // Don't show anything if not attempted
  }

  const percentage = Math.round(score * 100);

  const sizeStyles = {
    sm: {
      svgSize: 28,
      strokeWidth: 3.5,
      fontSize: '10px',
    },
    lg: {
      svgSize: 80,
      strokeWidth: 8,
      fontSize: '1.25rem', // 20px
    },
  };

  const { svgSize, strokeWidth, fontSize } = sizeStyles[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;

  const getColor = () => {
    if (percentage < 40) return 'text-red-500';
    if (percentage < 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="flex-shrink-0" title={`Average Score: ${percentage}%`}>
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg className="transform -rotate-90" width={svgSize} height={svgSize}>
          <circle
            className="text-gray-200 dark:text-gray-600"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={svgSize / 2}
            cy={svgSize / 2}
          />
          <circle
            className={`transition-all duration-500 ease-in-out ${getColor()}`}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={svgSize / 2}
            cy={svgSize / 2}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300" style={{ fontSize: fontSize }}>
          {percentage}<span style={{ fontSize: `calc(${fontSize} * 0.6)`}}>%</span>
        </span>
      </div>
    </div>
  );
};

export default PerformanceIndicator;