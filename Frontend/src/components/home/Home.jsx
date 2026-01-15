import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Plus,
  History,
  LogOut,
  Mic,
  ArrowUp,
  Copy,
  Menu,
  X,
  MoreVertical,
  MessageSquare,
} from "lucide-react";

const Home = () => {
  // --- State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for 3-dot menu
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(1);

  const navigate = useNavigate();

  const [user, setUser] = useState({
    firstName: "Guest",
    lastName: "User",
    email: "",
  });

  // --- 1. Load User from LocalStorage on mount ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Handle case sensitivity for fullName/fullname
        const fName =
          parsedUser.fullName?.firstName ||
          parsedUser.fullname?.firstName ||
          parsedUser.firstName ||
          "Guest";
        const lName =
          parsedUser.fullName?.lastName ||
          parsedUser.fullname?.lastName ||
          parsedUser.lastName ||
          "";

        setUser({
          firstName: fName,
          lastName: lName,
          email: parsedUser.email || "",
        });
      } catch (error) {
        console.error("Failed to parse user data", error);
      }
    }
  }, []);

  const getAvatarUrl = () => {
    return `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0fbda6&color=fff&bold=true`;
  };

  // --- Mock Data ---
  const [sessions, setSessions] = useState([
    {
      id: 1,
      title: "Sales Analysis Q3",
      messages: [
        {
          id: 101,
          type: "user",
          text: "Can you analyze the sales data?",
          timestamp: "10:23 AM",
        },
        {
          id: 102,
          type: "bot",
          text: "Certainly. Here is the summary of Q3 performance.",
          extra: "sales-demo",
          timestamp: "10:23 AM",
        },
      ],
    },
    {
      id: 2,
      title: "Python Script Help",
      messages: [
        {
          id: 201,
          type: "user",
          text: "I need a python script for hello world.",
          timestamp: "09:00 AM",
        },
        {
          id: 202,
          type: "bot",
          text: "Here is a Python script template you might find useful:",
          extra: "code-demo",
          timestamp: "09:00 AM",
        },
      ],
    },
  ]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : [];
  const chatEndRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isLoading]);

  // --- Handlers ---
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSwitchSession = (id) => {
    setActiveSessionId(id);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    const newId = Date.now();
    const newSession = {
      id: newId,
      title: "New Session",
      messages: [
        {
          id: Date.now(),
          type: "bot",
          text: "Hello! I am Nexus AI. How can I assist you today?",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInputMessage("");
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const currentId = activeSessionId;
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg = {
      id: Date.now(),
      type: "user",
      text: inputMessage,
      timestamp,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentId
          ? { ...s, messages: [...s.messages, userMsg] }
          : s
      )
    );

    const currentInput = inputMessage.toLowerCase();
    setInputMessage("");
    setIsLoading(true);

    setTimeout(() => {
      let botResponseText = "I'm processing your request...";
      let extraContent = null;

      if (currentInput.includes("hello") || currentInput.includes("hi")) {
        botResponseText = "Hello there! Ready to work on some code or analyze data?";
      } else if (currentInput.includes("sales")) {
        botResponseText = "Here is the summary of Q3 performance.";
        extraContent = "sales-demo";
      } else if (currentInput.includes("code")) {
        botResponseText = "Here is a Python script template:";
        extraContent = "code-demo";
      } else {
        botResponseText = "I understand. I am an AI simulation.";
      }

      const botMsg = {
        id: Date.now() + 1,
        type: "bot",
        text: botResponseText,
        extra: extraContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentId) {
            let newTitle = s.title;
            if (s.title === "New Session") {
              newTitle = userMsg.text.substring(0, 20) + (userMsg.text.length > 20 ? "..." : "");
            }
            return { ...s, title: newTitle, messages: [...s.messages, botMsg] };
          }
          return s;
        })
      );
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  // --- Render Content Helpers ---
  const renderExtraContent = (type) => {
    if (type === "sales-demo") {
      return (
        <table className="data-table">
          <thead>
            <tr>
              <th>Region</th><th>Revenue</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>North</td><td style={{ color: "#0fbda6" }}>$120k</td><td><span className="growth-positive">Exceeded</span></td>
            </tr>
            <tr>
              <td>East</td><td style={{ color: "#0fbda6" }}>$85k</td><td><span className="growth-neutral">Stable</span></td>
            </tr>
          </tbody>
        </table>
      );
    }
    if (type === "code-demo") {
      return (
        <div className="code-container">
          <div className="code-header">
            <span>script.py</span><button className="copy-btn"><Copy size={14} /></button>
          </div>
          <div className="code-content">
            <span className="code-keyword">print</span>(<span className="code-str">"Hello World"</span>)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      {/* --- Desktop Sidebar --- */}
      <aside className="sidebar desktop-sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon"><Bot size={24} color="#fff" /></div>
            <span>Promptly</span>
          </div>
          <span style={{ fontSize: "0.7rem", color: "#6b7280", marginLeft: "42px", marginTop: "-4px", display: "block" }}>AI Assistant</span>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} /> New Chat
        </button>

        <nav className="nav-menu" style={{ marginTop: "2rem", overflowY: "auto" }}>
          <div className="section-label" style={{ paddingLeft: "12px", marginBottom: "8px", opacity: 0.7 }}>Recent Chats</div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`nav-item ${activeSessionId === session.id ? "active" : ""}`}
              onClick={() => handleSwitchSession(session.id)}
            >
              <MessageSquare size={18} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.title}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <img src={getAvatarUrl()} alt="User" className="avatar" />
            <div className="user-info">
              <h4>{user.firstName} {user.lastName}</h4>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Mobile Drawer --- */}
      {isSidebarOpen && <div className="drawer-backdrop" onClick={toggleSidebar}></div>}
      
      <div className={`mobile-drawer ${isSidebarOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">Menu</div>
          <button className="icon-btn" onClick={toggleSidebar}><X size={24} /></button>
        </div>
        <button className="new-chat-btn" onClick={handleNewChat} style={{ marginBottom: "2rem" }}>
          <Plus size={18} /> New Chat
        </button>

        <div className="section-label">Previous Chats</div>
        <nav className="nav-menu" style={{ flex: 1, overflowY: "auto" }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`nav-item ${activeSessionId === session.id ? "active-chat" : ""}`}
              onClick={() => handleSwitchSession(session.id)}
            >
              <History size={18} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.title}</span>
            </div>
          ))}
        </nav>

        {/* Mobile User Profile */}
        <div className="sidebar-footer" style={{ borderTop: "1px solid var(--dash-border)", paddingTop: "1rem", marginTop: "auto" }}>
          <div className="user-profile">
            <img src={getAvatarUrl()} alt="User" className="avatar" />
            <div className="user-info">
              <h4 style={{ color: "var(--text-dark-main)" }}>{user.firstName} {user.lastName}</h4>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="main-area">
        {/* Desktop Top Bar */}
        <header className="top-bar">
          <div className="chat-title">
            <h3>{activeSession ? activeSession.title : "New Session"}</h3>
            <span className="status-badge">Active</span>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* --- Mobile Header with 3-Dot Menu --- */}
        <header className="mobile-header">
          <button className="icon-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="mobile-title-container">
            <span className="mobile-title">Promptly</span>
            <div className="mobile-status"><span className="status-dot-sm"></span> Online</div>
          </div>

          {/* 3-Dots Dropdown Container */}
          <div style={{ position: "relative" }}>
            <button className="icon-btn" onClick={toggleMobileMenu}>
              <MoreVertical size={24} />
            </button>

            {/* The Dropdown Menu */}
            {isMobileMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "120%",
                  right: 0,
                  backgroundColor: "var(--dash-card)",
                  border: "1px solid var(--dash-border)",
                  borderRadius: "8px",
                  padding: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  zIndex: 100,
                  minWidth: "140px",
                }}
              >
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "#ef4444", // Red color for logout
                    padding: "10px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    textAlign: "left"
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* --- Chat Stream --- */}
        <div className="chat-content">
          <div className="date-separator">Today</div>
          {currentMessages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className={`message-avatar ${msg.type === "bot" ? "bot-avatar" : ""}`}>
                {msg.type === "bot" ? <Bot size={20} /> : <img src={getAvatarUrl()} alt="Me" className="user-avatar-img" />}
              </div>
              <div className="message-bubble">
                {msg.type === "bot" && <div className="bot-name">Promptly <span className="bot-tag">Bot</span></div>}
                <p>{msg.text}</p>
                {msg.extra && renderExtraContent(msg.extra)}
                <div style={{ fontSize: "0.65rem", opacity: 0.5, marginTop: "8px", textAlign: "right" }}>{msg.timestamp}</div>
              </div>
            </div>
          ))}
          {isLoading && <div className="message bot"><div className="message-avatar bot-avatar"><Bot size={20} /></div><div className="message-bubble"><span className="typing-cursor"></span></div></div>}
          <div ref={chatEndRef} />
        </div>

        {/* --- Input Area --- */}
        <div className="input-area-wrapper">
          <div className="input-container">
            <button className="action-btn-round" onClick={handleNewChat}><Plus size={20} /></button>
            <input
              type="text"
              className="main-input"
              placeholder="Message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button className="action-btn-round"><Mic size={20} /></button>
            <button className="action-btn-round send-btn" onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()} style={{ opacity: !inputMessage.trim() || isLoading ? 0.5 : 1 }}>
              <ArrowUp size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;