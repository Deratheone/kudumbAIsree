import { useState, useEffect, useCallback } from 'react';
import { generateCharacterResponse, startConversation, type ConversationMessage } from '../services/aiService';
import { characters, characterOrder } from '../data/characters';

export function useConversation() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
    
    setIsGenerating(true);
    
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
      addMessage(currentSpeakerId, currentSpeaker.fallbackResponse);
    } finally {
      setIsGenerating(false);
    }
  }, [currentSpeaker, currentSpeakerId, conversationHistory, addMessage, isGenerating, isPaused]);

  const startChat = useCallback(async () => {
    if (conversationHistory.length > 0) return;
    
    setIsActive(true);
    setIsGenerating(true);
    
    try {
      const text = await startConversation();
      addMessage('babu', text);
      setCurrentSpeakerIndex(1); // Move to next character
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      addMessage('babu', characters.babu.fallbackResponse);
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
  }, []);

  // Auto-continue conversation
  useEffect(() => {
    if (!isActive || isGenerating || isPaused || conversationHistory.length === 0) return;
    
    const timer = setTimeout(() => {
      generateNextResponse();
    }, 3000 + Math.random() * 2000); // Random delay 3-5 seconds
    
    return () => clearTimeout(timer);
  }, [conversationHistory, isActive, isGenerating, isPaused, generateNextResponse]);

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
