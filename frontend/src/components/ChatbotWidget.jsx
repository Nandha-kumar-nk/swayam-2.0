import React, { useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const ChatbotWidget = ({ isOpen, onClose, courseId, user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Hi! I'm your AI study assistant powered by advanced language models. I can help you with course concepts, assignments, debugging, and study strategies. What would you like to learn about?",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to display
    setMessages((prev) => [...prev, userMessage]);

    // Prepare conversation history for context
    const currentHistory = [
      ...conversationHistory,
      { role: 'user', content: input.trim() }
    ];

    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post(`/forum/${courseId}/ai-chat`, {
        message: userMessage.content,
        conversationHistory: currentHistory.slice(-4) // Send last 4 messages for context
      });

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data?.data?.message || "I'm not sure about that. Could you rephrase?",
        timestamp: data?.data?.timestamp || new Date().toISOString(),
        confidence: data?.data?.confidence || 85,
        type: data?.data?.type || 'ai-response'
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userMessage.content },
        { role: 'assistant', content: assistantMessage.content }
      ]);

    } catch (err) {
      console.error('AI Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content:
            "I'm having trouble connecting to my knowledge base right now. I'll still try to help: can you add more details about what you're working on?",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="text-sm">
            <div className="font-semibold flex items-center">
              🤖 AI Study Assistant
              <span className="ml-2 px-2 py-1 bg-green-500 text-xs rounded-full">LLM Powered</span>
            </div>
            <div className="text-blue-100 text-xs">Intelligent course-aware helper</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-blue-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap relative ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {m.content}
                {m.confidence && (
                  <div className="text-xs opacity-60 mt-1">
                    Confidence: {m.confidence}%
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about concepts, assignments, debugging, or study tips..."
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white px-3 py-2 transition-all duration-200"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Powered by advanced AI • Trained on course content • Context-aware responses
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWidget;


