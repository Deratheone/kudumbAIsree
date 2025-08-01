/**
 * API Integration Test
 * Run this file to test the API integration
 */

import { generateCharacterResponse } from '../src/services/aiService.js';
import { characters } from '../src/data/characters.js';

async function testAPIIntegration() {
  console.log('🧪 Testing API Integration...\n');
  
  // Test environment variable loading
  console.log('1. Environment Variables:');
  console.log(`   VITE_GOOGLE_API_KEY: ${process.env.VITE_GOOGLE_API_KEY ? '✅ Set' : '❌ Not set'}`);
  
  // Test character data consistency
  console.log('\n2. Character Data Consistency:');
  Object.values(characters).forEach(character => {
    const hasAllProps = character.id && character.name && character.fallbackResponses;
    console.log(`   ${character.name}: ${hasAllProps ? '✅' : '❌'} Complete`);
    
    if (!character.fallbackResponses || character.fallbackResponses.length === 0) {
      console.log(`     ⚠️  Missing fallbackResponses array`);
    }
  });
  
  // Test API call
  console.log('\n3. API Call Test:');
  try {
    const testCharacter = characters.babu;
    const testHistory = [];
    
    console.log('   Making test API call...');
    const response = await generateCharacterResponse(testCharacter, testHistory);
    console.log(`   ✅ Response received: "${response.slice(0, 50)}..."`);
    
  } catch (error) {
    console.log(`   ❌ API call failed: ${error.message}`);
  }
  
  console.log('\n🏁 Test completed!');
}

testAPIIntegration().catch(console.error);
