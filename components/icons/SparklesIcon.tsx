import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-7 w-7 ${className}`}>
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.435A9.75 9.75 0 015.25 22.5a.75.75 0 01-.75-.75c0-5.056 2.383-9.555 6.084-12.435a9.75 9.75 0 01-2.269-4.731z" clipRule="evenodd" />
    </svg>
);

export default SparklesIcon;
