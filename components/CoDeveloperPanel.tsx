
import React, { useState, FormEvent, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { generateCoDeveloperResponse } from '../services/geminiService';
import ChatMessageBubble from './ChatMessageBubble';
import XIcon from './icons/XIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import Spinner from './ui/Spinner';
import Button from './ui/Button';

interface CoDeveloperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: string;
}

const SUGGESTED_QUESTIONS = [
    "Explain this screen",
    "How does the AI work?",
    "Tech stack?",
    "Show me a button code"
];

const CoDeveloperPanel: React.FC<CoDeveloperPanelProps> = ({ isOpen, onClose, currentContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-codev',
      sender: 'ai',
      text: "Hello! I'm your AI Co-Developer. I know about the React code, Tailwind styles, and Gemini integration powering this app.\n\nHow can I help you today?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
        // Focus input when panel opens
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
      const trimmedInput = text.trim();
      if (!trimmedInput || isLoading) return;

      const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: trimmedInput };
      setMessages(prev => [...prev, userMsg]);
      setUserInput('');
      setIsLoading(true);

      try {
        const responseText = await generateCoDeveloperResponse(trimmedInput, currentContext);
        const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: responseText };
        setMessages(prev => [...prev, aiMsg]);
      } catch (err: any) {
        const errorMsg: ChatMessage = { id: `err-${Date.now()}`, sender: 'ai', text: `Sorry, I ran into an error: ${err.message}` };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(3.5rem+1.5rem)] right-6 z-40 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 transition-all duration-300 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-xl">✨</span>
                AI Co-Developer
            </h3>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                <XIcon className="w-5 h-5"/>
            </button>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)}
            {isLoading && <ChatMessageBubble message={{id: 'typing', sender: 'ai', text: '...'}} isTyping />}
        </div>
        
        {/* Quick Suggestions */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
            {SUGGESTED_QUESTIONS.map((q, i) => (
                <button 
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="whitespace-nowrap text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                    {q}
                </button>
            ))}
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ask about the app code..."
                    disabled={isLoading}
                />
                <button type="submit" className="flex-shrink-0 p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={!userInput.trim() || isLoading}>
                    {isLoading ? <Spinner className="w-5 h-5 text-white" /> : <PaperAirplaneIcon />}
                </button>
            </form>
        </div>
    </div>
  );
};

export default CoDeveloperPanel;
