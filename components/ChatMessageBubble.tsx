import React from 'react';
import type { ChatMessage } from '../types';
import UserIcon from './icons/UserIcon';
import RobotIcon from './icons/RobotIcon';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isTyping = false }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <RobotIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
      )}

      <div className={`max-w-md md:max-w-lg ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`px-4 py-2 rounded-2xl ${isUser ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-lg'}`}>
          {isTyping ? (
            <div className="flex items-center gap-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>

        {message.feedback && message.feedback.hasError && !isTyping && (
          <div className="mt-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50 text-xs">
            <p className="font-bold text-yellow-800 dark:text-yellow-300">💡 Feedback:</p>
            <p className="mt-1 text-yellow-700 dark:text-yellow-400"><span className="font-semibold">Corrected:</span> <em className="text-yellow-800 dark:text-yellow-200">{message.feedback.correctedSentence}</em></p>
            <p className="mt-1 text-yellow-700 dark:text-yellow-400"><span className="font-semibold">Explanation:</span> {message.feedback.explanation}</p>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center order-2">
          <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;