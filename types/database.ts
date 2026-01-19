export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface VerseProgress {
  book: string;
  chapter: number;
  verse: number;
  attempts: number;
  correctGuesses: number;
  lastPracticed: string;
  completed: boolean;
  started: boolean;
  masteryLevel: number;
  memorized?: boolean;
}

export type LearningMode = 'guess-verse' | 'guess-reference';
export type Language = string;

export interface BibleVersion {
  ref: string;
  name: string;
  language: string;
  langId: string;
  publisher: string;
  apiUrl: string;
  copyrightInfo?: string;
}
export type Theme = 'light' | 'dark';

export interface DyslexiaSettings {
  enabled: boolean;
  fontSize: number;
  lineHeight: number;
  tolerantValidation: boolean;
}

export interface LineByLineSettings {
  enabled: boolean;
}
