import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Character } from '../data/characters';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('VITE_OPENAI_API_KEY environment variable is not set');
}

const openai = createOpenAI({
  apiKey: apiKey
});

const model = openai('gpt-4o-mini');

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
  if (!apiKey) {
    return character.fallbackResponse;
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
    return character.fallbackResponse;
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
  if (!apiKey) {
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
