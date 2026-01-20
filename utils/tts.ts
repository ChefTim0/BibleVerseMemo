import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

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

export function getSpeedValue(speed: TTSSpeed): number {
  return SPEED_VALUES[speed];
}

let isSpeakingGlobal = false;

export async function speak(
  text: string,
  options: {
    language: string;
    speed: TTSSpeed;
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

    console.log('[TTS] Speaking text with language:', languageCode, 'speed:', options.speed);

    isSpeakingGlobal = true;

    Speech.speak(text, {
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
    });
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
