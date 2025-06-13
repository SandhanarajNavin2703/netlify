import React, { useEffect, useRef } from 'react';
import { Message, Agent, Module } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Bot, Sparkles, UserPlus, Calendar } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  selectedAgent: Agent | null;
  selectedModule: Module | null;
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  selectedAgent,
  selectedModule,
  onSendMessage,
  isTyping = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getModuleIcon = () => {
    if (selectedModule?.id === 'onboarding') return UserPlus;
    if (selectedModule?.id === 'interview-scheduler') return Calendar;
    return Bot;
  };

  const ModuleIcon = getModuleIcon();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            selectedModule ? selectedModule.color : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          }`}>
            <ModuleIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {selectedAgent ? selectedAgent.name : selectedModule ? selectedModule.name : 'AI Assistant'}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedAgent 
                ? selectedAgent.description 
                : selectedModule 
                  ? 'Select an agent to start chatting'
                  : 'Select a module to begin'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`p-4 rounded-full mb-4 ${
              selectedModule ? selectedModule.color : 'bg-gradient-to-br from-blue-100 to-indigo-100'
            }`}>
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {selectedAgent 
                ? `Chat with ${selectedAgent.name}` 
                : selectedModule
                  ? `Welcome to ${selectedModule.name}`
                  : 'Welcome to AI Assistant Hub'
              }
            </h3>
            <p className="text-gray-600 max-w-md mb-6">
              {selectedAgent 
                ? `I'm here to help you with ${selectedAgent.capabilities.slice(0, 3).join(', ')}. Ask me anything!`
                : selectedModule
                  ? selectedModule.description
                  : 'Select a module from the sidebar to start a conversation.'
              }
            </p>
            {selectedAgent && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm max-w-lg">
                <h4 className="font-medium text-gray-800 mb-3">I can help you with:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((capability) => (
                    <span 
                      key={capability}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedModule && !selectedAgent && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm max-w-lg">
                <h4 className="font-medium text-gray-800 mb-3">Available Agents:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedModule.agents.map((agent) => (
                    <div 
                      key={agent.id}
                      className="p-2 bg-gray-50 rounded-lg text-center"
                    >
                      <div className={`w-8 h-8 ${agent.color} rounded-lg mx-auto mb-1 flex items-center justify-center`}>
                        <span className="text-white text-xs">AI</span>
                      </div>
                      <span className="text-xs text-gray-600">{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex gap-3 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md border border-gray-200 p-4 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput 
        onSendMessage={onSendMessage}
        disabled={!selectedAgent}
        placeholder={
          selectedAgent 
            ? `Message ${selectedAgent.name}...` 
            : selectedModule
              ? 'Select an agent to start chatting...'
              : 'Select a module to begin...'
        }
      />
    </div>
  );
};

export default ChatInterface;