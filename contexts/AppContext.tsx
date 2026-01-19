import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Language, LearningMode, VerseProgress, Theme, DyslexiaSettings, LineByLineSettings } from '../types/database';
import { useAuth } from './AuthContext';
import { loadProgressFromSupabase, updateVerseProgressInSupabase } from '../lib/supabase-sync';
import { USE_SUPABASE } from '../constants/features';

interface AppState {
  language: Language;
  uiLanguage: string;
  learningMode: LearningMode;
  theme: Theme;
  progress: VerseProgress[];
  dyslexiaSettings: DyslexiaSettings;
  lineByLineSettings: LineByLineSettings;
  setLanguage: (language: Language) => Promise<void>;
  setLearningMode: (mode: LearningMode) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setDyslexiaSettings: (settings: Partial<DyslexiaSettings>) => Promise<void>;
  setLineByLineSettings: (settings: Partial<LineByLineSettings>) => Promise<void>;
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

function getUILanguage(bibleVersion: Language): string {
  const mapping: Record<string, string> = {
    'LSG': 'fr',
    'FOB': 'fr',
    'KJV': 'en',
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
    tolerantValidation: true,
  });
  const [lineByLineSettings, setLineByLineSettingsState] = useState<LineByLineSettings>({
    enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasSynced = useRef(false);
  
  const uiLanguage = getUILanguage(language);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const syncLocalProgressToSupabase = useCallback(async (userId: string) => {
    if (!USE_SUPABASE) {
      console.log('[Sync] Supabase disabled - skipping sync');
      return;
    }

    try {
      console.log('[Sync] Starting sync for user:', userId);
      
      const storedProgress = await AsyncStorage.getItem(PROGRESS_KEY);
      const localProgress: VerseProgress[] = storedProgress ? JSON.parse(storedProgress) : [];
      console.log('[Sync] Local progress count:', localProgress.length);
      
      const remoteProgress = await loadProgressFromSupabase(userId);
      console.log('[Sync] Remote progress count:', remoteProgress.length);
      
      const mergedProgress: VerseProgress[] = [];
      const progressMap = new Map<string, VerseProgress>();
      
      localProgress.forEach(p => {
        const key = `${p.book}-${p.chapter}-${p.verse}`;
        progressMap.set(key, p);
      });
      
      remoteProgress.forEach(p => {
        const key = `${p.book}-${p.chapter}-${p.verse}`;
        const existing = progressMap.get(key);
        
        if (!existing) {
          progressMap.set(key, p);
        } else {
          progressMap.set(key, {
            book: p.book,
            chapter: p.chapter,
            verse: p.verse,
            attempts: Math.max(existing.attempts, p.attempts),
            correctGuesses: Math.max(existing.correctGuesses, p.correctGuesses),
            lastPracticed: existing.lastPracticed > p.lastPracticed ? existing.lastPracticed : p.lastPracticed,
            completed: existing.completed || p.completed,
            started: existing.started || p.started,
            masteryLevel: Math.max(existing.masteryLevel, p.masteryLevel),
            memorized: existing.memorized || p.memorized,
          });
        }
      });
      
      progressMap.forEach(p => mergedProgress.push(p));
      console.log('[Sync] Merged progress count:', mergedProgress.length);
      
      if (mergedProgress.length > 0) {
        for (const p of mergedProgress) {
          await updateVerseProgressInSupabase(p, userId);
        }
        console.log('[Sync] All progress synced to Supabase');
      }
      
      setProgress(mergedProgress);
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(mergedProgress));
    } catch (error) {
      console.error('[Sync] Error syncing progress:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id && !hasSynced.current) {
      hasSynced.current = true;
      syncLocalProgressToSupabase(user.id);
    }
    
    if (!isAuthenticated) {
      hasSynced.current = false;
    }
  }, [isAuthenticated, user?.id, syncLocalProgressToSupabase]);

  const loadSettings = async () => {
    try {
      const [savedLanguage, savedMode, savedTheme, savedProgress, savedDyslexia, savedLineByLine] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_KEY),
        AsyncStorage.getItem(LEARNING_MODE_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(DYSLEXIA_KEY),
        AsyncStorage.getItem(LINE_BY_LINE_KEY),
      ]);

      if (savedLanguage) setLanguageState(savedLanguage as Language);
      if (savedMode) setLearningModeState(savedMode as LearningMode);
      if (savedTheme) setThemeState(savedTheme as Theme);
      if (savedProgress) setProgress(JSON.parse(savedProgress));
      if (savedDyslexia) setDyslexiaSettingsState(JSON.parse(savedDyslexia));
      if (savedLineByLine) setLineByLineSettingsState(JSON.parse(savedLineByLine));
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

    if (USE_SUPABASE && isAuthenticated && user?.id) {
      try {
        await updateVerseProgressInSupabase(verseProgress, user.id);
      } catch (error) {
        console.error('Failed to sync progress to Supabase:', error);
      }
    }
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
    setLanguage,
    setLearningMode,
    setTheme,
    setDyslexiaSettings,
    setLineByLineSettings,
    getVerseProgress,
    updateProgress,
    resetVerseProgress,
    toggleMemorized,
    isLoading,
  };
});
