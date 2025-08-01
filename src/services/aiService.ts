/**
 * AI Service for KudumbAIshree
 * Using Google Gemini 1.5 Flash for reliable performance and availability
 * Simple and reliable Google Gemini integration with character-specific API keys
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// API Keys with character-specific assignment
const API_KEYS = [
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_1,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_2,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_3,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_4,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_5,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_6,
].filter(key => key && key.trim() !== ''); // Filter out empty keys

// Character to API key mapping
const CHARACTER_API_MAPPING: Record<string, number> = {
  'babu': 4,      // Uses API_KEY_5 (switched from rate-limited key 1)
  'aliyamma': 1,  // Uses API_KEY_2
  'mary': 2,      // Uses API_KEY_3
  'chakko': 5,    // Uses API_KEY_6 (switched from rate-limited key 4)
};

// Google AI instances for each character
const googleInstances: Record<string, any> = {};
const modelInstances: Record<string, any> = {};

// Character timing tracking for 2-second delays
const lastCharacterResponseTime: Record<string, number> = {};

// Initialize AI instances for each character
function initializeCharacterAI() {
  for (const [characterId, keyIndex] of Object.entries(CHARACTER_API_MAPPING)) {
    const apiKey = API_KEYS[keyIndex];
    if (apiKey) {
      try {
        googleInstances[characterId] = createGoogleGenerativeAI({ apiKey });
        modelInstances[characterId] = googleInstances[characterId]('gemini-1.5-flash');
        console.log(`✅ ${characterId} initialized with API key ${keyIndex + 1} (Gemini 1.5 Flash)`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${characterId} with key ${keyIndex + 1}:`, error);
      }
    } else {
      console.warn(`⚠️ No API key available for ${characterId} (index ${keyIndex})`);
    }
  }
}

// Function to reinitialize models with updated API key mappings
export function reinitializeModels() {
  console.log('🔄 Reinitializing character models with Gemini 1.5 Flash...');
  initializeCharacterAI();
}

// Get model for specific character
function getCharacterModel(characterId: string) {
  return modelInstances[characterId];
}

// Check if character can make API call (3-second delay to avoid rate limits)
function canCharacterMakeApiCall(characterId: string): boolean {
  const now = Date.now();
  const lastCall = lastCharacterResponseTime[characterId] || 0;
  const timeSinceLastCall = now - lastCall;
  
  if (timeSinceLastCall < 3000) { // 3 seconds minimum delay per character to avoid rate limits
    return false;
  }
  
  lastCharacterResponseTime[characterId] = now;
  return true;
}

// Initialize all character AI instances
if (API_KEYS.length > 0) {
  initializeCharacterAI();
  console.log('🚀 AI Service initialized with Gemini 1.5 Flash model');
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

export async function generateCharacterResponse(
  character: Character,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  console.log(`🤖 Generating response for ${character.name}`);
  
  // Get character-specific model and check timing
  const characterModel = getCharacterModel(character.id);
  
  if (!characterModel || API_KEYS.length === 0 || !canCharacterMakeApiCall(character.id)) {
    console.log(`⏰ ${character.name} not ready for API call, using fallback`);
    return getRandomFallback(character);
  }

  // Get recent conversation context (last 5 messages) - declare outside try block
  const recentMessages = conversationHistory.slice(-5);
  const context = recentMessages
    .map(msg => `${msg.speakerName}: ${msg.text}`)
    .join('\n');

  try {
    const { text } = await generateText({
      model: characterModel,
      system: character.systemPrompt,
      prompt: `Previous conversation:\n${context}\n\nRespond as ${character.name}:`,
      temperature: 0.8,
    });
    
    console.log(`✅ ${character.name} generated AI response`);
    return text.trim();
    
  } catch (error: any) {
    console.error(`❌ API error for ${character.name}:`, error?.message || error);
    
    // For character-specific keys, we just use fallback if there's an error
    // No rotation needed since each character has their own dedicated key
    return getRandomFallback(character);
  }
}

export async function startConversation(): Promise<string> {
  console.log('🤖 Starting conversation');
  
  // Use first available model for conversation starter
  const starterModel = modelInstances['babu']; // Use Babu's model for starters
  
  if (!starterModel || API_KEYS.length === 0) {
    return getConversationStarter();
  }

  try {
    const { text } = await generateText({
      model: starterModel,
      system: "Kerala sit-out evening chat starter. Generate 1 natural conversation starter sentence.",
      prompt: "Start an evening conversation:",
      temperature: 0.8,
    });
    
    console.log('✅ Generated AI conversation starter (Gemini 1.5 Flash)');
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
  return {
    hasApiKeys: API_KEYS.length > 0,
    totalKeys: API_KEYS.length,
    characterMappings: CHARACTER_API_MAPPING,
    canCharactersCall: Object.fromEntries(
      Object.keys(CHARACTER_API_MAPPING).map(charId => [
        charId, 
        canCharacterMakeApiCall(charId)
      ])
    ),
    lastCharacterTimes: lastCharacterResponseTime,
    availableModels: Object.keys(modelInstances).length
  };
}