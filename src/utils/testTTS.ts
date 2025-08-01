/**
 * Sarvam AI API Test Script
 * Test the Text-to-Speech functionality locally
 */

import { ttsService } from '../services/textToSpeechService';

// Test function for Sarvam AI TTS
export async function testSarvamAI() {
  console.log('🧪 Testing Sarvam AI Text-to-Speech...');
  
  const testCases = [
    {
      text: "Hello, this is a test message in English.",
      character: "babu",
      language: "english" as const
    },
    {
      text: "नमस्ते, यह हिंदी में एक परीक्षण संदेश है।",
      character: "aliyamma", 
      language: "hindi" as const
    },
    {
      text: "ഹലോ, ഇത് മലയാളത്തിൽ ഒരു ടെസ്റ്റ് മെസേജാണ്।",
      character: "mary",
      language: "malayalam" as const
    }
  ];

  for (const test of testCases) {
    try {
      console.log(`\n🔊 Testing ${test.language} with character ${test.character}:`);
      console.log(`Text: ${test.text}`);
      
      const audioUrl = await ttsService.generateSpeech(
        test.text,
        test.character,
        { language: test.language }
      );
      
      console.log(`✅ Success! Audio URL generated: ${audioUrl.substring(0, 50)}...`);
      
      // Optional: Auto-play the audio
      // await ttsService.playAudio(audioUrl);
      
    } catch (error: any) {
      console.error(`❌ Failed for ${test.language}:`, error?.message || error);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test cache and service info
  const cacheInfo = ttsService.getCacheInfo();
  console.log('\n📊 Service Status:');
  console.log(`- API Key: ${cacheInfo.hasApiKey ? 'Connected' : 'Missing'}`);
  console.log(`- Audio Context: ${cacheInfo.audioContext ? 'Ready' : 'Not Available'}`);
  console.log(`- Cache Size: ${cacheInfo.cacheSize} items`);
}

// Manual test functions for browser console
(window as any).testSarvamAI = testSarvamAI;
(window as any).ttsService = ttsService;

console.log('🔧 TTS Test functions loaded!');
console.log('Run testSarvamAI() in console to test the API');
console.log('Or use ttsService.speak("your text", "character") directly');
