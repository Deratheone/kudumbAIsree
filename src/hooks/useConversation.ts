import { useState, useEffect, useCallback } from 'react';
import { generateCharacterResponse, startConversation, type ConversationMessage } from '../services/aiService';
import { characters, characterOrder } from '../data/characters';

export function useConversation() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState(0); // Track last response time

  const currentSpeakerId = characterOrder[currentSpeakerIndex];
  const currentSpeaker = characters[currentSpeakerId];

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
  }, []);

  const generateNextResponse = useCallback(async () => {
    if (isGenerating || isPaused || !isActive) return;
    
    // Additional safety check to prevent rapid API calls
    const now = Date.now();
    if (now - lastResponseTime < 5000) { // Minimum 5 seconds between responses
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
      
      addMessage('babu', fallbackStarter);
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
    
    // Don't continue if we just added a message (prevent rapid fire)
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const timeSinceLastMessage = Date.now() - lastMessage.timestamp.getTime();
    if (timeSinceLastMessage < 7000) { // Must wait at least 7 seconds
      console.log('⏳ Waiting before next response to prevent API spam');
      return;
    }
    
    // Don't let conversation go on forever - limit to 10 messages to save tokens
    if (conversationHistory.length >= 10) {
      console.log('🏁 Conversation limit reached, stopping automatic responses');
      setIsPaused(true);
      return;
    }
    
    console.log(`⏰ Scheduling next response for ${currentSpeaker.name}`);
    
    // Set a shorter delay before next response with some randomness
    const baseDelay = 8000; // 8 seconds base
    const randomDelay = Math.random() * 4000; // 0-4 seconds random
    const timer = setTimeout(() => {
      generateNextResponse();
    }, baseDelay + randomDelay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isActive, isGenerating, isPaused, conversationHistory, currentSpeaker.name, generateNextResponse]);

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
    addMessage
  };
}
