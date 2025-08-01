/**
 * AI Service for KudumbAIshree
 * Simple and reliable Google Gemini integration
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// Get all API keys from environment
const API_KEYS = [
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_1,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_2,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_3,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_4,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_5,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_6,
].filter(Boolean); // Remove undefined keys

// API key rotation state
let currentKeyIndex = 0;
let failedKeys = new Set<number>();
let google: any = null;
let model: any = null;

// Initialize with first available key
function initializeAPI() {
  if (API_KEYS.length === 0) {
    console.warn('⚠️ No Google API keys found in environment variables');
    return false;
  }

  try {
    const apiKey = API_KEYS[currentKeyIndex];
    google = createGoogleGenerativeAI({ apiKey });
    model = google('gemini-1.5-flash');
    console.log(`✅ Google Gemini API initialized with key ${currentKeyIndex + 1}/${API_KEYS.length}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to initialize Google Gemini API with key ${currentKeyIndex + 1}:`, error);
    return false;
  }
}

// Rotate to next available API key
function rotateAPIKey(): boolean {
  const totalKeys = API_KEYS.length;
  
  if (totalKeys <= 1) {
    console.warn('⚠️ Only one API key available, cannot rotate');
    return false;
  }
  
  // Mark current key as failed
  failedKeys.add(currentKeyIndex);
  
  // Find next available key
  for (let i = 1; i < totalKeys; i++) {
    const nextIndex = (currentKeyIndex + i) % totalKeys;
    if (!failedKeys.has(nextIndex)) {
      currentKeyIndex = nextIndex;
      console.log(`🔄 Rotating to API key ${currentKeyIndex + 1}/${totalKeys}`);
      return initializeAPI();
    }
  }
  
  // All keys failed, reset failed keys set after some time and use first key
  if (failedKeys.size >= totalKeys) {
    console.warn('⚠️ All API keys have failed, resetting rotation and retrying');
    failedKeys.clear();
    currentKeyIndex = 0;
    // Add delay before resetting to avoid immediate retry
    setTimeout(() => {
      console.log('🔄 Cleared failed keys cache, ready to retry all keys');
    }, 60000); // Reset after 1 minute
    return initializeAPI();
  }
  
  return false;
}

// Initialize on startup
initializeAPI();

export interface ConversationMessage {
  id: number;
  speaker: string;
  speakerName: string;
  text: string;
  timestamp: Date;
}

// Simple rate limiting with quota error handling
let lastApiCall = 0;
const MIN_INTERVAL = 2000; // 2 seconds between API calls

function canMakeApiCall(): boolean {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < MIN_INTERVAL) {
    return false;
  }
  
  if (API_KEYS.length === 0 || !model) {
    return false;
  }
  
  lastApiCall = now;
  return true;
}

// Check if error is due to quota/rate limiting or other API issues
function isQuotaError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStatus = error?.status || error?.statusCode;
  
  return errorStatus === 429 || 
         errorStatus === 503 ||
         errorMessage.includes('quota') || 
         errorMessage.includes('rate limit') ||
         errorMessage.includes('too many requests') ||
         errorMessage.includes('service unavailable') ||
         errorMessage.includes('overloaded');
}

// Check if error suggests API key is invalid
function isAuthError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStatus = error?.status || error?.statusCode;
  
  return errorStatus === 401 || 
         errorStatus === 403 ||
         errorMessage.includes('unauthorized') ||
         errorMessage.includes('forbidden') ||
         errorMessage.includes('invalid api key') ||
         errorMessage.includes('authentication');
}

// Make API call with automatic key rotation on errors
async function makeAPICall(modelCall: () => Promise<any>): Promise<any> {
  let lastError: any;
  const maxAttempts = Math.min(API_KEYS.length, 3); // Try max 3 keys or all available keys
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await modelCall();
      console.log(`✅ API call successful with key ${currentKeyIndex + 1}`);
      return result;
    } catch (error: any) {
      lastError = error;
      const errorType = isQuotaError(error) ? 'quota' : isAuthError(error) ? 'auth' : 'unknown';
      
      console.warn(`⚠️ API error (${errorType}) with key ${currentKeyIndex + 1}/${API_KEYS.length}:`, error?.message);
      
      // If this is the last attempt, or error is not recoverable, throw
      if (attempt === maxAttempts - 1 || (!isQuotaError(error) && !isAuthError(error))) {
        console.error(`❌ All API attempts failed. Last error:`, error?.message);
        throw lastError;
      }
      
      // Try rotating to next key
      if (!rotateAPIKey()) {
        console.error(`❌ No more API keys available for rotation`);
        throw lastError;
      }
      
      // Add shorter delay between attempts to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw lastError;
}

export async function generateCharacterResponse(
  character: Character, 
  conversationHistory: ConversationMessage[]
): Promise<string> {
  console.log(`🤖 Generating response for ${character.name}`);
  
  // Check if API is available and rate limiting allows
  if (!canMakeApiCall()) {
    console.log(`🤖 Using fallback response for ${character.name} (rate limited or no API)`);
    return getRandomFallback(character, conversationHistory);
  }

  try {
    // Ultra-short system prompt to save tokens
    const systemPrompt = `${character.systemPrompt} Kerala sit-out chat. Malayalam expressions OK.`;

    // Reduce context to last 2 messages only to save tokens
    const conversationContext = conversationHistory
      .slice(-2) // Last 2 messages only
      .map(msg => `${msg.speakerName}: ${msg.text}`)
      .join('\n');

    // Shorter prompt format
    const prompt = conversationContext 
      ? `${conversationContext}\n${character.name}:`
      : `Kerala evening chat. ${character.name}:`;

    const result = await makeAPICall(() => generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: 0.7,
    }));
    
    console.log(`✅ API response received for ${character.name}`);
    return result.text.trim();
    
  } catch (error: any) {
    console.error(`❌ API error for ${character.name}:`, error?.message || error);
    return getRandomFallback(character, conversationHistory);
  }
}

export async function startConversation(): Promise<string> {
  console.log('🤖 Starting conversation');
  
  if (!canMakeApiCall()) {
    console.log('🤖 Using fallback conversation starter (rate limited or no API)');
    return getConversationStarter();
  }

  try {
    const result = await makeAPICall(() => generateText({
      model,
      system: "Kerala sit-out evening chat starter. 1 sentence.",
      prompt: "Start:",
      temperature: 0.8,
    }));
    
    console.log('✅ API conversation starter received');
    return result.text.trim();
    
  } catch (error: any) {
    console.error('❌ API error for conversation starter:', error?.message || error);
    return getConversationStarter();
  }
}

function getRandomFallback(character: Character, conversationHistory: ConversationMessage[] = []): string {
  // Use character-specific fallbacks if available
  if (character.fallbackResponses && character.fallbackResponses.length > 0) {
    const randomIndex = Math.floor(Math.random() * character.fallbackResponses.length);
    return character.fallbackResponses[randomIndex];
  }
  
  // Use single fallback if available
  if (character.fallbackResponse) {
    return character.fallbackResponse;
  }
  
  // Context-aware generic fallbacks based on conversation length
  const conversationLength = conversationHistory.length;
  let responses: string[];
  
  if (conversationLength === 0) {
    // Starting conversation fallbacks
    responses = [
      "Namaskaram! What a lovely evening for a chat, alle?",
      "Good evening, everyone! How are you all doing today?",
      "Eda, perfect weather for sitting outside and talking, no?",
      "Ayyo, what a peaceful evening! Good to see everyone here.",
      "Evening time is the best time for good conversation, alle?"
    ];
  } else if (conversationLength < 3) {
    // Early conversation fallbacks
    responses = [
      "Alle, that's very interesting! Tell me more about it.",
      "Acha, I see what you mean. Very true, no?",
      "You know, that reminds me of something similar...",
      "That's a good point, eda! I hadn't thought of it that way.",
      "Yes, yes, these things happen in life, alle?"
    ];
  } else if (conversationLength < 8) {
    // Mid conversation fallbacks
    responses = [
      "Hmm, life is full of such experiences, no?",
      "These days everything is changing so fast, eda!",
      "You know what they say - every problem has a solution, alle?",
      "That's the beauty of our Kerala culture, no?",
      "Family and friends are the most important things in life.",
      "These are the moments that make life meaningful, alle?"
    ];
  } else {
    // Long conversation fallbacks
    responses = [
      "Time flies when we're having good conversation, no?",
      "It's getting late, but such good talks are rare these days!",
      "These evening chats are the best part of the day, alle?",
      "We should do this more often - just sit and talk like this.",
      "This is what I love about our community - good people, good talks!",
      "Such peaceful moments are precious in this busy world, no?"
    ];
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function getConversationStarter(): string {
  const timeBasedStarters = [
    // General evening starters
    "Namaskaram everyone! What a lovely evening for a chat, alle?",
    "Good evening, kuttikale! How is everyone doing today?",
    "Eda, perfect weather for sitting outside and talking, no?",
    "Ayyo, it's been such a long day! Good to finally relax and chat.",
    "Evening time is the best time for good conversation, alle?",
    
    // Weather-based starters
    "This cool breeze is so refreshing after the hot day, no?",
    "Look at those clouds gathering - maybe some rain tonight, alle?",
    "The coconut trees are swaying so beautifully in this evening wind!",
    
    // Community-based starters
    "It's so nice to see everyone together like this, alle?",
    "These sit-out conversations are what I love most about our culture!",
    "Nothing beats good company and good conversation, eda!",
    
    // Reflective starters
    "You know, machane, life moves so fast these days. Good to slow down sometimes.",
    "In this busy world, moments like these are precious, no?",
    "Simple pleasures - fresh air, good people, peaceful evening. What more do we need?"
  ];
  
  return timeBasedStarters[Math.floor(Math.random() * timeBasedStarters.length)];
}

// Export API status for debugging
export function getAPIStatus(): {
  totalKeys: number;
  currentKey: number;
  failedKeys: number;
  lastCall: number;
  canCall: boolean;
} {
  return {
    totalKeys: API_KEYS.length,
    currentKey: currentKeyIndex + 1,
    failedKeys: failedKeys.size,
    lastCall: lastApiCall,
    canCall: canMakeApiCall()
  };
}
