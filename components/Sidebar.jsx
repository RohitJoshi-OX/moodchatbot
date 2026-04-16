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
        🍔
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
              <button 
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
              </button>
            ))
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </>
  );
}
