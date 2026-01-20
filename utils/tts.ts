import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import type { TTSVoice } from '../types/database';

export type TTSSpeed = 'slow' | 'normal' | 'fast';

const SPEED_VALUES: Record<TTSSpeed, number> = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.3,
};

const LANGUAGE_CODES: Record<string, string> = {
  'LSG': 'fr-FR',
  'FOB': 'fr-FR',
  'KJV': 'en-US',
  'ITADIO': 'it-IT',
  'CEI': 'it-IT',
  'RVA': 'es-ES',
  'spavbl': 'es-ES',
  'ELB71': 'de-DE',
  'ELB': 'de-DE',
  'LUTH1545': 'de-DE',
  'deu1912': 'de-DE',
  'deutkw': 'de-DE',
  'VULGATE': 'la',
  'TR1894': 'el-GR',
  'TR1550': 'el-GR',
  'WHNU': 'el-GR',
  'grm': 'el-GR',
  'WLC': 'he-IL',
  'heb': 'he-IL',
  'en': 'en-US',
  'fr': 'fr-FR',
  'fr-fob': 'fr-FR',
  'es': 'es-ES',
  'pt': 'pt-BR',
  'de': 'de-DE',
  'it': 'it-IT',
  'el': 'el-GR',
  'he': 'he-IL',
};

export function getLanguageCode(bibleVersion: string): string {
  return LANGUAGE_CODES[bibleVersion] || 'en-US';
}

function detectGender(voiceName: string, identifier: string): 'male' | 'female' | 'unknown' {
  const name = (voiceName + ' ' + identifier).toLowerCase();
  
  const femaleIndicators = ['female', 'woman', 'girl', 'feminine', 
    'hortense', 'julie', 'amelie', 'marie', 'anna', 'sara', 'karen', 'moira', 'fiona', 'samantha',
    'zira', 'hazel', 'susan', 'linda', 'catherine', 'alice', 'elena', 'monica', 'lucia', 'paulina',
    'sabina', 'helena', 'ioana', 'carmit', 'milena', 'tessa', 'melina', 'yelda', 'damayanti',
    'lekha', 'mariska', 'ting-ting', 'sin-ji', 'mei-jia', 'kyoko', 'yuna', 'zosia'];
  
  const maleIndicators = ['male', 'man', 'boy', 'masculine',
    'paul', 'thomas', 'david', 'daniel', 'mark', 'james', 'george', 'alex', 'luca', 'jorge',
    'diego', 'juan', 'rishi', 'maged', 'yuri', 'xander', 'aaron', 'fred', 'ralph', 'bruce'];
  
  for (const indicator of femaleIndicators) {
    if (name.includes(indicator)) return 'female';
  }
  
  for (const indicator of maleIndicators) {
    if (name.includes(indicator)) return 'male';
  }
  
  return 'unknown';
}

export async function getAvailableVoices(): Promise<TTSVoice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    console.log('[TTS] Raw voices count:', voices.length);
    
    const mappedVoices = voices
      .filter(v => v.identifier && v.language)
      .map((v, index) => {
        const displayName = v.name || v.identifier || `Voice ${index + 1}`;
        const gender = detectGender(displayName, v.identifier);
        return {
          identifier: v.identifier || `voice-${index}`,
          name: displayName,
          language: v.language,
          gender,
        };
      });
    
    console.log('[TTS] Mapped voices:', mappedVoices.length);
    return mappedVoices;
  } catch (error) {
    console.error('[TTS] Failed to get voices:', error);
    return [];
  }
}

export async function getVoicesForLanguage(languageCode: string): Promise<TTSVoice[]> {
  try {
    const allVoices = await getAvailableVoices();
    const langPrefix = languageCode.split('-')[0].toLowerCase();
    
    const filteredVoices = allVoices.filter(v => {
      const voiceLang = v.language.toLowerCase();
      return voiceLang.startsWith(langPrefix) || voiceLang.includes(langPrefix);
    });
    
    const femaleVoices = filteredVoices.filter(v => v.gender === 'female');
    const maleVoices = filteredVoices.filter(v => v.gender === 'male');
    const unknownVoices = filteredVoices.filter(v => v.gender === 'unknown');
    
    const selectedVoices: TTSVoice[] = [];
    
    if (femaleVoices.length > 0) {
      selectedVoices.push(femaleVoices[0]);
    }
    if (maleVoices.length > 0) {
      selectedVoices.push(maleVoices[0]);
    }
    
    if (selectedVoices.length < 2 && unknownVoices.length > 0) {
      const needed = 2 - selectedVoices.length;
      selectedVoices.push(...unknownVoices.slice(0, needed));
    }
    
    if (selectedVoices.length === 0 && filteredVoices.length > 0) {
      selectedVoices.push(...filteredVoices.slice(0, 2));
    }
    
    console.log('[TTS] Selected voices for', languageCode, ':', selectedVoices.map(v => `${v.name} (${v.gender})`));
    return selectedVoices;
  } catch (error) {
    console.error('[TTS] Failed to filter voices:', error);
    return [];
  }
}

export function getSpeedValue(speed: TTSSpeed): number {
  return SPEED_VALUES[speed];
}

let isSpeakingGlobal = false;

export async function speak(
  text: string,
  options: {
    language: string;
    speed: TTSSpeed;
    voiceIdentifier?: string;
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<void> {
  try {
    if (isSpeakingGlobal) {
      await stop();
    }

    const languageCode = getLanguageCode(options.language);
    const rate = getSpeedValue(options.speed);

    console.log('[TTS] Speaking text with language:', languageCode, 'speed:', options.speed, 'voice:', options.voiceIdentifier || 'default');

    isSpeakingGlobal = true;

    const speechOptions: Speech.SpeechOptions = {
      language: languageCode,
      rate,
      pitch: 1.0,
      onStart: () => {
        console.log('[TTS] Started speaking');
        options.onStart?.();
      },
      onDone: () => {
        console.log('[TTS] Finished speaking');
        isSpeakingGlobal = false;
        options.onDone?.();
      },
      onError: (error) => {
        console.error('[TTS] Error:', error);
        isSpeakingGlobal = false;
        options.onError?.(new Error(String(error)));
      },
      onStopped: () => {
        console.log('[TTS] Stopped');
        isSpeakingGlobal = false;
        options.onDone?.();
      },
    };

    if (options.voiceIdentifier && Platform.OS !== 'web') {
      speechOptions.voice = options.voiceIdentifier;
    }

    Speech.speak(text, speechOptions);
  } catch (error) {
    console.error('[TTS] Failed to speak:', error);
    isSpeakingGlobal = false;
    options.onError?.(error as Error);
  }
}

export async function stop(): Promise<void> {
  try {
    await Speech.stop();
    isSpeakingGlobal = false;
    console.log('[TTS] Stopped all speech');
  } catch (error) {
    console.error('[TTS] Failed to stop:', error);
  }
}

export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('[TTS] Failed to check speaking status:', error);
    return false;
  }
}

export async function checkTTSAvailability(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return 'speechSynthesis' in window;
    }
    return true;
  } catch (error) {
    console.error('[TTS] Availability check failed:', error);
    return false;
  }
}
