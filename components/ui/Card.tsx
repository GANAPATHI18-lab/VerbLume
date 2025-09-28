
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      {...props}
      className={`
        bg-white dark:bg-gray-800 
        rounded-xl shadow-md 
        hover:shadow-xl hover:-translate-y-1 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
        transition-all duration-300 ease-in-out 
        cursor-pointer
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
