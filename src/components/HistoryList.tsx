import React, { useState, useEffect } from 'react';
import { ChatSession, Module } from '../types';
import { Clock, Trash2, PlusCircle } from 'lucide-react';

interface HistoryListProps {
  modules: Module[];
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat?: (chatId: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ 
  modules, 
  chatSessions, 
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat
}) => {
  if (chatSessions?.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center px-2 mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Chat History</h4>
          <button
            onClick={onNewChat}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 px-2">No chat history found.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center px-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Chat History</h4>
        <button
          onClick={onNewChat}
          className="flex gap-2 p-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <PlusCircle className="w-5 mt-1 h-5" /> New
        </button>
      </div>
      <ul className="space-y-1">
        {chatSessions?.map(chat => {
          const module = modules.find(m => m.id === chat.moduleId);
          const updatedAt = chat.updatedAt instanceof Date 
            ? chat.updatedAt 
            : new Date((chat.updatedAt as any).seconds * 1000);
            
          return (
            <li key={chat.id} className="flex items-center group relative">
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`flex-1 px-2 py-1.5 text-left transition-colors hover:bg-gray-100 rounded-lg group relative ${
                  currentChatId === chat.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 mt-2 rounded-full ${module?.color || 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.title || 'New Chat'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {updatedAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
              {onDeleteChat && (
                <button
                  onClick={() => onDeleteChat(chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default HistoryList;
