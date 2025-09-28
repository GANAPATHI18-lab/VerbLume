import React from 'react';

const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-6 w-6 ${className}`}
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M9 7v-2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="12" x2="14" y2="12" />
    <path d="M7 16l-2 -2" />
    <path d="M17 16l2 -2" />
  </svg>
);

export default RobotIcon;
