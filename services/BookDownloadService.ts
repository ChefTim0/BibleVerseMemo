import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../types/database';

const DOWNLOADED_BOOKS_KEY = '@downloaded_books';
const DOWNLOAD_TIMESTAMP_KEY = '@download_timestamp';

export interface DownloadProgress {
  language: Language;
  progress: number;
  total: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

const BIBLE_URLS: Record<Language, string> = {
  'ITADIO': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/ITADIO.txt',
  'CEI': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/CEI.txt',
  'RVA': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/RVA.txt',
  'spavbl': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/spavbl.txt',
  'ELB71': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/ELB71.txt',
  'ELB': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/ELB.txt',
  'LUTH1545': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/LUTH1545.txt',
  'deu1912': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/deu1912.txt',
  'deutkw': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/deutkw.txt',
  'VULGATE': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/VULGATE.txt',
  'FOB': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/FOB.txt',
  'LSG': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/LSG.txt',
  'KJV': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/KJV.txt',
  'TR1894': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/TR1894.txt',
  'TR1550': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/TR1550.txt',
  'WHNU': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/WHNU.txt',
  'grm': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/grm.txt',
  'WLC': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/WLC.txt',
  'heb': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/heb.txt',
};

export async function isBookDownloaded(language: Language): Promise<boolean> {
  try {
    const downloaded = await AsyncStorage.getItem(DOWNLOADED_BOOKS_KEY);
    if (!downloaded) return false;
    
    const downloadedBooks: Language[] = JSON.parse(downloaded);
    return downloadedBooks.includes(language);
  } catch (error) {
    console.error('[BookDownload] Error checking download status:', error);
    return false;
  }
}

export async function areAnyBooksDownloaded(): Promise<boolean> {
  try {
    const downloaded = await AsyncStorage.getItem(DOWNLOADED_BOOKS_KEY);
    if (!downloaded) return false;
    
    const downloadedBooks: Language[] = JSON.parse(downloaded);
    return downloadedBooks.length > 0;
  } catch (error) {
    console.error('[BookDownload] Error checking downloads:', error);
    return false;
  }
}

export async function downloadBook(
  language: Language,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  console.log(`[BookDownload] Starting download for ${language}`);
  
  try {
    const url = BIBLE_URLS[language];
    if (!url) {
      throw new Error(`No URL configured for language: ${language}`);
    }

    onProgress?.({
      language,
      progress: 0,
      total: 100,
      status: 'downloading',
    });

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    
    if (!text || text.length < 1000) {
      throw new Error('Downloaded content is too small or empty');
    }

    console.log(`[BookDownload] Downloaded ${text.length} characters for ${language}`);

    onProgress?.({
      language,
      progress: 50,
      total: 100,
      status: 'downloading',
    });

    const storageKey = `@bible_${language}`;
    await AsyncStorage.setItem(storageKey, text);

    const downloaded = await AsyncStorage.getItem(DOWNLOADED_BOOKS_KEY);
    const downloadedBooks: Language[] = downloaded ? JSON.parse(downloaded) : [];
    
    if (!downloadedBooks.includes(language)) {
      downloadedBooks.push(language);
      await AsyncStorage.setItem(DOWNLOADED_BOOKS_KEY, JSON.stringify(downloadedBooks));
    }

    await AsyncStorage.setItem(DOWNLOAD_TIMESTAMP_KEY, new Date().toISOString());

    onProgress?.({
      language,
      progress: 100,
      total: 100,
      status: 'completed',
    });

    console.log(`[BookDownload] Successfully downloaded and stored ${language}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BookDownload] Error downloading ${language}:`, errorMessage);
    
    onProgress?.({
      language,
      progress: 0,
      total: 100,
      status: 'failed',
      error: errorMessage,
    });
    
    throw error;
  }
}

export async function downloadMultipleBooks(
  languages: Language[],
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  for (const language of languages) {
    await downloadBook(language, onProgress);
  }
}

export async function getDownloadedBooks(): Promise<Language[]> {
  try {
    const downloaded = await AsyncStorage.getItem(DOWNLOADED_BOOKS_KEY);
    if (!downloaded) return [];
    
    return JSON.parse(downloaded);
  } catch (error) {
    console.error('[BookDownload] Error getting downloaded books:', error);
    return [];
  }
}

export async function clearDownloadedBooks(): Promise<void> {
  try {
    const downloadedBooks = await getDownloadedBooks();
    
    for (const language of downloadedBooks) {
      const storageKey = `@bible_${language}`;
      await AsyncStorage.removeItem(storageKey);
    }
    
    await AsyncStorage.removeItem(DOWNLOADED_BOOKS_KEY);
    await AsyncStorage.removeItem(DOWNLOAD_TIMESTAMP_KEY);
    
    console.log('[BookDownload] All downloaded books cleared');
  } catch (error) {
    console.error('[BookDownload] Error clearing downloaded books:', error);
    throw error;
  }
}
