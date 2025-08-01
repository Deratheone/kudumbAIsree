/**
 * AI Service for KudumbAIshree
 * 
 * Enhanced Features:
 * - Google Gemini Flash 1.5 API integration with advanced error handling
 * - Intelligent rate limiting with exponential backoff
 * - Context-aware conversation memory
 * - Smart fallback system with personality preservation
 * - Advanced prompt engineering for authentic Kerala conversations
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Character } from '../data/characters';

// Debug configuration following AI SDK best practices
const isDebugMode = import.meta.env.VITE_AI_DEBUG === 'true';
const isApiTestingEnabled = import.meta.env.VITE_ENABLE_API_TESTING === 'true';

// Enhanced logging utility
const logger = {
  debug: (...args: any[]) => {
    if (isDebugMode) {
      console.log('[AI-DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.log('[AI-INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[AI-WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[AI-ERROR]', ...args);
  }
};

// API Key validation following AI SDK best practices
function validateApiKey(key: string): boolean {
  if (!key) {
    logger.warn('API key is empty or undefined');
    return false;
  }
  
  if (!key.startsWith('AIza')) {
    logger.warn(`Invalid API key format: ${key.substring(0, 10)}... - Google keys should start with "AIza"`);
    return false;
  }
  
  if (key.length < 30) {
    logger.warn(`API key too short: ${key.substring(0, 10)}... - Expected at least 30 characters`);
    return false;
  }
  
  return true;
}

// For Competition Submission - Multiple API keys from environment variables
const apiKeys = [
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_1,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_2,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_3,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_4,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_5,
  import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY_6
].filter(Boolean); // Filter out undefined keys

// Validate all API keys on initialization
const validApiKeys = apiKeys.filter(validateApiKey);
if (validApiKeys.length === 0) {
  logger.error('No valid API keys found! Please check your environment variables.');
} else {
  logger.info(`✅ Found ${validApiKeys.length}/${apiKeys.length} valid API keys`);
}

// Track which keys work and their status
let workingApiKeys: string[] = [];
let currentKeyIndex = 0;
let keyTestResults: Record<string, { working: boolean; lastTested: Date; errorMessage?: string }> = {};

// Initialize key testing results
apiKeys.forEach(key => {
  keyTestResults[key] = { working: false, lastTested: new Date() };
});

// Get current API key to use (with smart retry logic)
function getCurrentApiKey(): string {
  // If we have working keys, cycle through them
  if (workingApiKeys.length > 0) {
    const key = workingApiKeys[currentKeyIndex % workingApiKeys.length];
    currentKeyIndex++;
    return key;
  }
  
  // If no working keys, try all keys again (rate limits might have cleared)
  logger.debug('🔄 No working keys found, trying all keys again...');
  
  // Reset all keys as potentially working (maybe rate limits cleared)
  const rateLimitedKeys = apiKeys.filter(key => {
    const result = keyTestResults[key];
    return result && result.errorMessage?.includes('429');
  });
  
  if (rateLimitedKeys.length > 0) {
    logger.debug(`🔄 Found ${rateLimitedKeys.length} previously rate-limited keys to retry`);
    // Add rate-limited keys back to potential working keys
    workingApiKeys.push(...rateLimitedKeys);
  }
  
  // Otherwise, try the next untested key
  const key = apiKeys[currentKeyIndex % apiKeys.length];
  currentKeyIndex++;
  return key;
}

const apiKey = getCurrentApiKey();

// Validate API key format
const isValidGoogleKey = apiKey && apiKey.startsWith('AIza');

if (!apiKey) {
  console.warn('⚠️ Google API key is not set');
} else if (!isValidGoogleKey) {
  console.warn('⚠️ Invalid Google API key format. Google keys should start with "AIza"');
} else {
  console.log(`✅ Testing Google API key: ${apiKey.substring(0, 20)}...`);
}

// Test all API keys on startup with conservative rate limiting
async function testAllApiKeys(): Promise<void> {
  console.log(`🔍 Testing ${apiKeys.length} API keys with conservative rate limiting...`);
  console.log(`⏳ This will take about ${apiKeys.length * 10} seconds to avoid rate limits`);
  
  for (let i = 0; i < apiKeys.length; i++) {
    const testKey = apiKeys[i];
    console.log(`🧪 Testing key ${i + 1}/${apiKeys.length}: ${testKey.substring(0, 20)}... (waiting 10s between tests)`);
    
    try {
      const testGoogle = createGoogleGenerativeAI({ apiKey: testKey });
      const testModel = testGoogle('gemini-1.5-flash');
      
      // Use a very simple test to minimize token usage
      const { text } = await generateText({
        model: testModel,
        system: "You are a test assistant.",
        prompt: "Say only: Hello",
        temperature: 0.1,
        maxRetries: 0, // No retries to fail fast
      });
      
      if (text && text.trim()) {
        workingApiKeys.push(testKey);
        keyTestResults[testKey] = { working: true, lastTested: new Date() };
        console.log(`✅ Key ${i + 1} WORKS: ${testKey.substring(0, 20)}... - Response: "${text.trim()}"`);
      } else {
        keyTestResults[testKey] = { 
          working: false, 
          lastTested: new Date(), 
          errorMessage: 'Empty response' 
        };
        console.log(`❌ Key ${i + 1} FAILED: ${testKey.substring(0, 20)}... - Empty response`);
      }
    } catch (error: any) {
      keyTestResults[testKey] = { 
        working: false, 
        lastTested: new Date(), 
        errorMessage: error?.message || 'Unknown error' 
      };
      
      // Check if it's a rate limit vs other error
      if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
        console.log(`⚠️ Key ${i + 1} RATE LIMITED: ${testKey.substring(0, 20)}... - Will retry later`);
        // Don't mark as completely failed, might work later
      } else if (error?.message?.includes('quota') || error?.message?.includes('exceed')) {
        console.log(`❌ Key ${i + 1} QUOTA EXCEEDED: ${testKey.substring(0, 20)}...`);
      } else if (error?.message?.includes('API key') || error?.message?.includes('invalid')) {
        console.log(`❌ Key ${i + 1} INVALID: ${testKey.substring(0, 20)}...`);
      } else {
        console.log(`❌ Key ${i + 1} FAILED: ${testKey.substring(0, 20)}... - ${error?.message?.substring(0, 50) || 'Unknown'}`);
      }
    }
    
    // Much longer delay between tests to avoid rate limiting (10 seconds)
    if (i < apiKeys.length - 1) {
      console.log(`⏳ Waiting 10 seconds before testing next key...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log(`\n📊 API Key Test Results:`);
  console.log(`✅ Working keys: ${workingApiKeys.length}/${apiKeys.length}`);
  
  if (workingApiKeys.length > 0) {
    console.log(`🔑 Valid keys: ${workingApiKeys.map(key => key.substring(0, 20) + '...').join(', ')}`);
    console.log(`🎯 Will rotate between ${workingApiKeys.length} working keys for optimal performance.`);
  } else {
    console.warn(`⚠️ No working API keys found in initial test! Will retry during conversation.`);
    console.log(`💡 Note: Keys may still work during conversation - rate limits might have prevented testing.`);
  }
}

// Start testing keys immediately (but skip if already tested recently)
const lastTestTime = localStorage.getItem('apiKeyLastTest');
const shouldSkipTest = lastTestTime && (Date.now() - parseInt(lastTestTime)) < 300000; // Skip if tested in last 5 minutes

if (!shouldSkipTest) {
  console.log(`🔄 Starting API key testing...`);
  testAllApiKeys().catch(error => {
    console.error('Error during API key testing:', error);
  }).finally(() => {
    localStorage.setItem('apiKeyLastTest', Date.now().toString());
  });
} else {
  console.log(`⏭️ Skipping API key testing (tested recently). Use testSingleApiKey() to test manually.`);
}

// Add function to get current API status for debugging
export function getApiStatus() {
  return {
    totalKeys: apiKeys.length,
    workingKeys: workingApiKeys.length,
    currentKey: workingApiKeys.length > 0 ? getCurrentApiKey().substring(0, 20) + '...' : 'None working',
    keyResults: Object.fromEntries(
      Object.entries(keyTestResults).map(([key, result]) => [
        key.substring(0, 20) + '...',
        result
      ])
    )
  };
}

// Helper functions for manual testing in console
export function listApiKeys() {
  console.log('📋 Available API Keys:');
  apiKeys.forEach((key, index) => {
    const status = keyTestResults[key];
    const statusText = status?.working ? '✅ WORKING' : 
                     status?.errorMessage?.includes('429') ? '⚠️ RATE LIMITED' :
                     status?.errorMessage ? '❌ FAILED' : '❓ UNTESTED';
    console.log(`${index}: ${key.substring(0, 20)}... - ${statusText}`);
  });
  console.log(`\n🎯 Currently working keys: ${workingApiKeys.length}/${apiKeys.length}`);
  console.log(`\n💡 Use testSingleApiKey(index) to test a specific key`);
  console.log(`💡 Use getApiStatus() to see detailed status`);
}

// Manual function to test a specific key (for debugging)
export async function testSingleApiKey(keyIndex: number): Promise<boolean> {
  if (keyIndex < 0 || keyIndex >= apiKeys.length) {
    console.error(`Invalid key index: ${keyIndex}. Must be 0-${apiKeys.length - 1}`);
    return false;
  }
  
  const testKey = apiKeys[keyIndex];
  console.log(`🧪 Manual test of key ${keyIndex + 1}: ${testKey.substring(0, 20)}...`);
  
  try {
    const testGoogle = createGoogleGenerativeAI({ apiKey: testKey });
    const testModel = testGoogle('gemini-1.5-flash');
    
    const { text } = await generateText({
      model: testModel,
      system: "You are a helpful assistant.",
      prompt: "Say only: Working",
      temperature: 0.1,
      maxRetries: 0,
    });
    
    if (text && text.trim()) {
      // Add to working keys if not already there
      if (!workingApiKeys.includes(testKey)) {
        workingApiKeys.push(testKey);
      }
      keyTestResults[testKey] = { working: true, lastTested: new Date() };
      console.log(`✅ Key ${keyIndex + 1} WORKS: Response: "${text.trim()}"`);
      return true;
    }
  } catch (error: any) {
    keyTestResults[testKey] = { 
      working: false, 
      lastTested: new Date(), 
      errorMessage: error?.message || 'Unknown error' 
    };
    console.log(`❌ Key ${keyIndex + 1} FAILED: ${error?.message?.substring(0, 100) || 'Unknown error'}`);
  }
  
  return false;
}

// Test all keys manually with user control
export async function manualTestAllKeys(): Promise<void> {
  console.log(`🔄 Manual testing of all ${apiKeys.length} API keys...`);
  console.log(`⚠️ This will take time to avoid rate limits. Press Ctrl+C if you want to stop.`);
  
  for (let i = 0; i < apiKeys.length; i++) {
    console.log(`\n⏳ Testing key ${i + 1}/${apiKeys.length} in 3 seconds... (Ctrl+C to stop)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await testSingleApiKey(i);
    if (result) {
      console.log(`🎉 Found working key! Total working: ${workingApiKeys.length}`);
    }
    
    // Wait longer between tests
    if (i < apiKeys.length - 1) {
      console.log(`⏳ Waiting 15 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  console.log(`\n📊 Final Results: ${workingApiKeys.length}/${apiKeys.length} keys working`);
}

// Enhanced rate limiting with exponential backoff
let lastApiCall = 0;
let failedAttempts = 0;
const BASE_API_INTERVAL = 10000; // Base 10 seconds between API calls (much more conservative)
const MAX_RETRY_DELAY = 120000; // Maximum 2 minutes delay

function getApiInterval(): number {
  // Exponential backoff: base * 2^failures (capped at max)
  const exponentialDelay = BASE_API_INTERVAL * Math.pow(2, failedAttempts);
  return Math.min(exponentialDelay, MAX_RETRY_DELAY);
}

function shouldUseApiCall(): boolean {
  const now = Date.now();
  const requiredInterval = getApiInterval();
  
  // Initialize lastApiCall if it's the first call
  if (lastApiCall === 0) {
    lastApiCall = now;
    console.log(`✅ First API call - initializing timer`);
    return true;
  }
  
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < requiredInterval) {
    console.log(`⏳ Rate limiting: Only ${Math.round(timeSinceLastCall/1000)}s since last call (need ${Math.round(requiredInterval/1000)}s). Using fallback.`);
    return false;
  }
  
  console.log(`✅ API call allowed: ${Math.round(timeSinceLastCall/1000)}s since last call`);
  lastApiCall = now;
  return true;
}

// Conversation memory to maintain context across sessions
interface ConversationContext {
  recentTopics: string[];
  characterMoods: Record<string, 'happy' | 'thoughtful' | 'excited' | 'calm'>;
  lastInteraction: Date;
}

let conversationContext: ConversationContext = {
  recentTopics: [],
  characterMoods: {},
  lastInteraction: new Date()
};

// Helper function to update conversation context
function updateConversationContext(character: Character, history: ConversationMessage[]): void {
  const now = new Date();
  conversationContext.lastInteraction = now;
  
  // Extract recent topics from conversation
  if (history.length > 0) {
    const recentMessages = history.slice(-5);
    const topics = recentMessages.map(msg => 
      msg.text.toLowerCase().split(' ').filter(word => word.length > 4)
    ).flat();
    conversationContext.recentTopics = [...new Set(topics)].slice(0, 10);
  }
  
  // Update character mood based on recent messages
  const recentCharacterMessages = history.filter(msg => msg.speaker === character.id).slice(-2);
  if (recentCharacterMessages.length > 0) {
    const lastMessage = recentCharacterMessages[recentCharacterMessages.length - 1].text.toLowerCase();
    if (lastMessage.includes('happy') || lastMessage.includes('great') || lastMessage.includes('wonderful')) {
      conversationContext.characterMoods[character.id] = 'happy';
    } else if (lastMessage.includes('think') || lastMessage.includes('remember') || lastMessage.includes('wisdom')) {
      conversationContext.characterMoods[character.id] = 'thoughtful';
    } else if (lastMessage.includes('exciting') || lastMessage.includes('amazing') || lastMessage.includes('wow')) {
      conversationContext.characterMoods[character.id] = 'excited';
    } else {
      conversationContext.characterMoods[character.id] = 'calm';
    }
  }
}

// Intelligent fallback system that considers conversation context
function getIntelligentFallback(character: Character, history: ConversationMessage[]): string {
  const lastMessage = history.length > 0 ? history[history.length - 1] : null;
  const characterMood = conversationContext.characterMoods[character.id] || 'calm';
  
  // If responding to a specific topic, try to find a relevant fallback
  if (lastMessage) {
    const messageText = lastMessage.text.toLowerCase();
    
    // Topic-based responses
    if (messageText.includes('weather') || messageText.includes('rain') || messageText.includes('sun')) {
      const weatherResponses = character.fallbackResponses.filter(response => 
        response.toLowerCase().includes('weather') || 
        response.toLowerCase().includes('rain') || 
        response.toLowerCase().includes('season')
      );
      if (weatherResponses.length > 0) {
        return weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
      }
    }
    
    if (messageText.includes('family') || messageText.includes('children') || messageText.includes('home')) {
      const familyResponses = character.fallbackResponses.filter(response => 
        response.toLowerCase().includes('family') || 
        response.toLowerCase().includes('children') || 
        response.toLowerCase().includes('home')
      );
      if (familyResponses.length > 0) {
        return familyResponses[Math.floor(Math.random() * familyResponses.length)];
      }
    }
    
    if (messageText.includes('work') || messageText.includes('job') || messageText.includes('office')) {
      const workResponses = character.fallbackResponses.filter(response => 
        response.toLowerCase().includes('work') || 
        response.toLowerCase().includes('job') || 
        response.toLowerCase().includes('office')
      );
      if (workResponses.length > 0) {
        return workResponses[Math.floor(Math.random() * workResponses.length)];
      }
    }
  }
  
  // Mood-based response selection
  let moodFilteredResponses = character.fallbackResponses;
  
  if (characterMood === 'happy') {
    moodFilteredResponses = character.fallbackResponses.filter(response => 
      response.includes('!') || response.toLowerCase().includes('good') || response.toLowerCase().includes('great')
    );
  } else if (characterMood === 'thoughtful') {
    moodFilteredResponses = character.fallbackResponses.filter(response => 
      response.toLowerCase().includes('think') || response.toLowerCase().includes('remember') || response.includes('?')
    );
  }
  
  // Default to random selection from filtered responses
  const finalResponses = moodFilteredResponses.length > 0 ? moodFilteredResponses : character.fallbackResponses;
  return finalResponses[Math.floor(Math.random() * finalResponses.length)];
}

// Enhanced system prompt with deeper character personality
function buildEnhancedSystemPrompt(character: Character): string {
  const currentMood = conversationContext.characterMoods[character.id] || 'calm';
  const moodContext = {
    happy: "You're feeling particularly cheerful and optimistic today.",
    thoughtful: "You're in a reflective and contemplative mood.",
    excited: "You're feeling energetic and enthusiastic about the conversation.",
    calm: "You're relaxed and enjoying the peaceful conversation."
  };
  
  return `${character.systemPrompt}

Current context: ${moodContext[currentMood]}

Conversation style guidelines:
- Use natural Malayalam-English mix typical of Kerala conversations
- Keep responses conversational and authentic to Kerala sit-out culture
- Reference local contexts, traditions, or experiences when appropriate
- Maintain your unique perspective while being engaging
- Use expressions like 'alle?', 'no?', 'eda', 'machane', 'mole' naturally
- Keep responses to 1-2 sentences maximum for natural flow

Remember: You're sitting in a traditional Kerala courtyard having a casual evening chat with friends and neighbors.`;
}

// Advanced conversation prompt with better context awareness
function buildAdvancedConversationPrompt(character: Character, history: ConversationMessage[]): string {
  // Get extended context (last 5 messages instead of 3)
  const recentHistory = history.slice(-5);
  const formattedHistory = recentHistory
    .map(msg => `${msg.speakerName}: ${msg.text}`)
    .join('\n');
  
  // Analyze conversation context
  const lastSpeaker = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].speakerName : null;
  const isRespondingToSelf = lastSpeaker === character.name;
  const conversationLength = history.length;
  
  // Determine conversation stage
  let stageContext = "";
  if (conversationLength < 3) {
    stageContext = "This is early in the conversation - be welcoming and set a friendly tone.";
  } else if (conversationLength < 8) {
    stageContext = "The conversation is warming up - build on previous topics naturally.";
  } else {
    stageContext = "This is an ongoing conversation - deepen the discussion or introduce related topics.";
  }
  
  // Build context-aware prompt
  const contextPrompt = `Previous conversation:
${formattedHistory}

Response Context:
- You are ${character.name}
- ${lastSpeaker ? `You are responding to ${lastSpeaker}'s message` : 'You are continuing the conversation'}
- ${stageContext}
- Recent conversation topics: ${conversationContext.recentTopics.slice(0, 3).join(', ') || 'general chat'}
- ${isRespondingToSelf ? 'Avoid repeating yourself and add new insights' : 'Build upon what others have said'}

Your response should:
1. Feel natural and spontaneous
2. Reference or acknowledge previous messages when relevant
3. Stay true to your character's unique perspective
4. Add value to the ongoing conversation
5. Use appropriate Malayalam expressions naturally

Generate a authentic response that flows naturally from the conversation above.`;

  return contextPrompt;
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
  // Add null/undefined check for character
  if (!character) {
    console.error('Character is null or undefined');
    return "Sorry, I seem to be having trouble speaking right now. Let me get back to you in a moment!";
  }

  // Update conversation context
  updateConversationContext(character, conversationHistory);

  // Try to use API if we have working keys and rate limiting allows
  console.log(`🤖 Attempting to generate response for ${character.name}`);
  
  if (workingApiKeys.length === 0 || !shouldUseApiCall()) {
    console.log(`🤖 Using intelligent fallback response for ${character.name} (${workingApiKeys.length === 0 ? 'no working keys' : 'rate limited'})`);
    return getIntelligentFallback(character, conversationHistory);
  }

  // Try up to 3 different API keys before falling back
  let lastError: any = null;
  const maxKeyAttempts = Math.min(3, workingApiKeys.length);
  
  for (let attempt = 0; attempt < maxKeyAttempts; attempt++) {
    const currentKey = getCurrentApiKey();
    
    try {
      console.log(`🔄 Making API call for ${character.name} (attempt ${attempt + 1}/${maxKeyAttempts}) with key: ${currentKey.substring(0, 20)}...`);
      
      const attemptGoogle = createGoogleGenerativeAI({ apiKey: currentKey });
      const attemptModel = attemptGoogle('gemini-1.5-flash');
      
      const { text } = await generateText({
        model: attemptModel,
        system: buildEnhancedSystemPrompt(character),
        prompt: buildAdvancedConversationPrompt(character, conversationHistory),
        temperature: 0.8,
        maxRetries: 1, // Single retry per key to fail fast
      });
      
      // Reset failed attempts on success
      failedAttempts = 0;
      
      console.log(`✅ API response received for ${character.name}: "${text.substring(0, 50)}..." (key: ${currentKey.substring(0, 20)}...)`);
      return text.trim();
      
    } catch (error: any) {
      lastError = error;
      console.log(`❌ API call failed for ${character.name} with key ${currentKey.substring(0, 20)}...: ${error?.message?.substring(0, 50) || 'Unknown error'}`);
      
      // Mark this key as potentially problematic if it's a key-specific error
      if (error?.message?.includes('API key') || error?.message?.includes('invalid') || error?.message?.includes('unauthorized')) {
        keyTestResults[currentKey] = { 
          working: false, 
          lastTested: new Date(), 
          errorMessage: error?.message 
        };
        // Remove from working keys
        workingApiKeys = workingApiKeys.filter(key => key !== currentKey);
        console.log(`🚫 Removed problematic key: ${currentKey.substring(0, 20)}... (${workingApiKeys.length} keys remaining)`);
      }
      
      // If it's a rate limit, don't try other keys
      if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
        console.log(`⚠️ Rate limit hit, switching to fallbacks`);
        break;
      }
    }
  }
  
  // All keys failed, increment failed attempts and use fallback
  failedAttempts++;
  
  console.error(`❌ All API attempts failed for ${character.name}:`, lastError?.message);
  console.log(`🔄 Working keys remaining: ${workingApiKeys.length}/${apiKeys.length}`);
  
  // Return intelligent fallback based on conversation context
  return getIntelligentFallback(character, conversationHistory);
}

export async function startConversation(): Promise<string> {
  console.log('🤖 Attempting to start conversation with enhanced AI...');
  
  // Reset conversation context for fresh start
  conversationContext = {
    recentTopics: [],
    characterMoods: {},
    lastInteraction: new Date()
  };
  
  if (workingApiKeys.length === 0 || !shouldUseApiCall()) {
    console.log(`🤖 Using enhanced fallback response for conversation start (${workingApiKeys.length === 0 ? 'no working keys' : 'rate limited'})`);
    return getConversationStarter();
  }

  // Try up to 3 different API keys for conversation start
  let lastError: any = null;
  const maxKeyAttempts = Math.min(3, workingApiKeys.length);
  
  for (let attempt = 0; attempt < maxKeyAttempts; attempt++) {
    const currentKey = getCurrentApiKey();
    
    try {
      console.log(`🔄 Making API call to start conversation (attempt ${attempt + 1}/${maxKeyAttempts}) with key: ${currentKey.substring(0, 20)}...`);
      
      const attemptGoogle = createGoogleGenerativeAI({ apiKey: currentKey });
      const attemptModel = attemptGoogle('gemini-1.5-flash');
      
      const { text } = await generateText({
        model: attemptModel,
        system: `You are starting a casual conversation in a Kerala sit-out setting. You're one of the local community members who loves to chat in the evening. Be friendly, welcoming, and authentic to Kerala culture.`,
        prompt: buildConversationStarterPrompt(),
        temperature: 0.9, // Higher temperature for more creative conversation starters
        maxRetries: 1,
      });
      
      // Reset failed attempts on success
      failedAttempts = 0;
      
      console.log(`✅ Conversation started successfully: "${text.substring(0, 50)}..." (key: ${currentKey.substring(0, 20)}...)`);
      return text.trim();
      
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Conversation start failed with key ${currentKey.substring(0, 20)}...: ${error?.message?.substring(0, 50) || 'Unknown error'}`);
      
      // Mark this key as potentially problematic if it's a key-specific error
      if (error?.message?.includes('API key') || error?.message?.includes('invalid') || error?.message?.includes('unauthorized')) {
        keyTestResults[currentKey] = { 
          working: false, 
          lastTested: new Date(), 
          errorMessage: error?.message 
        };
        // Remove from working keys
        workingApiKeys = workingApiKeys.filter(key => key !== currentKey);
        console.log(`🚫 Removed problematic key: ${currentKey.substring(0, 20)}... (${workingApiKeys.length} keys remaining)`);
      }
      
      // If it's a rate limit, don't try other keys
      if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
        console.log(`⚠️ Rate limit hit during conversation start, switching to fallbacks`);
        break;
      }
    }
  }
  
  // All keys failed, increment failed attempts
  failedAttempts++;
  
  console.error(`❌ All conversation start attempts failed:`, lastError?.message);
  console.log(`🔄 Working keys remaining: ${workingApiKeys.length}/${apiKeys.length}`);
  
  // Return intelligent conversation starter
  return getConversationStarter();
}

// Enhanced conversation starter with variety and context awareness
function getConversationStarter(): string {
  const currentHour = new Date().getHours();
  const isAfternoon = currentHour >= 12 && currentHour < 17;
  const isMorning = currentHour >= 6 && currentHour < 12;
  
  let timeBasedStarters: string[] = [];
  
  if (isMorning) {
    timeBasedStarters = [
      "Good morning, everyone! Perfect weather for our morning chat, alle?",
      "Namaskaram! Early morning is the best time for good conversation, no?",
      "What a beautiful morning! Birds are singing, and the air is so fresh, eda!",
      "Morning time is thinking time, they say. What's on everyone's mind today?"
    ];
  } else if (isAfternoon) {
    timeBasedStarters = [
      "Good afternoon, kuttikale! Perfect time to take a break and chat, no?",
      "Eda, this afternoon breeze is so nice! Come, let's sit and talk.",
      "Lunch time is over, chat time begins! How is everyone doing?",
      "Afternoon conversations hit different, alle? More relaxed and peaceful."
    ];
  } else {
    timeBasedStarters = [
      "Namaskaram! How is everyone today? Beautiful evening we're having, alle?",
      "Good evening, kuttikale! Perfect time for a nice chat, no?",
      "Eda, what a lovely evening to sit outside and talk! Come, come, sit here.",
      "Ayyo, finally some time to relax and chat with good friends!",
      "This is what I call the perfect Kerala evening - good weather, good company!",
      "Evening time is story time! Anyone have something interesting to share?",
      "Look at this beautiful sunset! Perfect backdrop for our evening chat, alle?"
    ];
  }
  
  // Add some variety with general starters
  const generalStarters = [
    "Eda, it's been too long since we all sat together like this! How is everyone?",
    "You know what? There's nothing better than good friends and good conversation!",
    "Sitting here reminds me of the old days when neighbors actually talked to each other, no?",
    "Community time is the best time! What's happening in everyone's world?",
    "This kind of peaceful moment is exactly what we need more of, alle?"
  ];
  
  const allStarters = [...timeBasedStarters, ...generalStarters];
  return allStarters[Math.floor(Math.random() * allStarters.length)];
}

// Build context-aware prompt for conversation starters
function buildConversationStarterPrompt(): string {
  const currentTime = new Date();
  const timeOfDay = currentTime.getHours() >= 17 ? 'evening' : 
                   currentTime.getHours() >= 12 ? 'afternoon' : 'morning';
  
  return `Generate a natural conversation starter for a Kerala sit-out setting during ${timeOfDay} time.

Context:
- You're a friendly Kerala local starting an evening chat
- This is a traditional community gathering space
- Mix Malayalam expressions naturally with English
- Keep it warm, welcoming, and culturally authentic
- Reference the time of day, weather, or community naturally
- Use expressions like 'alle?', 'no?', 'eda', 'machane', 'kuttikale' appropriately

Generate a single, natural conversation starter (1-2 sentences) that would feel authentic in this setting.`;
}
