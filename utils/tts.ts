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

export async function getAvailableVoices(): Promise<TTSVoice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    console.log('[TTS] Available voices:', voices.length);
    return voices.map(v => ({
      identifier: v.identifier,
      name: v.name,
      language: v.language,
    }));
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
    console.log('[TTS] Voices for language', languageCode, ':', filteredVoices.length);
    return filteredVoices;
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
