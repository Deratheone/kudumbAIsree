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
    
    setConversationHistory(prev => [...prev, newMessage]);
  }, []);

  const generateNextResponse = useCallback(async () => {
    if (isGenerating || isPaused) return;
    
    // Additional safety check to prevent rapid API calls
    const now = Date.now();
    if (now - lastResponseTime < 8000) { // Minimum 8 seconds between responses
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
      // Use random fallback response
      const randomIndex = Math.floor(Math.random() * currentSpeaker.fallbackResponses.length);
      addMessage(currentSpeakerId, currentSpeaker.fallbackResponses[randomIndex]);
    } finally {
      setIsGenerating(false);
    }
  }, [currentSpeaker, currentSpeakerId, conversationHistory, addMessage, isGenerating, isPaused, lastResponseTime]);

  const startChat = useCallback(async () => {
    if (conversationHistory.length > 0) return;
    
    setIsActive(true);
    setIsGenerating(true);
    setLastResponseTime(Date.now()); // Set initial response time
    
    try {
      const text = await startConversation();
      addMessage('babu', text);
      setCurrentSpeakerIndex(1); // Move to next character
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      addMessage('babu', characters.babu.fallbackResponses[0]);
    } finally {
      setIsGenerating(false);
    }
  }, [conversationHistory.length, addMessage]);

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
    if (timeSinceLastMessage < 10000) { // Must wait at least 10 seconds
      console.log('⏳ Waiting before next response to prevent API spam');
      return;
    }
    
    // Set a long delay before next response
    const timer = setTimeout(() => {
      generateNextResponse();
    }, 12000 + Math.random() * 8000); // Random delay 12-20 seconds
    
    return () => clearTimeout(timer);
  }, [isActive, isGenerating, isPaused, generateNextResponse]); // Removed conversationHistory dependency!

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
