import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Bot,
  Plus,
  History,
  LogOut,
  ArrowUp,
  Menu,
  X,
  MoreVertical,
  MessageSquare,
  Loader2,
  Trash2, // <--- 1. Import Trash Icon
} from "lucide-react";
import { confirm } from "react-confirm-box"; 
const API_URL = "http://localhost:3000";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  const chatEndRef = useRef(null);

  // --- Fetch Chats ---
  useEffect(() => {
    const fetchChats = async () => {
      if (user) {
        try {
          const res = await axios.get(`${API_URL}/api/chat`, {
            withCredentials: true,
          });
          setSessions(res.data.chats);
        } catch (err) {
          console.error("Error fetching chats:", err);
        } finally {
          setIsPageLoading(false);
        }
      }
    };
    fetchChats();
  }, [user]);

  // --- Fetch Messages ---
  useEffect(() => {
    const fetchMessages = async () => {
      if (activeSessionId) {
        setMessages([]);
        try {
          const res = await axios.get(
            `${API_URL}/api/message/${activeSessionId}`,
            {
              withCredentials: true,
            }
          );
          setMessages(res.data.messages);
        } catch (err) {
          console.error("Error fetching messages:", err);
        }
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  // --- Socket ---
  useEffect(() => {
    if (user) {
      const newSocket = io(API_URL, {
        withCredentials: true,
        transports: ["websocket"],
      });
      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.on("ai-message-response", (data) => {
      if (data.chat === activeSessionId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: Date.now(),
            role: "model",
            content: data.content,
            createdAt: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
      }
    });
    return () => socket.off("ai-message-response");
  }, [socket, activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- Handlers ---

  // <--- 2. DELETE CHAT HANDLER ---
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation(); // Prevent clicking the chat itself

    if(!window.confirm("Are you sure you want to delete this chat?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/chat/${chatId}`, { withCredentials: true });

      setSessions((prev) => prev.filter((session) => session._id !== chatId));

      if (activeSessionId === chatId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      // You can also use confirm() for alerts if you want, or just standard alert
      alert("Could not delete chat"); 
    }
  };
  

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    let chatId = activeSessionId;

    if (!chatId) {
      try {
        const dynamicTitle =
          inputMessage.trim().substring(0, 30) +
          (inputMessage.length > 30 ? "..." : "");
        const response = await axios.post(
          `${API_URL}/api/chat`,
          { title: dynamicTitle },
          { withCredentials: true }
        );
        const newChat = response.data.chat;
        setSessions((prev) => [newChat, ...prev]);
        setActiveSessionId(newChat._id);
        chatId = newChat._id;
      } catch (e) {
        console.error(e);
        return;
      }
    }

    const userMsg = {
      _id: Date.now(),
      role: "user",
      content: inputMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const msgText = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    if (socket) socket.emit("ai-message", { content: msgText, chat: chatId });
    else setIsLoading(false);
  };

  // --- Helpers ---
  const getAvatarUrl = () => {
    if (!user) return "";
    return `https://ui-avatars.com/api/?name=${user.fullName?.firstName}+${user.fullName?.lastName}&background=0fbda6&color=fff&bold=true`;
  };
  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleLogout = async () => {
    if (socket) socket.disconnect();
    await logout();
    navigate("/login");
  };
  const handleSwitchSession = (id) => {
    setActiveSessionId(id);
    setIsSidebarOpen(false);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  return (
    <div className="dashboard-container">
      {/* <--- 3. ADD THIS STYLE BLOCK FOR HOVER EFFECT --- */}
      {/* Sidebar */}
      <aside className="sidebar desktop-sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={24} color="#fff" />
            </div>
            <span>Promptly</span>
          </div>
        </div>
        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} /> New Chat
        </button>

        {isPageLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <Loader2 className="animate-spin" size={24} color="#6b7280" />
          </div>
        ) : (
          <nav
            className="nav-menu"
            style={{ marginTop: "2rem", overflowY: "auto" }}
          >
            <div
              className="section-label"
              style={{ paddingLeft: "12px", marginBottom: "8px", opacity: 0.7 }}
            >
              Recent Chats
            </div>
            {sessions.map((session) => (
              <div
                key={session._id}
                className={`nav-item ${
                  activeSessionId === session._id ? "active" : ""
                }`}
                onClick={() => handleSwitchSession(session._id)}
              >
                {/* <--- 4. Updated Structure for Delete Button --- */}
                <div className="chat-label">
                  <MessageSquare size={18} />
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {session.title || "Untitled Chat"}
                  </span>
                </div>

                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteChat(e, session._id)}
                  title="Delete Chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </nav>
        )}
        <div className="sidebar-footer">
          <div className="user-profile">
            <img src={getAvatarUrl()} alt="User" className="avatar" />
            <div className="user-info">
              <h4>{user?.fullName?.firstName} {user?.fullName?.lastName}</h4>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="drawer-backdrop" onClick={toggleSidebar}></div>
      )}
      <div className={`mobile-drawer ${isSidebarOpen ? "open" : ""}`}>
        {/* ... (Keep your mobile drawer header code) ... */}
        <div className="drawer-header">
          <div className="drawer-title">Menu</div>
          <button className="icon-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        <button
          className="new-chat-btn"
          onClick={handleNewChat}
          style={{ marginBottom: "2rem" }}
        >
          <Plus size={18} /> New Chat
        </button>

        <div className="section-label">Previous Chats</div>
        {/* Inside Mobile Drawer -> nav-menu */}
        <nav className="nav-menu" style={{ flex: 1, overflowY: "auto" }}>
          {sessions.map((session) => (
            <div
              key={session._id}
              className={`nav-item ${
                activeSessionId === session._id ? "active-chat" : ""
              }`}
              onClick={() => handleSwitchSession(session._id)}
            >
              <div className="chat-label">
                <History size={18} />
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {session.title || "Untitled Chat"}
                </span>
              </div>

              {/* --- ADD THIS BUTTON HERE --- */}
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteChat(e, session._id)}
                title="Delete Chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </nav>
        {/* ... (Keep your mobile footer code) ... */}
        <div
          className="sidebar-footer"
          style={{
            borderTop: "1px solid var(--dash-border)",
            paddingTop: "1rem",
            marginTop: "auto",
          }}
        >
          <div className="user-profile">
            <img src={getAvatarUrl()} alt="User" className="avatar" />
            <div className="user-info">
              <h4 style={{ color: "var(--text-dark-main)" }}>
                {user?.fullName?.firstName} {user?.fullName?.lastName}
              </h4>
              <span
                style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)" }}
              >
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-area">
        {/* ... (Keep your main area code exactly as it was) ... */}
        <header className="top-bar">
          <div className="chat-title">
            <h3>
              {sessions.find((s) => s._id === activeSessionId)?.title ||
                "New Session"}
            </h3>
            <span className="status-badge">Active</span>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <header className="mobile-header">
          <button className="icon-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="mobile-title-container">
            <span className="mobile-title">Promptly</span>
          </div>
          <div style={{ position: "relative" }}>
            <button className="icon-btn" onClick={toggleMobileMenu}>
              <MoreVertical size={24} />
            </button>
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
                    color: "#ef4444",
                    padding: "10px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="chat-content">
          <div className="date-separator">Today</div>
          {messages.length === 0 && !isLoading && (
            <div
              style={{
                textAlign: "center",
                marginTop: "20%",
                color: "var(--text-dark-muted)",
              }}
            >
              <Bot
                size={48}
                style={{ margin: "0 auto", marginBottom: "1rem", opacity: 0.5 }}
              />
              <p>Start a new conversation with Elliy.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${msg.role === "user" ? "user" : "bot"}`}
            >
              <div
                className={`message-avatar ${
                  msg.role === "model" ? "bot-avatar" : ""
                }`}
              >
                {msg.role === "model" ? (
                  <Bot size={20} />
                ) : (
                  <img
                    src={getAvatarUrl()}
                    alt="Me"
                    className="user-avatar-img"
                  />
                )}
              </div>
              <div className="message-bubble">
                {msg.role === "model" && (
                  <div className="bot-name">
                    Elliy <span className="bot-tag">AI</span>
                  </div>
                )}
                <p>{msg.content}</p>
                <div
                  style={{
                    fontSize: "0.65rem",
                    opacity: 0.5,
                    marginTop: "8px",
                    textAlign: "right",
                  }}
                >
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-avatar bot-avatar">
                <Bot size={20} />
              </div>
              <div className="message-bubble">
                <span className="typing-cursor"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="input-area-wrapper">
          <div className="input-container">
            <button className="action-btn-round" onClick={handleNewChat}>
              <Plus size={20} />
            </button>
            <input
              type="text"
              className="main-input"
              placeholder="Message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="action-btn-round send-btn"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{ opacity: !inputMessage.trim() || isLoading ? 0.5 : 1 }}
            >
              <ArrowUp size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
