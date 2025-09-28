import React from 'react';

const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 ${className}`}>
      <path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15ZM22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5ZM8.25 12a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V12.75a.75.75 0 0 1 .75-.75Zm7.5 0a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V12.75a.75.75 0 0 1 .75-.75ZM12 11.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V12a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

export default TrophyIcon;
