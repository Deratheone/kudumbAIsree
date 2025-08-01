/**
 * Text-to-Speech Service using Browser's Web Speech API
 * Provides clear English voice synthesis for character responses
 */

// Voice configurations for different characters (Web Speech API)
// You can easily change these to customize character voices!

// Current Configuration: Proper Male/Female Voice Assignment
const VOICE_MAPPING = {
  'babu': { name: 'Google UK English Male', lang: 'en-GB', pitch: 1.1, rate: 0.9 },      // Male - Babu
  'aliyamma': { name: 'Google UK English Female', lang: 'en-GB', pitch: 0.9, rate: 0.8 }, // Female - Aliyamma  
  'mary': { name: 'Google US English Female', lang: 'en-US', pitch: 0.9, rate: 0.9 },     // Female - Mary
  'chakko': { name: 'Google UK English Male', lang: 'en-GB', pitch: 1.1, rate: 0.9 },     // Male - Chakko (same as Babu)
};

// Option 2: All US English with Microsoft Voices (Uncomment to use)
// const VOICE_MAPPING = {
//   'babu': { name: 'Microsoft David', lang: 'en-US', pitch: 0.8, rate: 0.9 },        // Male - Babu
//   'aliyamma': { name: 'Microsoft Zira', lang: 'en-US', pitch: 1.3, rate: 0.8 },    // Female - Aliyamma
//   'mary': { name: 'Microsoft Hazel', lang: 'en-US', pitch: 1.1, rate: 0.9 },       // Female - Mary
//   'chakko': { name: 'Microsoft Mark', lang: 'en-US', pitch: 0.9, rate: 1.1 },      // Male - Chakko
// };

// Option 3: Distinct Personality Voices (Uncomment to use)
// const VOICE_MAPPING = {
//   'babu': { name: 'Google UK English Male', lang: 'en-GB', pitch: 0.7, rate: 0.8 },      // Male - Deep, wise
//   'aliyamma': { name: 'Google UK English Female', lang: 'en-GB', pitch: 1.4, rate: 0.7 }, // Female - High, gentle
//   'mary': { name: 'Google US English Female', lang: 'en-US', pitch: 1.0, rate: 1.0 },     // Female - Normal
//   'chakko': { name: 'Google US English Male', lang: 'en-US', pitch: 1.2, rate: 1.2 },     // Male - Energetic
// };

// Option 4: Mixed Accents (Uncomment to use)
// const VOICE_MAPPING = {
//   'babu': { name: 'Google UK English Male', lang: 'en-GB', pitch: 0.9, rate: 0.9 },        // Male - British
//   'aliyamma': { name: 'Microsoft Hazel', lang: 'en-GB', pitch: 1.2, rate: 0.8 },          // Female - British
//   'mary': { name: 'Google US English Female', lang: 'en-US', pitch: 1.1, rate: 0.9 },     // Female - American
//   'chakko': { name: 'Microsoft James', lang: 'en-AU', pitch: 0.8, rate: 1.0 },            // Male - Australian
// };

export interface TTSOptions {
  voice?: string;
  language?: 'malayalam' | 'hindi' | 'english';
  speed?: number;
  pitch?: number;
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Load voices when they become available
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
      console.log('🎵 Available voices loaded:', this.voices.length);
    }
  }

  private findBestVoice(characterId: string): SpeechSynthesisVoice | null {
    const config = VOICE_MAPPING[characterId as keyof typeof VOICE_MAPPING];
    if (!config || this.voices.length === 0) {
      // Fallback to any English voice
      return this.voices.find(voice => voice.lang.startsWith('en')) || this.voices[0] || null;
    }

    console.log(`🔍 Looking for voice for ${characterId}:`, config);

    // Try to find by exact name match first
    let voice = this.voices.find(v => v.name === config.name);
    
    // If not found, try partial name matching with language
    if (!voice) {
      const nameKeywords = config.name.toLowerCase().split(' ');
      voice = this.voices.find(v => {
        const voiceName = v.name.toLowerCase();
        return v.lang === config.lang && nameKeywords.every(keyword => voiceName.includes(keyword));
      });
    }
    
    // Fallback to gender-based matching
    if (!voice) {
      const isFemale = config.name.toLowerCase().includes('female');
      voice = this.voices.find(v => 
        v.lang === config.lang && 
        (isFemale ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male'))
      );
    }
    
    // Final fallback to any voice with the right language
    if (!voice) {
      voice = this.voices.find(v => v.lang === config.lang);
    }
    
    console.log(`🎤 Selected voice for ${characterId}:`, voice?.name, voice?.lang);
    return voice || this.voices[0] || null;
  }

  /**
   * Convert text to speech using Web Speech API
   */
  async generateSpeech(
    _text: string, 
    _characterId: string,
    _options: TTSOptions = {}
  ): Promise<string> {
    // For Web Speech API, we don't generate URLs, we speak directly
    return Promise.resolve('web-speech-api');
  }

  /**
   * Play the generated audio (not needed for Web Speech API)
   */
  async playAudio(_audioUrl: string): Promise<void> {
    // This method is kept for compatibility but not used
    return Promise.resolve();
  }

  /**
   * Stop currently playing audio
   */
  stopAudio(): void {
    if (this.synthesis && this.currentUtterance) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  /**
   * Generate and play speech in one call using Web Speech API
   */
  async speak(
    text: string, 
    characterId: string,
    options: TTSOptions = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.synthesis) {
          console.warn('⚠️ Web Speech API not supported');
          resolve(); // Don't throw error, just skip TTS
          return;
        }

        // Stop any currently playing speech
        this.stopAudio();

        console.log(`🔊 Speaking with Web Speech API for ${characterId}: ${text.substring(0, 50)}...`);

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.findBestVoice(characterId);
        const config = VOICE_MAPPING[characterId as keyof typeof VOICE_MAPPING];

        if (voice) {
          utterance.voice = voice;
          console.log(`🎤 Using voice: ${voice.name} (${voice.lang})`);
        }

        // Set voice parameters
        if (config) {
          utterance.pitch = options.pitch || config.pitch;
          utterance.rate = options.speed || config.rate;
        } else {
          utterance.pitch = options.pitch || 1.0;
          utterance.rate = options.speed || 0.9;
        }
        
        utterance.volume = 1.0;
        utterance.lang = config?.lang || 'en-US';

        utterance.onend = () => {
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          this.currentUtterance = null;
          resolve(); // Don't reject, just continue
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);

      } catch (error) {
        console.error('❌ Speech synthesis failed:', error);
        resolve(); // Don't reject, just continue without TTS
      }
    });
  }

  /**
   * Clear audio cache (not needed for Web Speech API)
   */
  clearCache(): void {
    console.log('🗑️ Cache clearing not needed for Web Speech API');
  }

  /**
   * Get all available voices for debugging/selection
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * List all available voices in console (for development)
   */
  listAvailableVoices(): void {
    console.log('🎵 Available voices:');
    this.voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.lang}) - Local: ${voice.localService ? 'Yes' : 'No'}`);
    });
    
    // Also show current mapping
    console.log('\n🎭 Current character voice mapping:');
    Object.entries(VOICE_MAPPING).forEach(([characterId, config]) => {
      const selectedVoice = this.findBestVoice(characterId);
      console.log(`${characterId}: ${config.name} → ${selectedVoice?.name || 'NOT FOUND'}`);
    });
  }

  /**
   * Test a specific voice (for development/testing)
   */
  async testVoice(voiceName: string, text: string = "Hello, this is a voice test"): Promise<void> {
    const voice = this.voices.find(v => v.name.includes(voiceName));
    if (!voice) {
      console.error(`Voice containing "${voiceName}" not found`);
      this.listAvailableVoices();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.pitch = 1.0;
    utterance.rate = 0.9;
    
    console.log(`🎤 Testing voice: ${voice.name} (${voice.lang})`);
    
    if (this.synthesis) {
      this.synthesis.speak(utterance);
    }
  }

  /**
   * Get cache status
   */
  getCacheInfo() {
    return {
      cacheSize: 0,
      hasApiKey: true, // Web Speech API doesn't need API key
      audioContext: !!this.synthesis,
      voicesLoaded: this.voices.length
    };
  }
}

// Export singleton instance
export const ttsService = new TextToSpeechService();
