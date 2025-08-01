import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// TODO: Replace with your real Google API key for competition submission
// Get your free API key from: https://aistudio.google.com/app/apikey
const apiKey = "AIzaSyDihRqBmHAL9z5lVBG3TGtyGI7uyF6PzcM";

// Validate API key format
const isValidGoogleKey = apiKey && apiKey.startsWith('AIza');

if (!apiKey) {
  console.warn('⚠️ Google API key is not set');
} else if (!isValidGoogleKey) {
  console.warn('⚠️ Invalid Google API key format. Google keys should start with "AIza"');
} else {
  console.log('✅ Google API key configured for competition submission');
}

const google = isValidGoogleKey ? createGoogleGenerativeAI({
  apiKey: apiKey
}) : null;

const model = google ? google('gemini-1.5-flash') : null;

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
  if (!isValidGoogleKey || !model) {
    console.log(`🤖 Using enhanced fallback response for ${character.name}`);
    // Use varied fallback responses for more dynamic conversation
    const randomIndex = Math.floor(Math.random() * character.fallbackResponses.length);
    return character.fallbackResponses[randomIndex];
  }

  try {
    const { text } = await generateText({
      model,
      system: character.systemPrompt,
      prompt: buildConversationPrompt(character, conversationHistory),
      temperature: 0.8,
    });
    
    return text;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Use varied fallback responses even on error
    const randomIndex = Math.floor(Math.random() * character.fallbackResponses.length);
    return character.fallbackResponses[randomIndex];
  }
}

function buildConversationPrompt(character: Character, history: ConversationMessage[]): string {
  const recentHistory = history.slice(-3)
    .map(msg => `${msg.speakerName}: ${msg.text}`)
    .join('\n');
    
  return `Previous conversation:
${recentHistory}

Continue this natural Kerala neighborhood sit-out conversation. Keep response to 1-2 sentences maximum. Use casual, friendly tone with occasional Malayalam words where appropriate. Stay in character as ${character.name}.`;
}

export async function startConversation(): Promise<string> {
  if (!isValidGoogleKey || !model) {
    console.log('🤖 Using fallback response for conversation start');
    return "Namaskaram! How is everyone today? Beautiful weather we're having, alle?";
  }

  try {
    const { text } = await generateText({
      model,
      system: `You are starting a casual conversation in a Kerala sit-out setting. Be friendly and welcoming.`,
      prompt: "Start a casual conversation about today's weather or something happening in the neighborhood. Be natural and welcoming. Use 1-2 sentences with some Malayalam words.",
      temperature: 0.8,
    });
    
    return text;
  } catch (error) {
    console.error('Failed to start conversation:', error);
    return "Namaskaram! How is everyone today? Beautiful weather we're having, alle?";
  }
}
