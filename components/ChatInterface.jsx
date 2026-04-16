"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import styles from "./ChatInterface.module.css";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentMood, setCurrentMood] = useState("default");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // PHASE 1: Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedMessages = localStorage.getItem('chat_messages');
    const savedMood = localStorage.getItem('chat_mood');
    if (savedMessages && savedMessages !== "[]") {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([{ role: "bot", content: "Hello there. I am your experimental conversational AI. Give me something to react to..." }]);
    }
    if (savedMood) setCurrentMood(savedMood);
  }, []);

  // PHASE 1: Save to localStorage whenever messages change (but not while streaming)
  useEffect(() => {
    if (isMounted && messages.length > 0 && !isStreaming) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
      localStorage.setItem('chat_mood', currentMood);
    }
  }, [messages, currentMood, isMounted, isStreaming]);

  // CSS Mood Transition
  useEffect(() => {
    document.body.setAttribute('data-mood', currentMood);
  }, [currentMood]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: "user", content: input };
    const currentInput = input;

    // Add user message and an empty bot placeholder
    setMessages(prev => [...prev, userMessage, { role: "bot", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput })
      });

      // PHASE 4: Read the stream chunk by chunk!
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = "";
      let moodDetected = false;
      let detectedMood = "default";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Parse the [MOOD:xxx] tag from the very beginning of the stream
        if (!moodDetected) {
          const moodMatch = fullText.match(/^\[MOOD:\s*([a-zA-Z]+)\s*\]/i);
          if (moodMatch) {
            detectedMood = moodMatch[1];
            setCurrentMood(detectedMood);
            fullText = fullText.replace(moodMatch[0], "");
            moodDetected = true;
          }
        }

        // Strip any partial or full mood tag so it isn't shown to the user
        const displayText = fullText.replace(/^\[MOOD:[a-zA-Z\s]*\]?\n?/i, "");

        // Update the last message (the bot placeholder) with the growing text
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

  // PHASE 3: Voice Input using Web Speech API
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

  const handleClear = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!isMounted) return null;

  return (
    <div className={`glass-container ${styles.chatWrapper}`}>
      <div className={styles.messageList}>
        <div className={styles.topActions}>
          <button onClick={handleClear} className={styles.clearBtn}>🗑️ Clear Memory</button>
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.botWrapper}`}>
            <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}>
              {/* PHASE 2: Markdown Rendering */}
              <ReactMarkdown>{msg.content || "▍"}</ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Streaming indicator dots */}
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
        {/* PHASE 3: Voice Button */}
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
