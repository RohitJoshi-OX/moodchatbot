"use client";

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import MoodBackground from '@/components/MoodBackground';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState(null);

  return (
    <div className="app-container">
      {/* Floating animated background that fills the empty space */}
      <MoodBackground />

      <Sidebar 
        currentSessionId={currentSessionId} 
        setCurrentSessionId={setCurrentSessionId} 
      />

      <main className="main-layout">
        <header className="hero-header">
          <div className="logo-glow" />
          <h1 className="hero-title">Mood Portal</h1>
          <p className="hero-subtitle">Talk to the AI. Watch the world change around it.</p>
        </header>

        <ChatInterface 
          sessionId={currentSessionId} 
          setSessionId={setCurrentSessionId} 
        />
      </main>
    </div>
  );
}
