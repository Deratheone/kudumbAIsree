import { useState, useEffect } from 'react';

interface SpeechBubbleProps {
  message: string;
  characterId: string;
  isActive: boolean;
}

export default function SpeechBubble({ message, characterId, isActive }: SpeechBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Hide bubble after 15 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [message]);

  if (!isVisible) return null;

  return (
    <div className={`speech-bubble ${isActive ? 'active' : ''} ${characterId}`}>
      <div className="bubble-content">
        <p className="text-sm md:text-base">{message}</p>
      </div>
      <div className="bubble-tail"></div>
    </div>
  );
}
