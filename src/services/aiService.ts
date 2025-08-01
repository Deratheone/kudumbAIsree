import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// For Competition Submission:
// 1. This API key should work for testing. If not, get your FREE key from: https://aistudio.google.com/app/apikey
// 2. Replace with your own API key if needed for extended usage
// 3. Or leave as-is to use enhanced demo mode with varied fallback responses
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
  // Get last 3 messages from history
  const recentHistory = history.slice(-3);
  const formattedHistory = recentHistory
    .map(msg => `${msg.speakerName}: ${msg.text}`)
    .join('\n');
  
  // Analyze the conversation context
  const lastSpeaker = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].speakerName : null;
  const isRespondingToSelf = lastSpeaker === character.name;
  
  // Build context-aware prompt
  let contextPrompt = `Previous conversation:
${formattedHistory}

As ${character.name}, consider the following context:
1. ${lastSpeaker ? `You are responding to ${lastSpeaker}'s message` : 'You are starting a new topic'}
2. Remember your personality: ${character.systemPrompt.split('.')[0]}
3. ${isRespondingToSelf ? 'Avoid repeating yourself and add new insights' : 'Build upon the ongoing discussion'}

Response guidelines:
- Keep your response to 1 sentence maximum
- Use casual, friendly tone
- Stay true to your character's perspective
- Reference or acknowledge previous messages when relevant
- Add your unique viewpoint to the conversation

Your response should naturally flow from the previous messages while maintaining your character's unique perspective.`;

  return contextPrompt;
}

export async function startConversation(): Promise<string> {
  if (!isValidGoogleKey || !model) {
    console.log('🤖 Using enhanced fallback response for conversation start');
    const startResponses = [
      "Namaskaram! How is everyone today? Beautiful weather we're having, alle?",
      "Good evening, kuttikale! Perfect time for a nice chat, no?",
      "Eda, what a lovely evening to sit outside and talk! Come, come, sit here.",
      "Ayyo, finally some time to relax and chat with good friends!",
      "This is what I call the perfect Kerala evening - good weather, good company!"
    ];
    const randomIndex = Math.floor(Math.random() * startResponses.length);
    return startResponses[randomIndex];
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
