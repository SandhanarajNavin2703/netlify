import React, { useState, useEffect, useCallback } from "react";
import { Message, Module, ChatSession } from "./types";
import { modules } from "./data/modules";
import ModuleSelector from "./components/ModuleSelector";
import HistoryList from "./components/HistoryList";
import { createNewChat, getChatHistory, deleteChat, addMessageToChat, updateChatTitle } from "./services/chat.service";
// AgentSelector import removed
import ConfigInterface from "./components/ConfigInterface";
import ChatInterface from "./components/ChatInterface";
import LoginPage from "./components/LoginPage";
import LoadingSpinner from "./components/LoadingSpinner";
import { Brain, Zap, LogOut } from "lucide-react";
import { onAuthChange, logOut } from "./services/auth.service";
import { User } from "firebase/auth";
import InterviewSchedulerDashboard from "./components/InterviewSchedulerDashboard";
import EmpDashboard from "./components/empDashboard";

interface UserData {
  email: string;
  role: string;
}
import StarRating from "./components/StarRating";
import StatusSelector from "./components/StatusSelector";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config/firebase";
import { sendChatMessage } from "./services/chat.service";
import MultiSelectDropdown from "./components/MultiSelect";
import { query, where, DocumentData } from 'firebase/firestore';

function App() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "feedback" | "config">(JSON.parse(localStorage.getItem('activeTab') || '"dashboard"'));
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]); // State for candidates, if needed
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Fetch user role from users collection
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data() as UserData;
            setUserRole(userData.role);
            sessionStorage.setItem('userRole', userData.role);
            console.log('User Role:', userData.role);
          } else {
            console.log('No user data found for email:', user.email);
            setUserRole(null);
            sessionStorage.removeItem('userRole');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        }

        // Load chat history from firebase
        getChatHistory().then(sessions => {
          setChatSessions(sessions);
          const localHistory = localStorage.getItem('chatSessions');
          if (localHistory) {
            try {
              const localSessions = JSON.parse(localHistory);
              // Merge Firebase and local sessions, preferring Firebase data
              const mergedSessions = [...sessions];
              localSessions.forEach((localSession: ChatSession) => {
                if (!sessions.find(s => s.id === localSession.id)) {
                  mergedSessions.push(localSession);
                }
              });
              setChatSessions(mergedSessions);
            } catch (error) {
              console.error('Failed to parse local chat sessions:', error);
            }
          }
        }).catch(error => {
          console.error('Error loading chat history:', error);
          // Fall back to local storage
          const localHistory = localStorage.getItem('chatSessions');
          if (localHistory) {
            try {
              setChatSessions(JSON.parse(localHistory));
            } catch (error) {
              console.error('Failed to parse local chat sessions:', error);
            }
          }
        });
      }

      if (selectedModule === null) {
        handleSelectHistory("interview-scheduler");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Load chat sessions from localStorage on initial load   
    console.log("Loading chat sessions from localStorage");
    console.log(messages, selectedModule);

  }, [messages, selectedModule]);

  // Fetch candidates data from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchCandidatesData = async () => {
      try {
        // Get candidates data from Firestore
        const candidatesSnapshot = await getDocs(collection(db, "candidates_data"));
        const candidatesData = candidatesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            job_id: data.job_id,
            email: data.email,
            phone_no: data.phone_no,
            resume_url: data.resume_url,
            total_experience_in_years: data.total_experience_in_years,
            technical_skills: data.technical_skills,
            previous_companies: data.previous_companies || [],
            ai_fit_score: data.ai_fit_score,
            completed_rounds: data.completed_rounds,
            no_of_interviews: data.no_of_interviews,
            interview_status: data.status || 'pending',
            feedback: data.feedback || [],
            interview_time: data.feedback?.[0]?.scheduled_event?.start?.dateTime ?
              Timestamp.fromMillis(new Date(data.feedback[0].scheduled_event.start.dateTime).getTime()) :
              undefined
          };
        });

        console.log("Fetched candidates:", candidatesData);
        setUsers(candidatesData);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchCandidatesData();
  }, [user]);

 useEffect(() => {
    localStorage.setItem('activeTab', JSON.stringify(activeTab));
  }, [activeTab]);

  // handleLogout function removed

  const handleLogout = async () => {
    try {
      await logOut();
      setSelectedModule(null);
      // setSelectedAgent(null) removed;
      setMessages([]);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }; const handleSelectModule = async (module: Module) => {
    setSelectedModule(module);

    // Create a new chat session for this module
    if (user) {
      try {
        const newChat = await createNewChat(module.id, user.uid);
        const updatedSessions = [newChat, ...chatSessions];
        setChatSessions(updatedSessions);
        setCurrentChatId(newChat.id);
        setMessages([]);

        // Cache in localStorage
        const localStorageChat = {
          ...newChat,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        const localStorageSessions = [localStorageChat, ...chatSessions];
        localStorage.setItem('chatSessions', JSON.stringify(localStorageSessions));
      } catch (error) {
        console.error('Failed to create new chat:', error);
        // Fall back to local state only
        const newChat: ChatSession = {
          id: Date.now().toString(),
          moduleId: module.id,
          userId: user.uid,
          title: 'New Chat',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          messages: []
        };
        const updatedSessions = [newChat, ...chatSessions];
        setChatSessions(updatedSessions);
        setCurrentChatId(newChat.id);
        setMessages([]);
        localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
      }
    }
  };

  const handleSelectChat = (chatId: string) => {
    console.log(chatSessions, chatId);

    const chat = chatSessions.find(c => c.id === chatId);
    console.log("Selected chat:", chat);

    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      const module = modules.find(m => m.id === chat.moduleId);
      if (module) setSelectedModule(module);
    }
  };

  const handleNewChat = async () => {
    if (!selectedModule || !user) return;

    try {
      const newChat = await createNewChat(selectedModule.id, user.uid);
      const updatedSessions = [newChat, ...chatSessions];
      setChatSessions(updatedSessions);
      setCurrentChatId(newChat.id);
      setMessages([]);

      // Cache in localStorage
      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleSelectHistory = (moduleId: string) => {
    const moduleToSelect = modules.find((m) => m.id === moduleId);
    if (moduleToSelect) {
      setSelectedModule(moduleToSelect);
      // Try to find existing chat for this module
      const existingChat = chatSessions.find(c => c.moduleId === moduleId);
      if (existingChat) {
        setCurrentChatId(existingChat.id);
        setMessages(existingChat.messages);
      } else {
        handleSelectModule(moduleToSelect);
      }
    } else {
      console.warn(`Module with ID ${moduleId} not found from history selection.`);
    }
  }; const handleSendMessage = async (content: string) => {
    if (!user || !currentChatId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    // Update local state immediately for responsiveness
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Optimistically update chat sessions
      const updatedSessions = chatSessions.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      );
      setChatSessions(updatedSessions);

      // Save user message to Firebase
      await addMessageToChat(currentChatId, userMessage);
      console.log(currentChatId, "==================");

      // Send message to API and get response
      const response = await sendChatMessage(content, currentChatId);

      // Create agent message
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'agent',
        timestamp: new Date(),
        type: 'text'
      };

      // Save agent message to Firebase
      await addMessageToChat(currentChatId, agentMessage);

      // Update local state with agent message
      setMessages(prev => [...prev, agentMessage]);

      // Update chat sessions with both messages
      const finalSessions = chatSessions.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, userMessage, agentMessage] }
          : chat
      );
      setChatSessions(finalSessions);

      // Cache in localStorage
      localStorage.setItem('chatSessions', JSON.stringify(finalSessions));

      // Update chat title if it's the first message
      const chat = chatSessions.find(c => c.id === currentChatId);
      if (chat?.messages.length === 0) {
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        await updateChatTitle(currentChatId, title);
        setChatSessions(prev => prev.map(c =>
          c.id === currentChatId ? { ...c, title } : c
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getTotalAgents = () => {
    return modules.reduce((total, module) => total + module.agents.length, 0);
  };

  const handleRatingChange = (rating: number) => {
    setRating(rating);
    console.log("Selected rating:", rating);
  };

  const handleStatus = (status: string) => {
    console.log("Selected status:", status);
    setStatus(status);
  };

  const handleComment = (comment: string) => {
    setComment(comment);
    console.log("User comment:", comment);
  };

  const handleSubmitFeedback = async () => {
    if (candidates.length === 0) {
      alert("Please select at least one candidate.");
      return;
    }

    const newFeedback = {
      rating: rating,
      selected: status.toLowerCase() === "selected",
      round: 1, // You can make this dynamic
      interviewer: "Dinesh", // Replace with actual user
      comments: comment,
    };

    console.log("📋 Submitting feedback to resumes:", candidates);
    console.log("📝 Feedback content:", newFeedback);

    try {
      const updatePromises = candidates.map((resumeId) => {
        const resumeRef = doc(db, "resumes", resumeId);
        return updateDoc(resumeRef, {
          feedback: arrayUnion(newFeedback),
        });
      });

      await Promise.all(updatePromises);

      console.log("✅ Feedback added to all selected resumes.");
      alert("Feedback submitted to all selected candidates!");
    } catch (error) {
      console.error("❌ Error submitting feedback:", error);
      alert("Something went wrong while submitting feedback.");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      // Delete from Firebase
      await deleteChat(chatId);

      // Update local state
      setChatSessions(prev => prev.filter(chat => chat.id !== chatId));

      // If current chat was deleted, clear messages and current chat
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }

      // Update localStorage
      localStorage.setItem('chatSessions', JSON.stringify(
        chatSessions.filter(chat => chat.id !== chatId)
      ));
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Still remove from local state even if Firebase delete fails
      setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
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
                  Interview Scheduling Platform
                </p>
              </div>
            </div>
            {/* Tabs for Interview Scheduler */}
            {selectedModule?.id === "interview-scheduler" && (
              <div className="flex items-center gap-2">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "dashboard"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                    }`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  Dashboard
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "chat"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                    }`}
                  onClick={() => setActiveTab("chat")}
                >
                  Agent
                </button>
                {/* <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "feedback"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                    }`}
                  onClick={() => setActiveTab("feedback")}
                >
                  Feedback
                </button> */}
                {userRole === 'admin' && (
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "config"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                    }`}
                  onClick={() => setActiveTab("config")}
                >
                  Settings
                </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-4">
              {/* <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>{getTotalAgents()} Agents Active</span>
              </div> */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src={user.photoURL || undefined}
                    alt={user.displayName || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {user.displayName}
                  </span>
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
        <div className="flex min-h-[calc(80vh)] gap-8">
          {/* Sidebar */}
          {selectedModule?.id === "interview-scheduler" &&
            activeTab === "chat" ? (
            <div className="w-1/4">
              {selectedModule ? (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full flex flex-col">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {selectedModule.name}
                </h2>
                <div className="flex-grow overflow-y-auto mb-4" style={{ maxHeight: 'calc(85vh)' }}>
                  <HistoryList
                    modules={modules}
                    chatSessions={chatSessions}
                    currentChatId={currentChatId}
                    onSelectChat={handleSelectChat}
                    onNewChat={handleNewChat}
                    onDeleteChat={handleDeleteChat}
                  />
                </div>
              </div>
              ) : (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full flex flex-col space-y-4 overflow-y-auto">
                <ModuleSelector
                  modules={modules}
                  selectedModule={selectedModule}
                  onSelectModule={handleSelectModule}
                />
                <HistoryList
                  modules={modules}
                  chatSessions={chatSessions}
                  currentChatId={currentChatId}
                  onSelectChat={handleSelectChat}
                  onNewChat={handleNewChat}
                  onDeleteChat={handleDeleteChat}
                />
              </div>
              )}
            </div>
          ) : null}
          {/* Chat Interface Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full overflow-hidden">
              {selectedModule?.id === "interview-scheduler" ? (activeTab === "dashboard" ? (
               userRole === 'admin' ? (
                  <InterviewSchedulerDashboard
                    stats={{
                      totalScheduled: users.filter(c => c.interview_status === 'scheduled').length,
                      pendingCandidates: users.filter(c => c.interview_status === 'pending').length,
                      upcomingInterviews: users.filter(c =>
                        c.interview_status === 'scheduled' &&
                        c.interview_time &&
                        new Date(c.interview_time.seconds * 1000) > new Date()
                      ).length,
                      rescheduleRequests: users.filter(c => c.interview_status === 'rescheduled').length,
                    }}
                    candidates={users}
                    onReschedule={(id) => alert("Reschedule " + id)}
                    onSendReminder={(id) => alert("Send reminder to " + id)}
                  />
                ) : (
                  <EmpDashboard
                    stats={{
                      totalScheduled: users.filter(c => c.interview_status === 'scheduled').length,
                      pendingCandidates: users.filter(c => c.interview_status === 'pending').length,
                      upcomingInterviews: users.filter(c =>
                        c.interview_status === 'scheduled' &&
                        c.interview_time &&
                        new Date(c.interview_time.seconds * 1000) > new Date()
                      ).length,
                      rescheduleRequests: users.filter(c => c.interview_status === 'rescheduled').length,
                    }}
                    candidates={users}
                    onReschedule={(id) => alert("Reschedule " + id)}
                    onSendReminder={(id) => alert("Send reminder to " + id)}
                  />)) : activeTab === "chat" ? (
                  <ChatInterface
                    messages={messages}
                    selectedAgent={null}
                    selectedModule={selectedModule}
                    onSendMessage={handleSendMessage}
                    isTyping={isTyping}
                    disabled={!currentChatId}
                  />
                ) : activeTab === "config" ? (
                  <ConfigInterface />
                ) : (
                <>
                  <div className="p-6">
                    <div className="p-6 max-w-md mx-auto">
                      <MultiSelectDropdown
                        options={users}
                        placeholder="Select candidate(s)"
                        label="Interview Panel"
                        onChange={(selectedIds) => {
                          console.log(
                            "Selected IDs to save in DB:",
                            selectedIds
                          );
                          setCandidates(selectedIds); // ✅ works now
                        }}
                      />
                      <br />
                      <StatusSelector
                        label="Selection Status"
                        options={["Selected", "Not Selected"]}
                        onStatusChange={handleStatus}
                        onCommentChange={handleComment}
                      />
                      <div className="block mt-3 text-sm font-medium text-gray-700">
                        <StarRating
                          label="Candidate Rating"
                          onChange={handleRatingChange}
                        />
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleSubmitFeedback()}
                          className="w-full max-w-[200px] px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )
              ) : (
                <ChatInterface
                  messages={messages}
                  selectedAgent={null}
                  selectedModule={selectedModule}
                  onSendMessage={handleSendMessage}
                  isTyping={isTyping}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Footer ... */}
    </div>
  );
}

export default App;
