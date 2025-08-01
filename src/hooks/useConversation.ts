import { useState, useEffect, useCallback } from 'react';
import { generateCharacterResponse, startConversation, type ConversationMessage } from '../services/aiService';
import { ttsService } from '../services/textToSpeechService';
import { characters, characterOrder } from '../data/characters';

export function useConversation() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState(0); // Track last response time
  const [currentlyPlayingTTS, setCurrentlyPlayingTTS] = useState<string | null>(null);

  const currentSpeakerId = characterOrder[currentSpeakerIndex];
  const currentSpeaker = characters[currentSpeakerId];

  // Function to play TTS for a message
  const playMessageTTS = useCallback(async (message: ConversationMessage) => {
    try {
      setCurrentlyPlayingTTS(message.id.toString());
      
      // Clean the message text (remove [FALLBACK] prefix if present)
      const cleanText = message.text.replace(/^\[FALLBACK\]\s*/, '');
      
      console.log(`🔊 Playing TTS for ${message.speakerName}: ${cleanText.substring(0, 50)}...`);
      
      await ttsService.speak(cleanText, message.speaker, {
        language: 'english' // Always use English for character speech
      });
      
    } catch (error) {
      console.error('TTS playback failed:', error);
    } finally {
      setCurrentlyPlayingTTS(null);
    }
  }, []);

  const addMessage = useCallback((speakerId: string, text: string) => {
    const newMessage: ConversationMessage = {
      id: Date.now(),
      speaker: speakerId,
      speakerName: characters[speakerId].name,
      text: text.trim(),
      timestamp: new Date()
    };
    
    // Keep only last 10 messages to reduce memory and token usage
    setConversationHistory(prev => {
      const updated = [...prev, newMessage];
      return updated.length > 10 ? updated.slice(-10) : updated;
    });

    // Automatically play TTS for the new message after a short delay
    setTimeout(() => {
      playMessageTTS(newMessage);
    }, 500); // 500ms delay to let the message appear first
    
  }, [playMessageTTS]);

  const generateNextResponse = useCallback(async () => {
    if (isGenerating || isPaused || !isActive) return;
    
    // Additional safety check to prevent rapid API calls
    const now = Date.now();
    if (now - lastResponseTime < 1500) { // Minimum 1.5 seconds between responses
      console.log('⏳ Skipping response - too soon after last one');
      return;
    }
    
    setIsGenerating(true);
    setLastResponseTime(now);
    
    try {
      const response = await generateCharacterResponse(
        currentSpeaker, 
        conversationHistory
      );
      
      addMessage(currentSpeakerId, response);
      
      // Move to next character
      setCurrentSpeakerIndex(prev => (prev + 1) % characterOrder.length);
      
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      // Use improved fallback system
      let fallbackResponse = currentSpeaker.fallbackResponses?.[0] || 
                           currentSpeaker.fallbackResponse ||
                           "That's very interesting! Tell me more about it, eda.";
      
      // Add some variety to fallbacks
      if (currentSpeaker.fallbackResponses && currentSpeaker.fallbackResponses.length > 1) {
        const randomIndex = Math.floor(Math.random() * currentSpeaker.fallbackResponses.length);
        fallbackResponse = currentSpeaker.fallbackResponses[randomIndex];
      }
      
      addMessage(currentSpeakerId, fallbackResponse);
      
      // Still move to next character even on error to keep conversation flowing
      setCurrentSpeakerIndex(prev => (prev + 1) % characterOrder.length);
      
    } finally {
      setIsGenerating(false);
    }
  }, [currentSpeaker, currentSpeakerId, conversationHistory, addMessage, isGenerating, isPaused, isActive, lastResponseTime]);

  const startChat = useCallback(async () => {
    if (conversationHistory.length > 0 || isActive) return;
    
    console.log('🚀 Starting conversation...');
    setIsActive(true);
    setIsGenerating(true);
    setLastResponseTime(Date.now()); // Set initial response time
    
    try {
      const text = await startConversation();
      addMessage('babu', text);
      setCurrentSpeakerIndex(1); // Move to next character (aliyamma)
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      
      // Use a fallback starter
      const fallbackStarter = characters.babu.fallbackResponses?.[0] || 
                             characters.babu.fallbackResponse ||
                             "Namaskaram everyone! What a lovely evening for a chat, alle?";
      
      addMessage('babu', `[FALLBACK] ${fallbackStarter}`);
      setCurrentSpeakerIndex(1); // Still move to next character
      
    } finally {
      setIsGenerating(false);
    }
  }, [conversationHistory.length, isActive, addMessage]);

  const pauseChat = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeChat = useCallback(() => {
    setIsPaused(false);
  }, []);

  const resetChat = useCallback(() => {
    setConversationHistory([]);
    setCurrentSpeakerIndex(0);
    setIsGenerating(false);
    setIsActive(false);
    setIsPaused(false);
    setLastResponseTime(0); // Reset response time
  }, []);

  // Auto-continue conversation with strict controls
  useEffect(() => {
    // Only proceed if conversation is active, not generating, not paused, and has messages
    if (!isActive || isGenerating || isPaused || conversationHistory.length === 0) return;
    
    // Don't let conversation go on forever - limit to 10 messages to save tokens
    if (conversationHistory.length >= 10) {
      console.log('🏁 Conversation limit reached, stopping automatic responses');
      setIsPaused(true);
      return;
    }
    
    // Check how much time has passed since last message
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const timeSinceLastMessage = Date.now() - lastMessage.timestamp.getTime();
    const minimumWait = 2000; // Must wait at least 2 seconds
    
    if (timeSinceLastMessage < minimumWait) {
      // Not enough time has passed, schedule a retry
      const remainingWait = minimumWait - timeSinceLastMessage;
      console.log(`⏳ Waiting ${remainingWait}ms before next response to prevent API spam`);
      
      const timer = setTimeout(() => {
        // Trigger the effect again by creating a dummy state update
        setLastResponseTime(Date.now());
      }, remainingWait + 100); // Add small buffer
      
      return () => clearTimeout(timer);
    }
    
    console.log(`⏰ Scheduling next response for ${currentSpeaker.name}`);
    
    // Set a much shorter delay before next response with some randomness
    const baseDelay = 2500; // 2.5 seconds base
    const randomDelay = Math.random() * 1500; // 0-1.5 seconds random
    const timer = setTimeout(() => {
      generateNextResponse();
    }, baseDelay + randomDelay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isActive, isGenerating, isPaused, conversationHistory, currentSpeaker.name, generateNextResponse, lastResponseTime]);

  return {
    conversationHistory,
    currentSpeaker,
    isGenerating,
    isActive,
    isPaused,
    startChat,
    pauseChat,
    resumeChat,
    resetChat,
    addMessage,
    // TTS controls
    currentlyPlayingTTS,
    playMessageTTS
  };
}
