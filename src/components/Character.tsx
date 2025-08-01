import SpeechBubble from './SpeechBubble';
import LoadingSpinner from './LoadingSpinner';
import type { Character } from '../data/characters';
import type { ConversationMessage } from '../services/aiService';

interface CharacterProps {
  character: Character;
  lastMessage?: ConversationMessage;
  isCurrentSpeaker: boolean;
  isGenerating: boolean;
  isPlayingTTS?: boolean;
}

export default function Character({ 
  character, 
  lastMessage, 
  isCurrentSpeaker, 
  isGenerating,
  isPlayingTTS = false
}: CharacterProps) {
  const { position, name, id } = character;

  return (
    <div 
      className="character-container"
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrentSpeaker ? 20 : 10
      }}
    >
      {/* Character Name Label */}
      <div className={`character-indicator ${isCurrentSpeaker ? 'speaking' : ''} ${isPlayingTTS ? 'playing-tts' : ''}`}>
        <div className="character-label">
          <span className="character-name">{name}</span>
          {isCurrentSpeaker && (
            <div className="speaker-icon">
              <div className="pulse-dot"></div>
            </div>
          )}
          {isPlayingTTS && (
            <div className="tts-icon">
              <span>🔊</span>
            </div>
          )}
        </div>
        
        {/* Loading indicator */}
        {isGenerating && <LoadingSpinner />}
      </div>

      {/* Speech Bubble */}
      {lastMessage && (
        <SpeechBubble 
          message={lastMessage.text}
          characterId={id}
          isActive={isCurrentSpeaker}
        />
      )}
    </div>
  );
}
