/**
 * TTS Settings Panel Component
 * Allows users to configure text-to-speech preferences
 */

import React, { useState } from 'react';
import { ttsService } from '../services/textToSpeechService';
import type { TTSOptions } from '../services/textToSpeechService';

interface TTSSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TTSSettings: React.FC<TTSSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<TTSOptions>({
    language: 'malayalam',
    speed: 1.0,
    pitch: 0,
  });

  const [testText] = useState("വായിക്കാൻ കഴിയുമോ? ഇത് ഒരു ടെസ്റ്റ് മെസ്സേജാണ്.");

  const handleSettingChange = (key: keyof TTSOptions, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTestSpeech = async () => {
    try {
      await ttsService.speak(testText, 'babu', settings);
    } catch (error) {
      console.error('Test speech failed:', error);
    }
  };

  const handleClearCache = () => {
    ttsService.clearCache();
    alert('Audio cache cleared!');
  };

  const cacheInfo = ttsService.getCacheInfo();

  if (!isOpen) return null;

  return (
    <div className="tts-settings-overlay">
      <div className="tts-settings-panel">
        <div className="settings-header">
          <h3>🎤 Text-to-Speech Settings</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <label>Language:</label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
            >
              <option value="malayalam">Malayalam</option>
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Speed: {settings.speed}</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speed}
              onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-group">
            <label>Pitch: {settings.pitch}</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-actions">
            <button onClick={handleTestSpeech} className="test-btn">
              🔊 Test Voice
            </button>
            <button onClick={handleClearCache} className="clear-btn">
              🗑️ Clear Cache ({cacheInfo.cacheSize})
            </button>
          </div>

          <div className="tts-status">
            <p><strong>Status:</strong></p>
            <ul>
              <li>API Key: {cacheInfo.hasApiKey ? '✅ Connected' : '❌ Missing'}</li>
              <li>Audio Context: {cacheInfo.audioContext ? '✅ Ready' : '❌ Not Available'}</li>
              <li>Cache Size: {cacheInfo.cacheSize} items</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TTSSettings;
