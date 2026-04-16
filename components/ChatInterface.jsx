"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import styles from "./ChatInterface.module.css";

export default function ChatInterface({ sessionId, setSessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentMood, setCurrentMood] = useState("default");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Load from MongoDB when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setMessages(data.messages);
            setCurrentMood(data.mood);
          }
        });
    } else {
      // New Chat
      setMessages([{ role: "bot", content: "Hello there. I am your experimental conversational AI. Give me something to react to..." }]);
      setCurrentMood("default");
    }
  }, [sessionId]);

  // Sync to MongoDB whenever messages or mood change (but not while streaming)
  useEffect(() => {
    if (sessionId && messages.length > 0 && !isStreaming) {
      fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mood: currentMood })
      });
    }
  }, [messages, currentMood, isStreaming, sessionId]);

  // CSS Mood Transition
  useEffect(() => {
    document.body.setAttribute('data-mood', currentMood);
  }, [currentMood]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: "user", content: input };
    const currentInput = input;
    setInput("");

    // Create a new session in DB first if we don't have one
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      try {
        const res = await fetch('/api/sessions', { method: 'POST' });
        const data = await res.json();
        activeSessionId = data._id;
        setSessionId(activeSessionId);
      } catch (err) {
        console.error("Failed to create session", err);
        return; // Halt if DB fails
      }
    }

    setMessages(prev => [...prev, userMessage, { role: "bot", content: "" }]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let moodDetected = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullText += decoder.decode(value, { stream: true });

        // Parse mood tag
        if (!moodDetected) {
          const moodMatch = fullText.match(/^\[MOOD:\s*([a-zA-Z]+)\s*\]/i);
          if (moodMatch) {
            setCurrentMood(moodMatch[1].toLowerCase());
            moodDetected = true;
          }
        }

        // Clean string for UI
        const displayText = fullText.replace(/^\[MOOD:[a-zA-Z\s]*\]?\n?/i, "");

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "bot", content: displayText };
          return updated;
        });
      }

    } catch (error) {
      console.error("Streaming failed:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", content: "Something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is only supported in Chrome or Edge!");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  return (
    <div className={`glass-container ${styles.chatWrapper}`}>
      <div className={styles.messageList}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.botWrapper}`}>
            <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}>
              <ReactMarkdown>{msg.content || "▍"}</ReactMarkdown>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className={styles.botWrapper}>
            <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingBubble}`}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isStreaming ? "AI is thinking..." : "Say something to change my mood..."}
          className={styles.textInput}
          disabled={isStreaming}
        />
        <button type="button" onClick={handleVoiceInput} disabled={isStreaming}
          className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}>
          {isListening ? '🔴' : '🎤'}
        </button>
        <button type="submit" disabled={isStreaming} className={styles.sendButton}>
          {isStreaming ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
