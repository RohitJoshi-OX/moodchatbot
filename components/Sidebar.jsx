import { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar({ currentSessionId, setCurrentSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch all history on load or when currentSessionId changes (in case a new one was created)
  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this chat?")) {
      try {
        const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSessions(sessions.filter(s => s._id !== id));
          if (currentSessionId === id) {
            setCurrentSessionId(null);
          }
        }
      } catch (err) {
        console.error("Failed to delete session", err);
      }
    }
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    if(window.innerWidth < 768) setIsOpen(false);
  };

  const selectSession = (id) => {
    setCurrentSessionId(id);
    if(window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button className={styles.mobileToggle} onClick={() => setIsOpen(!isOpen)}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Container */}
      <div className={`${styles.sidebarWrapper} ${isOpen ? styles.open : ''} glass-container`}>
        <button className={styles.newChatBtn} onClick={createNewChat}>
          <span>+</span> New Chat
        </button>

        <div className={styles.historyList}>
          <p className={styles.historyTitle}>Recent Chats</p>
          {sessions.length === 0 ? (
            <p className={styles.emptyText}>No history yet.</p>
          ) : (
            sessions.map(session => (
              <div 
                key={session._id} 
                className={`${styles.sessionItem} ${currentSessionId === session._id ? styles.active : ''}`}
                onClick={() => selectSession(session._id)}
              >
                <div className={styles.sessionMood}>
                  {session.mood === 'happy' ? '🌟' : 
                   session.mood === 'sad' ? '🌧️' : 
                   session.mood === 'angry' ? '😡' : 
                   session.mood === 'excited' ? '🚀' : 
                   session.mood === 'romantic' ? '💖' : 
                   session.mood === 'mysterious' ? '🔮' : 
                   session.mood === 'bored' ? '🥱' : '💬'}
                </div>
                <div className={styles.sessionText}>
                  {session.title?.substring(0, 25) || "New Chat"}
                </div>
                <button 
                  className={styles.deleteBtn}
                  onClick={(e) => deleteSession(session._id, e)}
                  title="Delete Chat"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </>
  );
}
