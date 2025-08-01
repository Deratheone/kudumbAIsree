/**
 * AI Service for KudumbAIshree
 * Simple and reliable Google Gemini integration
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// API Keys with rotation support
const API_KEYS = [
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_1,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_2,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_3,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_4,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_5,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_6,
].filter(key => key && key.trim() !== ''); // Filter out empty keys

// API Key rotation state
let currentKeyIndex = 0;
let failedKeys = new Set<number>(); // Track failed key indices
let lastRotationTime = 0;

// Initialize Google AI with first available key
let google: any = null;
let model: any = null;

function initializeAI(keyIndex: number = 0): boolean {
  if (keyIndex >= API_KEYS.length) {
    console.error('❌ All API keys exhausted');
    return false;
  }

  const apiKey = API_KEYS[keyIndex];
  if (!apiKey || failedKeys.has(keyIndex)) {
    return initializeAI(keyIndex + 1); // Try next key
  }

  try {
    google = createGoogleGenerativeAI({ apiKey });
    model = google('gemini-1.5-flash');
    currentKeyIndex = keyIndex;
    console.log(`✅ Google Gemini API initialized with key ${keyIndex + 1}/${API_KEYS.length}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to initialize with key ${keyIndex + 1}:`, error);
    failedKeys.add(keyIndex);
    return initializeAI(keyIndex + 1); // Try next key
  }
}

function rotateToNextKey(): boolean {
  const nextIndex = (currentKeyIndex + 1) % API_KEYS.length;
  
  // If we've tried all keys recently, reset the failed keys set
  if (Date.now() - lastRotationTime > 300000) { // 5 minutes
    failedKeys.clear();
    console.log('🔄 Resetting failed keys after 5 minutes');
  }
  
  // Try to find next working key
  for (let i = 0; i < API_KEYS.length; i++) {
    const tryIndex = (nextIndex + i) % API_KEYS.length;
    if (!failedKeys.has(tryIndex) && API_KEYS[tryIndex]) {
      lastRotationTime = Date.now();
      return initializeAI(tryIndex);
    }
  }
  
  console.error('❌ No working API keys available');
  return false;
}

// Initialize with first key
if (API_KEYS.length > 0) {
  initializeAI();
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
  
  if (!model || API_KEYS.length === 0 || !canMakeApiCall()) {
    return getRandomFallback(character);
  }

  // Get recent conversation context (last 5 messages) - declare outside try block
  const recentMessages = conversationHistory.slice(-5);
  const context = recentMessages
    .map(msg => `${msg.speakerName}: ${msg.text}`)
    .join('\n');

  try {
    const { text } = await generateText({
      model,
      system: character.systemPrompt,
      prompt: `Previous conversation:\n${context}\n\nRespond as ${character.name}:`,
      temperature: 0.8,
    });
    
    return text.trim();
    
  } catch (error: any) {
    console.error(`❌ API error for ${character.name}:`, error?.message || error);
    
    // Check if it's a rate limit error and rotate key
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('rate')) {
      console.log('🔄 Rate limit detected, rotating to next API key...');
      failedKeys.add(currentKeyIndex);
      if (rotateToNextKey()) {
        console.log('✅ Switched to new API key, retrying...');
        // Retry with new key (but only once to avoid infinite recursion)
        try {
          const { text } = await generateText({
            model,
            system: character.systemPrompt,
            prompt: `Previous conversation:\n${context}\n\nRespond as ${character.name}:`,
            temperature: 0.8,
          });
          return text.trim();
        } catch (retryError) {
          console.error('❌ Retry with new key failed:', retryError);
        }
      }
    }
    
    return getRandomFallback(character);
  }
}

export async function startConversation(): Promise<string> {
  console.log('🤖 Starting conversation');
  
  if (!model || API_KEYS.length === 0 || !canMakeApiCall()) {
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
    
    // Check if it's a rate limit error and rotate key
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('rate')) {
      console.log('🔄 Rate limit detected for starter, rotating to next API key...');
      failedKeys.add(currentKeyIndex);
      if (rotateToNextKey()) {
        console.log('✅ Switched to new API key for starter, retrying...');
        try {
          const { text } = await generateText({
            model,
            system: "Kerala sit-out evening chat starter. 1 sentence.",
            prompt: "Start:",
            temperature: 0.8,
          });
          return text.trim();
        } catch (retryError) {
          console.error('❌ Retry with new key failed for starter:', retryError);
        }
      }
    }
    
    return getConversationStarter();
  }
}

function getRandomFallback(character: Character): string {
  // Use character-specific fallbacks first
  if (character.fallbackResponses && character.fallbackResponses.length > 0) {
    const randomIndex = Math.floor(Math.random() * character.fallbackResponses.length);
    return `[FALLBACK] ${character.fallbackResponses[randomIndex]}`;
  }
  
  // Use single fallback if available
  if (character.fallbackResponse) {
    return `[FALLBACK] ${character.fallbackResponse}`;
  }
  
  // Generic fallbacks as last resort
  const genericResponses = [
    "That's interesting, no? Tell me more.",
    "Acha, I see your point. Very true!",
    "Hmm, that reminds me of something similar...",
    "Good point! I hadn't thought of it that way.",
    "Yes, these things happen in life, alle?"
  ];
  
  return `[FALLBACK] ${genericResponses[Math.floor(Math.random() * genericResponses.length)]}`;
}

function getConversationStarter(): string {
  const starters = [
    "Hey everyone! What a lovely evening for a chat, isn't it?",
    "Good evening! How is everyone doing today?",
    "Perfect weather for sitting outside and talking, no?",
    "It's been such a long day! Good to finally relax and chat.",
    "Evening time is the best time for good conversation."
  ];
  
  return `[FALLBACK] ${starters[Math.floor(Math.random() * starters.length)]}`;
}

// Export API status for debugging
export function getAPIStatus() {
  const currentApiKey = API_KEYS[currentKeyIndex];
  return {
    hasApiKeys: API_KEYS.length > 0,
    totalKeys: API_KEYS.length,
    currentKeyIndex: currentKeyIndex + 1,
    failedKeys: Array.from(failedKeys).map(i => i + 1),
    hasModel: !!model,
    lastCall: lastApiCall,
    canCall: canMakeApiCall(),
    keyUsed: currentApiKey?.substring(0, 20) + '...' || 'None'
  };
}