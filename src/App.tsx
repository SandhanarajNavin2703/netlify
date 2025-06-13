import React, { useState, useEffect } from 'react';
import { Agent, Message, Module } from './types';
import { modules } from './data/modules';
import { generateMockResponse } from './data/mockResponses';
import ModuleSelector from './components/ModuleSelector';
import AgentSelector from './components/AgentSelector';
import ChatInterface from './components/ChatInterface';
import LoginPage from './components/LoginPage';
import LoadingSpinner from './components/LoadingSpinner';
import { Brain, Zap, LogOut } from 'lucide-react';
import { onAuthChange, logOut } from './services/auth.service';
import { User } from 'firebase/auth';

function App() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Clear messages when switching agents
    setMessages([]);
  }, [selectedAgent]);

  const handleLogout = async () => {
    try {
      await logOut();
      setSelectedModule(null);
      setSelectedAgent(null);
      setMessages([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSelectModule = (module: Module) => {
    setSelectedModule(module);
    setSelectedAgent(null);
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setSelectedAgent(null);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedAgent) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const agentResponse = generateMockResponse(selectedAgent.id, content);
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const getTotalAgents = () => {
    return modules.reduce((total, module) => total + module.agents.length, 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Assistant Hub
                </h1>
                <p className="text-sm text-gray-600">
                  HR Onboarding & Interview Scheduling Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>{getTotalAgents()} Agents Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={user.photoURL || undefined}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(80vh)]">
          {/* Module/Agent Selector */}
          <div className="lg:col-span-1 set-height">
            {!selectedModule ? (
              <ModuleSelector
                modules={modules}
                selectedModule={selectedModule}
                onSelectModule={handleSelectModule}
              />
            ) : (
              <AgentSelector
                agents={selectedModule.agents}
                selectedAgent={selectedAgent}
                onSelectAgent={handleSelectAgent}
                onBack={handleBackToModules}
                moduleName={selectedModule.name}
              />
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3 set-height">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full overflow-hidden">
              <ChatInterface
                messages={messages}
                selectedAgent={selectedAgent}
                selectedModule={selectedModule}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2024 AI Assistant Hub. Powered by Gemini + Vertex AI</p>
            <div className="flex gap-4">
              <button className="hover:text-gray-800 transition-colors">Privacy Policy</button>
              <button className="hover:text-gray-800 transition-colors">Terms of Service</button>
              <button className="hover:text-gray-800 transition-colors">Support</button>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
}

export default App;