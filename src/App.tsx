import React, { useState, useEffect } from "react";
import { Message, Module } from "./types"; // Agent removed
import { modules } from "./data/modules";
import { generateMockResponse } from "./data/mockResponses";
import ModuleSelector from "./components/ModuleSelector";
import HistoryList from "./components/HistoryList"; // Import HistoryList
// AgentSelector import removed
import ConfigInterface from "./components/ConfigInterface";
import ChatInterface from "./components/ChatInterface";
import LoginPage from "./components/LoginPage";
import LoadingSpinner from "./components/LoadingSpinner";
import { Brain, Zap, LogOut } from "lucide-react";
import { onAuthChange, logOut } from "./services/auth.service";
import { User } from "firebase/auth";
import InterviewSchedulerDashboard from "./components/InterviewSchedulerDashboard";
import StarRating from "./components/StarRating";
import StatusSelector from "./components/StatusSelector";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config/firebase";
import MultiSelectDropdown from "./components/MultiSelect";

function App() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  // selectedAgent state removed
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "feedback" | "config">(
    "dashboard"
  );

  const [status, setStatus] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]); // State for candidates, if needed

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);

      if (selectedModule === null) {
        handleSelectHistory("interview-scheduler");
      }
    });

    return () => unsubscribe();
  }, []);

  // When module changes, reset tab to dashboard if interview-scheduler
  useEffect(() => {
    if (selectedModule?.id === "interview-scheduler") {
      setActiveTab("dashboard");
    }
  }, [selectedModule]);

  // If you want to fetch all users, use a separate state variable
  // const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "resumes"));
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched users:", usersData);
      setUsers(usersData); // Uncomment if you want to use users elsewhere
      // Do not call setUser here, as setUser expects a single User or null
    };

    fetchData();
  }, []);

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
  };

  const handleSelectModule = (module: Module) => {
    setSelectedModule(module);
    // setSelectedAgent(null) removed;
    const storageKey = `chatHistory_${module.id}`;
    const storedMessages = localStorage.getItem(storageKey);
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages) as Message[];
        // Convert timestamp strings back to Date objects
        const messagesWithDateObjects = parsedMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDateObjects);
      } catch (error) {
        console.error("Failed to parse messages from localStorage:", error);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  };

  // handleSelectAgent function removed

  // handleBackToModules function removed

  const handleSelectHistory = (moduleId: string) => {
    const moduleToSelect = modules.find((m) => m.id === moduleId);
    if (moduleToSelect) {
      handleSelectModule(moduleToSelect); // This will also load messages
    } else {
      console.warn(
        `Module with ID ${moduleId} not found from history selection.`
      );
      // Optionally, clear selection or show an error
      // setSelectedModule(null);
      // setMessages([]);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!selectedModule) return; // Changed from selectedAgent to selectedModule

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    // Save user message to localStorage
    if (selectedModule) {
      const storageKey = `chatHistory_${selectedModule.id}`;
      const currentMessagesRaw = localStorage.getItem(storageKey);
      const currentMessages: Message[] = currentMessagesRaw
        ? JSON.parse(currentMessagesRaw)
        : [];
      localStorage.setItem(
        storageKey,
        JSON.stringify([...currentMessages, userMessage])
      );
    }

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const agentResponse = generateMockResponse(
        selectedModule ? selectedModule.id : "general",
        content
      ); // Changed from selectedAgent.id

      // Save agent response to localStorage
      if (selectedModule) {
        const storageKey = `chatHistory_${selectedModule.id}`;
        const currentMessagesRaw = localStorage.getItem(storageKey);
        // Ensure user message was saved, then add agent response
        const currentMessages: Message[] = currentMessagesRaw
          ? JSON.parse(currentMessagesRaw)
          : [userMessage];
        localStorage.setItem(
          storageKey,
          JSON.stringify([...currentMessages, agentResponse])
        );
      }

      setMessages((prev) => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "dashboard"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                  }`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  Dashboard
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "chat"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                  }`}
                  onClick={() => setActiveTab("chat")}
                >
                  Chat
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "feedback"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                  }`}
                  onClick={() => setActiveTab("feedback")}
                >
                  Feedback
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "config"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                }`}
                onClick={() => setActiveTab("config")}
              >
                Configrations
                </button>
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
        <div className="flex h-[calc(80vh)] gap-8">
          {/* Sidebar */}
          {selectedModule?.id === "interview-scheduler" &&
          activeTab === "chat" ? (
            <div className="w-1/4">
              {selectedModule ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full flex flex-col">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {selectedModule.name}
                  </h2>
                  <div className="flex-grow overflow-y-auto mb-4">
                    <HistoryList
                      onSelectHistory={handleSelectHistory}
                      modules={modules}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full flex flex-col space-y-4 overflow-y-auto">
                  <ModuleSelector
                    modules={modules}
                    selectedModule={selectedModule}
                    onSelectModule={handleSelectModule}
                  />
                  <HistoryList
                    onSelectHistory={handleSelectHistory}
                    modules={modules}
                  />
                </div>
              )}
            </div>
          ) : null}
          {/* Chat Interface Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full overflow-hidden">
              {selectedModule?.id === "interview-scheduler" ? (
                activeTab === "dashboard" ? (
                  <InterviewSchedulerDashboard
                    stats={{
                      totalScheduled: 12,
                      pendingCandidates: 3,
                      upcomingInterviews: 5,
                      rescheduleRequests: 1,
                    }}
                    managers={[
                      { id: "m1", name: "Alice", available: true },
                      { id: "m2", name: "Bob", available: false },
                    ]}
                    candidates={[
                      {
                        id: "c1",
                        name: "John Doe",
                        status: "pending",
                        interviewTime: "2025-06-14 10:00",
                      },
                      // ...more candidates
                    ]}
                    onReschedule={(id) => alert("Reschedule " + id)}
                    onSendReminder={(id) => alert("Send reminder to " + id)}
                  />
                ) : activeTab === "chat" ? (
                  <ChatInterface
                    messages={messages}
                    selectedAgent={null}
                    selectedModule={selectedModule}
                    onSendMessage={handleSendMessage}
                    isTyping={isTyping}
                  />
                ) : activeTab === "config" ? (
                  <ConfigInterface/>
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
