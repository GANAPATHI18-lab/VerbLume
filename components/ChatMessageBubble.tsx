
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

  const renderContent = (text: string) => {
    const parts = text.split(/```/);
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            // Code block
            return (
                <pre key={index} className="my-2 p-3 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap shadow-sm border border-gray-700">
                    <code>{part.trim()}</code>
                </pre>
            );
        }
        // Regular text
        return <p key={index} className="whitespace-pre-wrap mb-1 last:mb-0 leading-relaxed">{part}</p>;
    });
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <RobotIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
      )}

      <div className={`max-w-md md:max-w-lg ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`px-4 py-2 rounded-2xl ${isUser ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-lg'}`}>
          {isTyping ? (
            <div className="flex items-center gap-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          ) : (
             renderContent(message.text)
          )}
        </div>

        {message.feedback && !isTyping && (
          <div className={`mt-2 p-3 rounded-lg border text-xs ${message.feedback.hasError ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/50' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30'}`}>
            <p className={`font-bold ${message.feedback.hasError ? 'text-yellow-800 dark:text-yellow-300' : 'text-blue-800 dark:text-blue-300'}`}>
                {message.feedback.hasError ? '💡 Correction:' : '✨ Tip:'}
            </p>
            
            {message.feedback.hasError && (
                <p className="mt-1 text-yellow-700 dark:text-yellow-400">
                    <span className="font-semibold">Corrected:</span> <em className="text-yellow-800 dark:text-yellow-200">{message.feedback.correctedSentence}</em>
                </p>
            )}
            
            {message.feedback.explanation && (
                <p className={`mt-1 ${message.feedback.hasError ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-700 dark:text-blue-400'}`}>
                   {message.feedback.explanation}
                </p>
            )}

            {message.feedback.pronunciationTip && (
                <p className="mt-2 pt-2 border-t border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">🗣️ Pronunciation:</span> {message.feedback.pronunciationTip}
                </p>
            )}
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
