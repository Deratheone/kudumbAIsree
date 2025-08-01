/**
 * AI Service for KudumbAIshree
 * Simple and reliable Google Gemini integration
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// Get API key from environment with fallback rotation
const API_KEY = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_1 || 
                import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_2 || 
                import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_3 ||
                import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_4 ||
                import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_5 ||
                import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_6;

// Initialize Google AI
let google: any = null;
let model: any = null;

if (API_KEY) {
  try {
    google = createGoogleGenerativeAI({ apiKey: API_KEY });
    model = google('gemini-1.5-flash');
    console.log('✅ Google Gemini API initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Google Gemini API:', error);
  }
} else {
  console.warn('⚠️ No Google API key found in environment variables');
}

export interface ConversationMessage {
  id: number;
  speaker: string;
  speakerName: string;
  text: string;
  timestamp: Date;
}

// Simple rate limiting
let lastApiCall = 0;
const MIN_INTERVAL = 1000; // 1 second between API calls

function canMakeApiCall(): boolean {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < MIN_INTERVAL) {
    return false;
  }
  
  lastApiCall = now;
  return true;
}

export async function generateCharacterResponse(
  character: Character,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  console.log(`🤖 Generating response for ${character.name}`);
  
  if (!model || !API_KEY || !canMakeApiCall()) {
    return getRandomFallback(character);
  }

  try {
    // Get recent conversation context (last 5 messages)
    const recentMessages = conversationHistory.slice(-5);
    const context = recentMessages
      .map(msg => `${msg.speakerName}: ${msg.text}`)
      .join('\n');

    const { text } = await generateText({
      model,
      system: character.systemPrompt,
      prompt: `Previous conversation:\n${context}\n\nRespond as ${character.name}:`,
      temperature: 0.8,
    });
    
    return text.trim();
    
  } catch (error: any) {
    console.error(`❌ API error for ${character.name}:`, error?.message || error);
    return getRandomFallback(character);
  }
}

export async function startConversation(): Promise<string> {
  console.log('🤖 Starting conversation');
  
  if (!model || !API_KEY || !canMakeApiCall()) {
    return getConversationStarter();
  }

  try {
    const { text } = await generateText({
      model,
      system: "Kerala sit-out evening chat starter. 1 sentence.",
      prompt: "Start:",
      temperature: 0.8,
    });
    
    return text.trim();
    
  } catch (error: any) {
    console.error('❌ API error for conversation starter:', error?.message || error);
    return getConversationStarter();
  }
}

function getRandomFallback(character: Character): string {
  // Use character-specific fallbacks first
  if (character.fallbackResponses && character.fallbackResponses.length > 0) {
    const randomIndex = Math.floor(Math.random() * character.fallbackResponses.length);
    return character.fallbackResponses[randomIndex];
  }
  
  // Use single fallback if available
  if (character.fallbackResponse) {
    return character.fallbackResponse;
  }
  
  // Generic fallbacks as last resort
  const genericResponses = [
    "That's interesting, no? Tell me more.",
    "Acha, I see your point. Very true!",
    "Hmm, that reminds me of something similar...",
    "Good point! I hadn't thought of it that way.",
    "Yes, these things happen in life, alle?"
  ];
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

function getConversationStarter(): string {
  const starters = [
    "Hey everyone! What a lovely evening for a chat, isn't it?",
    "Good evening! How is everyone doing today?",
    "Perfect weather for sitting outside and talking, no?",
    "It's been such a long day! Good to finally relax and chat.",
    "Evening time is the best time for good conversation."
  ];
  
  return starters[Math.floor(Math.random() * starters.length)];
}

// Export API status for debugging
export function getAPIStatus() {
  return {
    hasApiKey: !!API_KEY,
    hasModel: !!model,
    lastCall: lastApiCall,
    canCall: canMakeApiCall(),
    keyUsed: API_KEY?.substring(0, 20) + '...' || 'None'
  };
}