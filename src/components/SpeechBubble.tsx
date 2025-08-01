import { useState, useEffect } from 'react';

interface SpeechBubbleProps {
  message: string;
  characterId: string;
  isActive: boolean;
}

export default function SpeechBubble({ message, characterId, isActive }: SpeechBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isFallback = message.startsWith('[FALLBACK]');

  useEffect(() => {
    setIsVisible(true);
    
    // Calculate visibility duration based on text length
    // Base time of 8 seconds + 50ms per character (minimum 8s, maximum 25s)
    const baseTime = 8000;
    const timePerChar = 50;
    const maxTime = 25000;
    const duration = Math.min(baseTime + (message.length * timePerChar), maxTime);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [message]);

  if (!isVisible) return null;

  return (
    <div className={`speech-bubble ${isActive ? 'active' : ''} ${characterId} ${isFallback ? 'fallback' : ''}`}>
      <div className="bubble-content">
        <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message}</p>
      </div>
      <div className="bubble-tail"></div>
    </div>
  );
}
