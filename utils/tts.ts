import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import type { TTSVoice } from '../types/database';

const BUILT_IN_VOICES: TTSVoice[] = [
  // French
  { identifier: 'fr-FR-female', name: 'Voix française (Femme)', language: 'fr-FR', gender: 'female' },
  { identifier: 'fr-FR-male', name: 'Voix française (Homme)', language: 'fr-FR', gender: 'male' },
  // English
  { identifier: 'en-US-female', name: 'English Voice (Female)', language: 'en-US', gender: 'female' },
  { identifier: 'en-US-male', name: 'English Voice (Male)', language: 'en-US', gender: 'male' },
  // Spanish
  { identifier: 'es-ES-female', name: 'Voz española (Mujer)', language: 'es-ES', gender: 'female' },
  { identifier: 'es-ES-male', name: 'Voz española (Hombre)', language: 'es-ES', gender: 'male' },
  // German
  { identifier: 'de-DE-female', name: 'Deutsche Stimme (Frau)', language: 'de-DE', gender: 'female' },
  { identifier: 'de-DE-male', name: 'Deutsche Stimme (Mann)', language: 'de-DE', gender: 'male' },
  // Italian
  { identifier: 'it-IT-female', name: 'Voce italiana (Donna)', language: 'it-IT', gender: 'female' },
  { identifier: 'it-IT-male', name: 'Voce italiana (Uomo)', language: 'it-IT', gender: 'male' },
  // Greek
  { identifier: 'el-GR-female', name: 'Ελληνική φωνή (Γυναίκα)', language: 'el-GR', gender: 'female' },
  { identifier: 'el-GR-male', name: 'Ελληνική φωνή (Άνδρας)', language: 'el-GR', gender: 'male' },
  // Hebrew
  { identifier: 'he-IL-female', name: 'קול עברי (אישה)', language: 'he-IL', gender: 'female' },
  { identifier: 'he-IL-male', name: 'קול עברי (גבר)', language: 'he-IL', gender: 'male' },
  // Latin (fallback to Italian)
  { identifier: 'la-VA-female', name: 'Vox Latina (Femina)', language: 'la', gender: 'female' },
  { identifier: 'la-VA-male', name: 'Vox Latina (Vir)', language: 'la', gender: 'male' },
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
    'virginie', 'celine', 'audrey', 'amelie', 'claire', 'denise', 'renee', 'genevieve', 'marguerite',
    'nathalie', 'sylvie', 'veronique', 'sophie', 'isabelle', 'camille', 'lea', 'emma', 'chloe',
    'aurelie', 'juliette', 'charlotte', 'manon', 'sarah', 'laura', 'marine', 'oceane', 'mathilde',
    'victoria', 'elizabeth', 'emily', 'emma', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'abigail',
    'harper', 'evelyn', 'aria', 'scarlett', 'grace', 'chloe', 'penelope', 'riley', 'layla', 'zoey'];
  
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
  return BUILT_IN_VOICES.filter(v => {
    const voiceLang = v.language.toLowerCase();
    return voiceLang.startsWith(langPrefix) || voiceLang.includes(langPrefix);
  });
}

export async function getVoicesForLanguage(languageCode: string): Promise<TTSVoice[]> {
  const langPrefix = languageCode.split('-')[0].toLowerCase();
  
  try {
    const systemVoices = await Speech.getAvailableVoicesAsync();
    console.log('[TTS] System voices count:', systemVoices.length);
    
    const filteredVoices = systemVoices
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
    
    console.log('[TTS] Filtered voices for', languageCode, ':', filteredVoices.length);
    
    if (filteredVoices.length > 0) {
      return filteredVoices;
    }
  } catch (error) {
    console.error('[TTS] Failed to get system voices:', error);
  }
  
  const builtInVoices = getBuiltInVoicesForLanguage(languageCode);
  console.log('[TTS] Falling back to built-in voices:', builtInVoices.length);
  return builtInVoices;
}

export function isBuiltInVoice(identifier: string): boolean {
  return BUILT_IN_VOICES.some(v => v.identifier === identifier);
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
      if (!isBuiltInVoice(options.voiceIdentifier)) {
        speechOptions.voice = options.voiceIdentifier;
      }
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
