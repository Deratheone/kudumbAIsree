/**
 * TTS Test Page Component
 * Simple UI for testing Text-to-Speech functionality
 */

import React, { useState } from 'react';
import { ttsService } from '../services/textToSpeechService';
import type { TTSOptions } from '../services/textToSpeechService';

export const TTSTestPage: React.FC = () => {
  const [testText, setTestText] = useState("ഹലോ, ഇത് മലയാളത്തിൽ ഒരു ടെസ്റ്റ് മെസേജാണ്.");
  const [language, setLanguage] = useState<'malayalam' | 'hindi' | 'english'>('malayalam');
  const [character, setCharacter] = useState('babu');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testSamples = {
    malayalam: "ഹലോ, എല്ലാവരും എങ്ങനെയുണ്ട്? ഇന്നു നല്ല കാലാവസ്ഥയാണല്ലേ?",
    hindi: "नमस्ते सभी, आप कैसे हैं? आज मौसम कितना अच्छा है!",
    english: "Hello everyone, how are you all doing today? The weather is quite nice!"
  };

  const handleTest = async () => {
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      console.log('🧪 Testing TTS with:', { testText, language, character });
      
      const options: TTSOptions = { language };
      const audioUrl = await ttsService.generateSpeech(testText, character, options);
      
      setResult(`✅ Success! Audio generated successfully. Length: ${audioUrl.length} characters`);
      
      // Auto-play the audio
      await ttsService.playAudio(audioUrl);
      
    } catch (err: any) {
      console.error('TTS Test Error:', err);
      setError(`❌ Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (lang: keyof typeof testSamples) => {
    setTestText(testSamples[lang]);
    setLanguage(lang);
  };

  const cacheInfo = ttsService.getCacheInfo();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '2px solid #ccc',
      borderRadius: '8px',
      maxWidth: '400px',
      zIndex: 1000,
      fontSize: '14px'
    }}>
      <h3>🧪 TTS Test Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>API Status:</strong>
        <div>API Key: {cacheInfo.hasApiKey ? '✅' : '❌'}</div>
        <div>Audio: {cacheInfo.audioContext ? '✅' : '❌'}</div>
        <div>Cache: {cacheInfo.cacheSize} items</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Language:</label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as any)}
          style={{ marginLeft: '5px', width: '100px' }}
        >
          <option value="malayalam">Malayalam</option>
          <option value="hindi">Hindi</option>
          <option value="english">English</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Character:</label>
        <select 
          value={character} 
          onChange={(e) => setCharacter(e.target.value)}
          style={{ marginLeft: '5px', width: '100px' }}
        >
          <option value="babu">Babu</option>
          <option value="aliyamma">Aliyamma</option>
          <option value="mary">Mary</option>
          <option value="chakko">Chakko</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div>Sample Texts:</div>
        <button onClick={() => loadSample('malayalam')}>ML</button>
        <button onClick={() => loadSample('hindi')} style={{ marginLeft: '5px' }}>HI</button>
        <button onClick={() => loadSample('english')} style={{ marginLeft: '5px' }}>EN</button>
      </div>

      <textarea
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
        placeholder="Enter text to test..."
        rows={3}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      <button 
        onClick={handleTest} 
        disabled={isLoading || !testText.trim()}
        style={{ 
          width: '100%', 
          padding: '8px', 
          marginBottom: '10px',
          background: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        {isLoading ? '⏳ Testing...' : '🔊 Test TTS'}
      </button>

      {result && (
        <div style={{ background: '#d4edda', padding: '8px', borderRadius: '4px', marginBottom: '10px' }}>
          {result}
        </div>
      )}

      {error && (
        <div style={{ background: '#f8d7da', padding: '8px', borderRadius: '4px', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <button 
        onClick={() => ttsService.clearCache()}
        style={{ fontSize: '12px', padding: '4px 8px' }}
      >
        Clear Cache
      </button>
    </div>
  );
};

export default TTSTestPage;
