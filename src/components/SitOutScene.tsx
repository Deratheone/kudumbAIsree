import { useState } from 'react';
import Character from './Character';
import { useConversation } from '../hooks/useConversation';
import { characters } from '../data/characters';

export default function SitOutScene() {
  const [showLog, setShowLog] = useState(false);
  
  const { 
    conversationHistory, 
    currentSpeaker, 
    isGenerating, 
    isActive,
    isPaused,
    startChat,
    pauseChat,
    resumeChat,
    resetChat,
    currentlyPlayingTTS
  } = useConversation();

  const getLastMessageForCharacter = (characterId: string) => {
    return conversationHistory
      .filter(msg => msg.speaker === characterId)
      .pop();
  };

  return (
    <div className="sit-out-scene">
      {/* Header Controls */}
      <div className="header-controls">
        <div className="logo">
          <span className="house-icon">🏡</span>
          <h1>KudumbAIshree</h1>
        </div>
        <p className="subtitle">Kerala Sit-out Chat Experience</p>
        
        <div className="controls">
          {!isActive ? (
            <button
              onClick={startChat}
              className="control-btn start-btn"
              disabled={isGenerating}
            >
              <span>▶</span> Start Chat
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeChat}
                  className="control-btn resume-btn"
                >
                  <span>▶</span> Resume
                </button>
              ) : (
                <button
                  onClick={pauseChat}
                  className="control-btn pause-btn"
                >
                  <span>⏸</span> Pause
                </button>
              )}
              <button
                onClick={resetChat}
                className="control-btn reset-btn"
              >
                <span>🔄</span> Reset
              </button>
            </>
          )}
          <button
            onClick={() => setShowLog(!showLog)}
            className="control-btn log-btn"
          >
            <span>💬</span> Show Log
          </button>
        </div>
      </div>

      {/* Main Scene */}
      <div 
        className="scene-background"
        style={{
          backgroundImage: 'url(/background.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: '20% 25%',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {/* Scene Overlay */}
        <div className="scene-overlay"></div>
        
        {/* Characters */}
        {Object.values(characters).map(character => (
          <Character
            key={character.id}
            character={character}
            lastMessage={getLastMessageForCharacter(character.id)}
            isCurrentSpeaker={currentSpeaker?.id === character.id}
            isGenerating={isGenerating && currentSpeaker?.id === character.id}
            isPlayingTTS={currentlyPlayingTTS === getLastMessageForCharacter(character.id)?.id.toString()}
          />
        ))}

        {/* Conversation Log */}
        {showLog && (
          <div className="conversation-log">
            <div className="log-header">
              <h3>Conversation Log</h3>
              <button 
                onClick={() => setShowLog(false)}
                className="close-log"
              >
                ✕
              </button>
            </div>
            <div className="log-content">
              {conversationHistory.map(msg => (
                <div 
                  key={msg.id} 
                  className={`log-message ${currentlyPlayingTTS === msg.id.toString() ? 'playing-tts' : ''}`}
                >
                  <strong>{msg.speakerName}:</strong> {msg.text}
                  {currentlyPlayingTTS === msg.id.toString() && (
                    <span className="tts-indicator"> 🔊</span>
                  )}
                </div>
              ))}
              {conversationHistory.length === 0 && (
                <p className="no-messages">No messages yet. Start the conversation!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
