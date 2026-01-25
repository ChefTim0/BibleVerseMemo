import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import type { Language, LearningMode, VerseProgress, Theme, DyslexiaSettings, LineByLineSettings, AppearanceSettings, LearningSettings, TTSSettings } from '../types/database';

interface AppState {
  language: Language;
  uiLanguage: string;
  learningMode: LearningMode;
  theme: Theme;
  progress: VerseProgress[];
  dyslexiaSettings: DyslexiaSettings;
  lineByLineSettings: LineByLineSettings;
  appearanceSettings: AppearanceSettings;
  learningSettings: LearningSettings;
  ttsSettings: TTSSettings;
  setLanguage: (language: Language) => Promise<void>;
  setLearningMode: (mode: LearningMode) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setDyslexiaSettings: (settings: Partial<DyslexiaSettings>) => Promise<void>;
  setLineByLineSettings: (settings: Partial<LineByLineSettings>) => Promise<void>;
  setAppearanceSettings: (settings: Partial<AppearanceSettings>) => Promise<void>;
  setLearningSettings: (settings: Partial<LearningSettings>) => Promise<void>;
  setTTSSettings: (settings: Partial<TTSSettings>) => Promise<void>;
  getVerseProgress: (book: string, chapter: number, verse: number) => VerseProgress | undefined;
  updateProgress: (progress: VerseProgress) => Promise<void>;
  resetVerseProgress: (book: string, chapter: number, verse: number) => Promise<void>;
  toggleMemorized: (book: string, chapter: number, verse: number) => Promise<void>;
  isLoading: boolean;
}

const LANGUAGE_KEY = '@language';
const LEARNING_MODE_KEY = '@learning_mode';
const THEME_KEY = '@theme';
const PROGRESS_KEY = '@verse_progress';
const DYSLEXIA_KEY = '@dyslexia_settings';
const LINE_BY_LINE_KEY = '@line_by_line_settings';
const APPEARANCE_KEY = '@appearance_settings';
const LEARNING_SETTINGS_KEY = '@learning_settings';
const TTS_SETTINGS_KEY = '@tts_settings';

function getUILanguage(bibleVersion: Language): string {
  const mapping: Record<string, string> = {
    'LSG': 'fr',
    'FOB': 'fr',
    'KJV': 'en',
    'ITADIO': 'it',
    'CEI': 'it',
    'RVA': 'es',
    'spavbl': 'es',
    'ELB71': 'de',
    'ELB': 'de',
    'LUTH1545': 'de',
    'deu1912': 'de',
    'deutkw': 'de',
    'VULGATE': 'en',
    'TR1894': 'en',
    'TR1550': 'en',
    'WHNU': 'en',
    'grm': 'en',
    'WLC': 'en',
    'heb': 'en',
  };
  return mapping[bibleVersion] || 'en';
}

export const [AppProvider, useApp] = createContextHook<AppState>(() => {
  const [language, setLanguageState] = useState<Language>('LSG');
  const [learningMode, setLearningModeState] = useState<LearningMode>('guess-verse');
  const [theme, setThemeState] = useState<Theme>('light');
  const [progress, setProgress] = useState<VerseProgress[]>([]);
  const [dyslexiaSettings, setDyslexiaSettingsState] = useState<DyslexiaSettings>({
    enabled: false,
    fontSize: 18,
    lineHeight: 32,
    wordSpacing: 0,
    validationTolerance: 0.8,
  });
  const [lineByLineSettings, setLineByLineSettingsState] = useState<LineByLineSettings>({
    enabled: false,
    wordsPerLine: 5,
  });
  const [appearanceSettings, setAppearanceSettingsState] = useState<AppearanceSettings>({
    fontSize: 16,
    animationsEnabled: true,
    showStartupVerse: true,
  });
  const [learningSettings, setLearningSettingsState] = useState<LearningSettings>({
    autoAdvance: false,
    showHints: true,
    maxHints: 10,
    autoMarkMemorized: true,
    autoMarkThreshold: 5,
    hapticFeedback: true,
    maxMasteryLevel: 5,
  });
  const [ttsSettings, setTTSSettingsState] = useState<TTSSettings>({
    speed: 'normal',
    voiceIdentifier: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const uiLanguage = getUILanguage(language);

  useEffect(() => {
    loadSettings();
  }, []);



  const loadSettings = async () => {
    try {
      const [savedLanguage, savedMode, savedTheme, savedProgress, savedDyslexia, savedLineByLine, savedAppearance, savedLearning, savedTTS] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_KEY),
        AsyncStorage.getItem(LEARNING_MODE_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(DYSLEXIA_KEY),
        AsyncStorage.getItem(LINE_BY_LINE_KEY),
        AsyncStorage.getItem(APPEARANCE_KEY),
        AsyncStorage.getItem(LEARNING_SETTINGS_KEY),
        AsyncStorage.getItem(TTS_SETTINGS_KEY),
      ]);

      if (savedLanguage) setLanguageState(savedLanguage as Language);
      if (savedMode) setLearningModeState(savedMode as LearningMode);
      if (savedTheme) setThemeState(savedTheme as Theme);
      if (savedProgress) setProgress(JSON.parse(savedProgress));
      if (savedDyslexia) setDyslexiaSettingsState(JSON.parse(savedDyslexia));
      if (savedLineByLine) setLineByLineSettingsState(JSON.parse(savedLineByLine));
      if (savedAppearance) setAppearanceSettingsState(JSON.parse(savedAppearance));
      if (savedLearning) setLearningSettingsState(JSON.parse(savedLearning));
      if (savedTTS) setTTSSettingsState(JSON.parse(savedTTS));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  const setLearningMode = async (mode: LearningMode) => {
    setLearningModeState(mode);
    await AsyncStorage.setItem(LEARNING_MODE_KEY, mode);
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  };

  const setDyslexiaSettings = async (settings: Partial<DyslexiaSettings>) => {
    const newSettings = { ...dyslexiaSettings, ...settings };
    setDyslexiaSettingsState(newSettings);
    await AsyncStorage.setItem(DYSLEXIA_KEY, JSON.stringify(newSettings));
  };

  const setLineByLineSettings = async (settings: Partial<LineByLineSettings>) => {
    const newSettings = { ...lineByLineSettings, ...settings };
    setLineByLineSettingsState(newSettings);
    await AsyncStorage.setItem(LINE_BY_LINE_KEY, JSON.stringify(newSettings));
  };

  const setAppearanceSettings = async (settings: Partial<AppearanceSettings>) => {
    const newSettings = { ...appearanceSettings, ...settings };
    setAppearanceSettingsState(newSettings);
    await AsyncStorage.setItem(APPEARANCE_KEY, JSON.stringify(newSettings));
  };

  const setLearningSettings = async (settings: Partial<LearningSettings>) => {
    const newSettings = { ...learningSettings, ...settings };
    setLearningSettingsState(newSettings);
    await AsyncStorage.setItem(LEARNING_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const setTTSSettings = async (settings: Partial<TTSSettings>) => {
    const newSettings = { ...ttsSettings, ...settings };
    setTTSSettingsState(newSettings);
    await AsyncStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const getVerseProgress = (book: string, chapter: number, verse: number) => {
    return progress.find(
      p => p.book === book && p.chapter === chapter && p.verse === verse
    );
  };

  const updateProgress = async (verseProgress: VerseProgress) => {
    const existingIndex = progress.findIndex(
      p => p.book === verseProgress.book && 
           p.chapter === verseProgress.chapter && 
           p.verse === verseProgress.verse
    );

    let newProgress: VerseProgress[];
    if (existingIndex >= 0) {
      newProgress = [...progress];
      newProgress[existingIndex] = verseProgress;
    } else {
      newProgress = [...progress, verseProgress];
    }

    setProgress(newProgress);
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  };

  const resetVerseProgress = async (book: string, chapter: number, verse: number) => {
    const newProgress = progress.filter(
      p => !(p.book === book && p.chapter === chapter && p.verse === verse)
    );
    setProgress(newProgress);
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  };

  const toggleMemorized = async (book: string, chapter: number, verse: number) => {
    const existingProgress = getVerseProgress(book, chapter, verse);
    const newMemorizedState = !existingProgress?.memorized;

    const verseProgress: VerseProgress = existingProgress ? {
      ...existingProgress,
      memorized: newMemorizedState,
    } : {
      book,
      chapter,
      verse,
      attempts: 0,
      correctGuesses: 0,
      lastPracticed: new Date().toISOString(),
      completed: false,
      started: false,
      masteryLevel: 0,
      memorized: newMemorizedState,
    };

    await updateProgress(verseProgress);
  };

  return {
    language,
    uiLanguage,
    learningMode,
    theme,
    progress,
    dyslexiaSettings,
    lineByLineSettings,
    appearanceSettings,
    learningSettings,
    ttsSettings,
    setLanguage,
    setLearningMode,
    setTheme,
    setDyslexiaSettings,
    setLineByLineSettings,
    setAppearanceSettings,
    setLearningSettings,
    setTTSSettings,
    getVerseProgress,
    updateProgress,
    resetVerseProgress,
    toggleMemorized,
    isLoading,
  };
});
