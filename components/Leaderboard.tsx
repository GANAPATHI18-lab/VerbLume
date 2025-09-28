import React, { useMemo } from 'react';
import XIcon from './icons/XIcon';
import TrophyIcon from './icons/TrophyIcon';
import StarIcon from './icons/StarIcon';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
}

// FIX: Define a user type to ensure `isUser` is an optional property, resolving type errors.
interface LeaderboardUser {
    name: string;
    points: number;
    isUser?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, userPoints }) => {
  const leaderboardData = useMemo(() => {
    // Generate mock data for demonstration
    const mockUsers: LeaderboardUser[] = [
        { name: 'Aarav Sharma', points: 12500 },
        { name: 'Saanvi Gupta', points: 11800 },
        { name: 'Vivaan Reddy', points: 11250 },
        { name: 'Diya Patel', points: 10900 },
        { name: 'Arjun Kumar', points: 9800 },
        { name: 'Ananya Singh', points: 8500 },
        { name: 'Ishaan Joshi', points: 7600 },
        { name: 'Myra Das', points: 6400 },
        { name: 'Advik Nair', points: 5200 },
    ];
    
    const userEntry: LeaderboardUser = { name: 'You', points: userPoints, isUser: true };
    
    // Combine, sort, and add rank
    return [...mockUsers, userEntry]
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({ ...user, rank: index + 1 }));
  }, [userPoints]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-fade-in-down flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <TrophyIcon className="text-yellow-500" />
            Leaderboard
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
            <XIcon className="w-5 h-5"/>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {leaderboardData.map(user => (
            <div
              key={user.rank}
              className={`flex items-center p-3 rounded-lg ${user.isUser ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500' : 'bg-gray-50 dark:bg-gray-700/50'}`}
            >
              <span className="font-bold text-lg w-8 text-center text-gray-500 dark:text-gray-400">
                {user.rank}
              </span>
              <span className={`font-semibold ml-4 flex-1 ${user.isUser ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'}`}>
                {user.name}
              </span>
              <div className="flex items-center gap-1 font-bold text-yellow-600 dark:text-yellow-400">
                <span>{user.points.toLocaleString()}</span>
                <StarIcon className="w-4 h-4" />
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default Leaderboard;
