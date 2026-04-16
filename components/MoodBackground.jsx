"use client";

import { useEffect, useState } from "react";
import styles from "./MoodBackground.module.css";

export default function MoodBackground() {
  const [orbs, setOrbs] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      size: Math.random() * 300 + 100,
      left: Math.random() * 90,
      top: Math.random() * 90,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 12,
    }));
    setOrbs(generated);
  }, []);

  return (
    <div className={styles.bgContainer} aria-hidden="true">
      {/* Animated gradient blobs */}
      {orbs.map(orb => (
        <div
          key={orb.id}
          className={styles.orb}
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            left: `${orb.left}%`,
            top: `${orb.top}%`,
            animationDelay: `${orb.delay}s`,
            animationDuration: `${orb.duration}s`,
          }}
        />
      ))}


      {/* Grid overlay */}
      <div className={styles.gridOverlay} />

      {/* Corner glows */}
      <div className={styles.cornerGlow} style={{ top: 0, left: 0 }} />
      <div className={styles.cornerGlow} style={{ bottom: 0, right: 0 }} />
    </div>
  );
}
