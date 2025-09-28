
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
}

const CoDeveloperPanel: React.FC<CoDeveloperPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-codev',
      sender: 'ai',
      text: "Hello! I'm your AI Co-Developer. Ask me to add a feature, change a style, or ask any question about this app. For example, try asking me to 'change the header gradient to be purple and pink'."
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

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      const responseText = await generateCoDeveloperResponse(trimmedInput);
      const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = { id: `err-${Date.now()}`, sender: 'ai', text: `Sorry, I ran into an error: ${err.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
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

        {/* Input Form */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Make the buttons rounder"
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