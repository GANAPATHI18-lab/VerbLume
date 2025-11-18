
import React from 'react';

const WifiIcon: React.FC<{ className?: string; offline?: boolean }> = ({ className, offline }) => {
    if (offline) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${className}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.5 10.5a5.99 5.99 0 00-2.121 2.121m2.121-2.121L8 8m2.5 2.5l3 3m0 0a5.988 5.988 0 002.121-2.121M13.5 13.5L16 16m-2.5-2.5L11 11m2.5 2.5l1.5-1.5m-4-3.5l-2-2m6 5.5l2.5-2.5M12 18a2.25 2.25 0 00-2.25-2.25m0 0l-2.5-2.5m2.5 2.5h4.5" />
            </svg>
        )
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-5 w-5 ${className}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5A2.25 2.25 0 1110.5 8.25a2.25 2.25 0 01-2.25 2.25zM15.75 10.5a2.25 2.25 0 112.25-2.25 2.25 2.25 0 01-2.25 2.25zM12 15.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    );
};

export default WifiIcon;
