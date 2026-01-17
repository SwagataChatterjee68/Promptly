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
  Mic,
  X,
  MoreVertical,
  MessageSquare,
  Loader2,
  Trash2,
  AlertTriangle, // Used for delete warning
} from "lucide-react";

const API_URL = "http://localhost:3000";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Modals State ---
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false); // Create Chat Modal
  const [newChatTitle, setNewChatTitle] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Delete Chat Modal
  const [chatToDeleteId, setChatToDeleteId] = useState(null); // Stores ID of chat to delete

  // --- Chat State ---
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

  // 1. Initial Click on Trash Icon (Opens Modal)
  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation(); // Stop navigation to chat
    setChatToDeleteId(chatId);
    setIsDeleteModalOpen(true);
  };

  // 2. Actual Delete Action (Called from Modal)
  const handleConfirmDelete = async () => {
    if (!chatToDeleteId) return;

    try {
      await axios.delete(`${API_URL}/api/chat/${chatToDeleteId}`, {
        withCredentials: true,
      });

      // Update UI
      setSessions((prev) =>
        prev.filter((session) => session._id !== chatToDeleteId)
      );

      if (activeSessionId === chatToDeleteId) {
        setActiveSessionId(null);
        setMessages([]);
      }

      // Close Modal
      setIsDeleteModalOpen(false);
      setChatToDeleteId(null);
    } catch (error) {
      alert("Could not delete chat");
      setIsDeleteModalOpen(false);
    }
  };

  const handleNewChatClick = () => {
    setNewChatTitle("");
    setIsTitleModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/chat`,
        { title: newChatTitle },
        { withCredentials: true }
      );

      const newChat = response.data.chat;
      setSessions((prev) => [newChat, ...prev]);
      setActiveSessionId(newChat._id);
      setMessages([]);
      setIsTitleModalOpen(false);
    } catch (error) {
      console.error("Failed to create chat:", error);
      alert("Failed to create chat.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!activeSessionId) {
      setIsTitleModalOpen(true);
      return;
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

    if (socket)
      socket.emit("ai-message", { content: msgText, chat: activeSessionId });
    else setIsLoading(false);
  };

  const getAvatarUrl = () =>
    user
      ? `https://ui-avatars.com/api/?name=${user.fullName?.firstName}+${user.fullName?.lastName}&background=0fbda6&color=fff&bold=true`
      : "";
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
      {/* --- CREATE CHAT MODAL --- */}
      {isTitleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">New Chat</span>
              <button
                onClick={() => setIsTitleModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateChat}>
              <input
                autoFocus
                type="text"
                className="modal-input"
                placeholder="Enter chat title..."
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsTitleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={!newChatTitle.trim()}
                >
                  Create Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CHAT MODAL --- */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title" style={{ color: "#ef4444" }}>
                <AlertTriangle size={20} /> Delete Chat
              </span>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <p className="modal-text">
              Are you sure you want to delete this conversation? This action
              cannot be undone and all messages will be lost.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
        <button className="new-chat-btn" onClick={handleNewChatClick}>
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
                  onClick={(e) => handleDeleteClick(e, session._id)}
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
        <div className="drawer-header">
          <div className="drawer-title">Menu</div>
          <button className="icon-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        <button
          className="new-chat-btn"
          onClick={handleNewChatClick}
          style={{ marginBottom: "2rem" }}
        >
          <Plus size={18} /> New Chat
        </button>
        <div className="section-label">Previous Chats</div>
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
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteClick(e, session._id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </nav>
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
        <header className="top-bar">
          <div className="chat-title">
            <h3>
              {sessions.find((s) => s._id === activeSessionId)?.title ||
                "Select a Chat"}
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
          {(!activeSessionId || (messages.length === 0 && !isLoading)) && (
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
              <p>
                {activeSessionId
                  ? "Start the conversation!"
                  : "Create a new chat to begin."}
              </p>
              {!activeSessionId && (
                <button
                  onClick={handleNewChatClick}
                  style={{
                    marginTop: "1rem",
                    background: "#0fbda6",
                    border: "none",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Create New Chat
                </button>
              )}
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
                <span className="typing-text">Typing...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="input-area-wrapper">
          <div className="input-container">
            <button className="action-btn-round" onClick={handleNewChatClick}>
              <Plus size={20} />
            </button>
            <input
              type="text"
              className="main-input"
              placeholder={
                activeSessionId ? "Message..." : "Create a chat first..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onClick={() => !activeSessionId && setIsTitleModalOpen(true)}
            />
            <button className="action-btn-round">
              <Mic size={20} />
            </button>
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
};

export default Home;
