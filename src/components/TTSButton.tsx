/**
 * Text-to-Speech Button Component
 * Provides audio playback for character messages
 */

import React, { useState } from 'react';
import { ttsService } from '../services/textToSpeechService';
import type { TTSOptions } from '../services/textToSpeechService';

interface TTSButtonProps {
  text: string;
  characterId: string;
  characterName: string;
  className?: string;
  options?: TTSOptions;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  characterId,
  characterName,
  className = '',
  options = {}
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpeak = async () => {
    if (isPlaying) {
      // Stop if currently playing
      ttsService.stopAudio();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setIsPlaying(true);
      await ttsService.speak(text, characterId, options);
    } catch (err: any) {
      setError(err?.message || 'Speech synthesis failed');
      console.error('TTS Error:', err);
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  return (
    <div className={`tts-button-container ${className}`}>
      <button
        onClick={handleSpeak}
        disabled={isLoading}
        className={`tts-button ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
        title={isPlaying ? `Stop ${characterName}'s voice` : `Hear ${characterName} speak`}
        aria-label={isPlaying ? 'Stop speech' : 'Play speech'}
      >
        {isLoading ? (
          <span className="tts-loading">🔄</span>
        ) : isPlaying ? (
          <span className="tts-stop">🔇</span>
        ) : (
          <span className="tts-play">🔊</span>
        )}
      </button>
      
      {error && (
        <div className="tts-error" title={error}>
          ⚠️
        </div>
      )}
    </div>
  );
};

export default TTSButton;
