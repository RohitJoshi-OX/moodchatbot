import ChatInterface from '@/components/ChatInterface';
import MoodBackground from '@/components/MoodBackground';

export default function Home() {
  return (
    <>
      {/* Floating animated background that fills the empty space */}
      <MoodBackground />

      <main className="main-layout">
        <header className="hero-header">
          <div className="logo-glow" />
          <h1 className="hero-title">Mood Portal</h1>
          <p className="hero-subtitle">Talk to the AI. Watch the world change around it.</p>
        </header>

        <ChatInterface />
      </main>
    </>
  );
}
