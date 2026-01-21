import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import type { TTSVoice } from '../types/database';

interface BuiltInVoice {
  identifier: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  platform: 'ios' | 'android' | 'all';
}

const BUILT_IN_VOICES: BuiltInVoice[] = [
  // French voices - iOS
  { identifier: 'com.apple.voice.compact.fr-FR.Thomas', name: 'Thomas', language: 'fr-FR', gender: 'male', platform: 'ios' },
  { identifier: 'com.apple.voice.compact.fr-FR.Amelie', name: 'Amélie', language: 'fr-FR', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.ttsbundle.Thomas-compact', name: 'Thomas (Compact)', language: 'fr-FR', gender: 'male', platform: 'ios' },
  { identifier: 'com.apple.ttsbundle.Amelie-compact', name: 'Amélie (Compact)', language: 'fr-FR', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.voice.enhanced.fr-FR.Thomas', name: 'Thomas (Enhanced)', language: 'fr-FR', gender: 'male', platform: 'ios' },
  { identifier: 'com.apple.voice.enhanced.fr-FR.Amelie', name: 'Amélie (Enhanced)', language: 'fr-FR', gender: 'female', platform: 'ios' },
  // French voices - Android
  { identifier: 'fr-fr-x-vlf#male_1-local', name: 'Français Homme 1', language: 'fr-FR', gender: 'male', platform: 'android' },
  { identifier: 'fr-fr-x-vlf#female_1-local', name: 'Français Femme 1', language: 'fr-FR', gender: 'female', platform: 'android' },
  { identifier: 'fr-FR-language', name: 'Français Standard', language: 'fr-FR', gender: 'female', platform: 'android' },
  { identifier: 'fr_FR', name: 'Français (FR)', language: 'fr-FR', gender: 'female', platform: 'android' },
  
  // English voices - iOS
  { identifier: 'com.apple.voice.compact.en-US.Samantha', name: 'Samantha', language: 'en-US', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.voice.compact.en-GB.Daniel', name: 'Daniel', language: 'en-GB', gender: 'male', platform: 'ios' },
  { identifier: 'com.apple.ttsbundle.Samantha-compact', name: 'Samantha (Compact)', language: 'en-US', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.voice.enhanced.en-US.Samantha', name: 'Samantha (Enhanced)', language: 'en-US', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.voice.enhanced.en-GB.Daniel', name: 'Daniel (Enhanced)', language: 'en-GB', gender: 'male', platform: 'ios' },
  // English voices - Android
  { identifier: 'en-us-x-sfg#male_1-local', name: 'English Male 1', language: 'en-US', gender: 'male', platform: 'android' },
  { identifier: 'en-us-x-sfg#female_1-local', name: 'English Female 1', language: 'en-US', gender: 'female', platform: 'android' },
  { identifier: 'en-US-language', name: 'English US', language: 'en-US', gender: 'female', platform: 'android' },
  { identifier: 'en_US', name: 'English (US)', language: 'en-US', gender: 'female', platform: 'android' },
  
  // Spanish voices - iOS
  { identifier: 'com.apple.voice.compact.es-ES.Monica', name: 'Monica', language: 'es-ES', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.voice.compact.es-ES.Jorge', name: 'Jorge', language: 'es-ES', gender: 'male', platform: 'ios' },
  { identifier: 'com.apple.voice.enhanced.es-ES.Monica', name: 'Monica (Enhanced)', language: 'es-ES', gender: 'female', platform: 'ios' },
  // Spanish voices - Android
  { identifier: 'es-es-x-eef#male_1-local', name: 'Español Hombre', language: 'es-ES', gender: 'male', platform: 'android' },
  { identifier: 'es-es-x-eef#female_1-local', name: 'Español Mujer', language: 'es-ES', gender: 'female', platform: 'android' },
  { identifier: 'es_ES', name: 'Español (ES)', language: 'es-ES', gender: 'female', platform: 'android' },
  
  // German voices - iOS
  { identifier: 'com.apple.voice.compact.de-DE.Anna', name: 'Anna', language: 'de-DE', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.voice.enhanced.de-DE.Anna', name: 'Anna (Enhanced)', language: 'de-DE', gender: 'female', platform: 'ios' },
  // German voices - Android
  { identifier: 'de-de-x-deb#male_1-local', name: 'Deutsch Mann', language: 'de-DE', gender: 'male', platform: 'android' },
  { identifier: 'de-de-x-deb#female_1-local', name: 'Deutsch Frau', language: 'de-DE', gender: 'female', platform: 'android' },
  { identifier: 'de_DE', name: 'Deutsch (DE)', language: 'de-DE', gender: 'female', platform: 'android' },
  
  // Italian voices - iOS
  { identifier: 'com.apple.voice.compact.it-IT.Alice', name: 'Alice', language: 'it-IT', gender: 'female', platform: 'ios' },
  { identifier: 'com.apple.voice.enhanced.it-IT.Alice', name: 'Alice (Enhanced)', language: 'it-IT', gender: 'female', platform: 'ios' },
  // Italian voices - Android
  { identifier: 'it-it-x-itb#male_1-local', name: 'Italiano Uomo', language: 'it-IT', gender: 'male', platform: 'android' },
  { identifier: 'it-it-x-itb#female_1-local', name: 'Italiano Donna', language: 'it-IT', gender: 'female', platform: 'android' },
  { identifier: 'it_IT', name: 'Italiano (IT)', language: 'it-IT', gender: 'female', platform: 'android' },
];



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
  
  const femaleIndicators = ['female', 'woman', 'girl', 'feminine', 'fem',
    'hortense', 'julie', 'amelie', 'marie', 'anna', 'sara', 'karen', 'moira', 'fiona', 'samantha',
    'zira', 'hazel', 'susan', 'linda', 'catherine', 'alice', 'elena', 'monica', 'lucia', 'paulina',
    'sabina', 'helena', 'ioana', 'carmit', 'milena', 'tessa', 'melina', 'yelda', 'damayanti',
    'lekha', 'mariska', 'ting-ting', 'sin-ji', 'mei-jia', 'kyoko', 'yuna', 'zosia',
    'virginie', 'celine', 'audrey', 'claire', 'denise', 'renee', 'genevieve', 'marguerite',
    'nathalie', 'sylvie', 'veronique', 'sophie', 'isabelle', 'camille', 'lea', 'emma', 'chloe',
    'aurelie', 'juliette', 'charlotte', 'manon', 'sarah', 'laura', 'marine', 'oceane', 'mathilde',
    'victoria', 'elizabeth', 'emily', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'abigail',
    'harper', 'evelyn', 'aria', 'scarlett', 'grace', 'penelope', 'riley', 'layla', 'zoey'];
  
  const maleIndicators = ['male', 'man', 'boy', 'masculine',
    'paul', 'thomas', 'david', 'daniel', 'mark', 'james', 'george', 'alex', 'luca', 'jorge',
    'diego', 'juan', 'rishi', 'maged', 'yuri', 'xander', 'aaron', 'fred', 'ralph', 'bruce',
    'pierre', 'jean', 'jacques', 'francois', 'antoine', 'nicolas', 'sebastien', 'christophe',
    'philippe', 'guillaume', 'mathieu', 'olivier', 'alexandre', 'benoit', 'cedric', 'damien',
    'emmanuel', 'fabien', 'gilles', 'henri', 'julien', 'laurent', 'marc', 'michel', 'pascal',
    'romain', 'stephane', 'vincent', 'yves', 'william', 'john', 'michael', 'robert', 'richard',
    'joseph', 'charles', 'christopher', 'matthew', 'anthony', 'steven', 'kevin', 'brian', 'eric',
    'hans', 'stefan', 'markus', 'andreas', 'wolfgang', 'dieter', 'klaus', 'helmut', 'uwe'];
  
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



function getBuiltInVoicesForLanguage(languageCode: string): TTSVoice[] {
  const langPrefix = languageCode.split('-')[0].toLowerCase();
  const currentPlatform = Platform.OS === 'ios' ? 'ios' : 'android';
  
  return BUILT_IN_VOICES
    .filter(v => {
      const voiceLang = v.language.toLowerCase();
      const matchesLanguage = voiceLang.startsWith(langPrefix) || voiceLang.includes(langPrefix);
      const matchesPlatform = v.platform === currentPlatform || v.platform === 'all';
      return matchesLanguage && matchesPlatform;
    })
    .map(v => ({
      identifier: v.identifier,
      name: `${v.name} (${v.gender === 'male' ? '♂' : '♀'})`,
      language: v.language,
      gender: v.gender,
    }));
}

export async function getVoicesForLanguage(languageCode: string): Promise<TTSVoice[]> {
  const langPrefix = languageCode.split('-')[0].toLowerCase();
  
  try {
    const systemVoices = await Speech.getAvailableVoicesAsync();
    console.log('[TTS] System voices count:', systemVoices.length);
    
    const filteredSystemVoices = systemVoices
      .filter(v => {
        if (!v.identifier || !v.language) return false;
        const voiceLang = v.language.toLowerCase();
        return voiceLang.startsWith(langPrefix) || voiceLang.includes(langPrefix);
      })
      .map((v, index) => {
        const displayName = v.name || v.identifier || `Voice ${index + 1}`;
        const gender = detectGender(displayName, v.identifier);
        return {
          identifier: v.identifier,
          name: displayName,
          language: v.language,
          gender,
        };
      });
    
    console.log('[TTS] Filtered system voices for', languageCode, ':', filteredSystemVoices.length);
    
    // Get built-in voices for this language
    const builtInVoices = getBuiltInVoicesForLanguage(languageCode);
    console.log('[TTS] Built-in voices for', languageCode, ':', builtInVoices.length);
    
    // Combine system voices with built-in voices, avoiding duplicates
    const existingIdentifiers = new Set(filteredSystemVoices.map(v => v.identifier));
    const uniqueBuiltInVoices = builtInVoices.filter(v => !existingIdentifiers.has(v.identifier));
    
    const allVoices = [...filteredSystemVoices, ...uniqueBuiltInVoices];
    console.log('[TTS] Total voices available:', allVoices.length);
    
    return allVoices;
  } catch (error) {
    console.error('[TTS] Failed to get system voices:', error);
    // Return built-in voices as fallback
    const builtInVoices = getBuiltInVoicesForLanguage(languageCode);
    console.log('[TTS] Returning built-in voices as fallback:', builtInVoices.length);
    return builtInVoices;
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
