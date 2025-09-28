import React from 'react';

const FireIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 ${className}`}>
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071 1.052A9.75 9.75 0 0110.302 6a.75.75 0 00-1.064 1.063 12 12 0 00-2.83 8.25.75.75 0 001.5.042 10.5 10.5 0 012.396-7.382.75.75 0 00.17-.616A11.249 11.249 0 0112 2.25c.532 0 1.046.056 1.55.162a.75.75 0 00.413-1.476 12.723 12.723 0 00-1.55-.162zM21.75 12c0 .265-.106.52-.293.707a.75.75 0 00-1.06 1.06 9.754 9.754 0 01-2.023 2.146.75.75 0 00.94 1.166A11.25 11.25 0 0021.75 12z" clipRule="evenodd" />
    </svg>
);

export default FireIcon;
