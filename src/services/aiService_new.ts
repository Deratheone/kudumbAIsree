/**
 * AI Service for KudumbAIshree
 * Simple and reliable Google Gemini integration
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// Get API key from environment
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
const MIN_INTERVAL = 3000; // 3 seconds between API calls

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
  
  // Check if API is available and rate limiting allows
  if (!model || !API_KEY || !canMakeApiCall()) {
    console.log(`🤖 Using fallback response for ${character.name}`);
    return getRandomFallback(character);
  }

  try {
    const systemPrompt = `You are ${character.name}. ${character.systemPrompt}

Keep responses conversational, authentic to Kerala culture, and 1-2 sentences maximum. Mix Malayalam expressions naturally with English.`;

    const conversationContext = conversationHistory
      .slice(-3) // Last 3 messages for context
      .map(msg => `${msg.speakerName}: ${msg.text}`)
      .join('\n');

    const prompt = conversationContext 
      ? `Previous conversation:\n${conversationContext}\n\nRespond as ${character.name}:`
      : `Start a conversation as ${character.name} in a Kerala sit-out setting.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: 0.7,
    });
    
    console.log(`✅ API response received for ${character.name}`);
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
      system: "You are starting a casual evening conversation in a Kerala sit-out. Be friendly and welcoming.",
      prompt: "Generate a natural conversation starter for a Kerala community evening chat. Keep it to 1-2 sentences and include some Malayalam expressions.",
      temperature: 0.8,
    });
    
    return text.trim();
    
  } catch (error: any) {
    console.error('❌ API error for conversation starter:', error?.message || error);
    return getConversationStarter();
  }
}

function getRandomFallback(character: Character): string {
  if (character.fallbackResponses && character.fallbackResponses.length > 0) {
    const randomIndex = Math.floor(Math.random() * character.fallbackResponses.length);
    return character.fallbackResponses[randomIndex];
  }
  
  // Generic fallbacks based on character type
  const genericResponses = [
    "Alle, what do you think about this?",
    "That's interesting, no? Tell me more.",
    "Acha, I see your point. Very true!",
    "Hmm, that reminds me of something similar...",
    "Good point, eda! I hadn't thought of it that way."
  ];
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

function getConversationStarter(): string {
  const starters = [
    "Namaskaram everyone! What a lovely evening for a chat, alle?",
    "Good evening, kuttikale! How is everyone doing today?",
    "Eda, perfect weather for sitting outside and talking, no?",
    "Ayyo, it's been such a long day! Good to finally relax and chat.",
    "Evening time is the best time for good conversation, alle?"
  ];
  
  return starters[Math.floor(Math.random() * starters.length)];
}
