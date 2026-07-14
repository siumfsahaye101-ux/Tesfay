/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageSquareCode, Send, X, RefreshCw, MessageSquareDashed } from 'lucide-react';

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  loadingChat: boolean;
}

export default function SupportChat({
  isOpen,
  onClose,
  chatHistory,
  onSendMessage,
  loadingChat,
}: SupportChatProps) {
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const text = chatInput.trim();
    setChatInput('');
    await onSendMessage(text);
  };

  const sampleQuestions = [
    "What is my latest transfer status?",
    "Why does my transfer have an AML hold?",
    "How can I load more USD sandbox funds?",
    "What are the fees for sending to India?"
  ];

  if (!isOpen) return null;

  return (
    <div id="ai-chat-panel" className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200/90 shadow-2xl z-45 flex flex-col justify-between select-none animate-slide-in">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
            <MessageSquareCode className="w-5 h-5 fill-slate-950/20" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight">AI Remittance Copilot</h4>
            <p className="text-[9px] font-mono text-emerald-400 font-semibold uppercase">✓ RemitGuard Helper</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {chatHistory.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <MessageSquareDashed className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-700">Chat with RemitGuard AI</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-0.5 leading-normal">
                Ask about transaction tracking, sanction flags, exchange correlations, or limits setup!
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-slate-900 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
                <span className="text-[8px] font-mono text-slate-400 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {loadingChat && (
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] italic py-1 pl-1">
            <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
            AI is consulting transaction logs...
          </div>
        )}
      </div>

      {/* Quick sample prompt buttons */}
      <div className="px-3 pb-2 pt-1 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5">
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(q)}
            className="text-[9.5px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-md transition-all truncate max-w-full"
            title={q}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask something..."
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
          disabled={loadingChat}
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || loadingChat}
          className="p-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg transition-colors shrink-0"
        >
          <Send className="w-4 h-4 text-emerald-400" />
        </button>
      </form>

    </div>
  );
}
