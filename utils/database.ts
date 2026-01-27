import type { Verse, Language } from '../types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_VERSION_KEY = '@custom_version';

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
  'darby': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/darby.txt',
  'DarbyR': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/DarbyR.txt',
  'KJV': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/KJV.txt',
  'TR1894': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/TR1894.txt',
  'TR1550': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/TR1550.txt',
  'WHNU': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/WHNU.txt',
  'grm': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/grm.txt',
  'WLC': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/WLC.txt',
  'heb': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/heb.txt',
};

const FALLBACK_BIBLE_URLS: Record<Language, string> = {
  'ITADIO': 'https://timprojects.online/bible-verse-memo/books/ITADIO.txt',
  'CEI': 'https://timprojects.online/bible-verse-memo/books/CEI.txt',
  'RVA': 'https://timprojects.online/bible-verse-memo/books/RVA.txt',
  'spavbl': 'https://timprojects.online/bible-verse-memo/books/spavbl.txt',
  'ELB71': 'https://timprojects.online/bible-verse-memo/books/ELB71.txt',
  'ELB': 'https://timprojects.online/bible-verse-memo/books/ELB.txt',
  'LUTH1545': 'https://timprojects.online/bible-verse-memo/books/LUTH1545.txt',
  'deu1912': 'https://timprojects.online/bible-verse-memo/books/deu1912.txt',
  'deutkw': 'https://timprojects.online/bible-verse-memo/books/deutkw.txt',
  'VULGATE': 'https://timprojects.online/bible-verse-memo/books/VULGATE.txt',
  'FOB': 'https://timprojects.online/bible-verse-memo/books/FOB.txt',
  'LSG': 'https://timprojects.online/bible-verse-memo/books/LSG.txt',
  'darby': 'https://timprojects.online/bible-verse-memo/books/darby.txt',
  'DarbyR': 'https://timprojects.online/bible-verse-memo/books/DarbyR.txt',
  'KJV': 'https://timprojects.online/bible-verse-memo/books/KJV.txt',
  'TR1894': 'https://timprojects.online/bible-verse-memo/books/TR1894.txt',
  'TR1550': 'https://timprojects.online/bible-verse-memo/books/TR1550.txt',
  'WHNU': 'https://timprojects.online/bible-verse-memo/books/WHNU.txt',
  'grm': 'https://timprojects.online/bible-verse-memo/books/grm.txt',
  'WLC': 'https://timprojects.online/bible-verse-memo/books/WLC.txt',
  'heb': 'https://timprojects.online/bible-verse-memo/books/heb.txt',
};

interface BookData {
  book: string;
  bookName: string;
  chapters: number;
}

interface VerseData {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface ParsedBible {
  books: BookData[];
  verses: Map<string, VerseData[]>;
}

const bibleCache: Map<Language, ParsedBible> = new Map();

async function parseBibleFile(lang: Language): Promise<ParsedBible> {
  if (bibleCache.has(lang)) {
    return bibleCache.get(lang)!;
  }

  try {
    let text = '';
    
    if (lang.startsWith('CUSTOM_')) {
      console.log(`[Database] Loading custom version: ${lang}`);
      const customContent = await AsyncStorage.getItem(CUSTOM_VERSION_KEY);
      if (!customContent) {
        throw new Error('Custom version content not found');
      }
      text = customContent;
    } else {
      const url = BIBLE_URLS[lang];
      if (!url) {
        throw new Error(`No URL configured for language: ${lang}`);
      }
      
      let response: Response | null = null;
      
      try {
        console.log(`[Database] Downloading ${lang}.txt from GitHub...`);
        response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        text = await response.text();
      } catch (primaryError) {
        console.error(`[Database] Primary source failed:`, primaryError);
        console.log(`[Database] Trying fallback source...`);
        
        const fallbackUrl = FALLBACK_BIBLE_URLS[lang];
        if (fallbackUrl) {
          try {
            response = await fetch(fallbackUrl);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            text = await response.text();
            console.log(`[Database] Successfully loaded from fallback source`);
          } catch (fallbackError) {
            console.error(`[Database] Fallback source also failed:`, fallbackError);
            throw new Error(`Failed to fetch from both primary and fallback sources`);
          }
        } else {
          throw primaryError;
        }
      }
    }
    console.log(`[Database] Downloaded ${text.length} characters`);
    console.log(`[Database] First 500 chars:`, text.substring(0, 500));
    
    const lines = text.split('\n');
    console.log(`[Database] Total lines: ${lines.length}`);
    const books: BookData[] = [];
    const verses: Map<string, VerseData[]> = new Map();
    
    let currentBook = '';
    let maxChapter = 0;
    const bookChapters: Map<string, number> = new Map();
    const bookNames: Map<string, string> = new Map();
    let matchedLines = 0;
    let skippedLines = 0;
    let lastNonVerseLine = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let match = line.match(/^(.+?)\.(\d+):(\d+)\s+(.*)$/);
      
      if (!match) {
        match = line.match(/^([^\d]+?)\s+(\d+):(\d+)\s+(.*)$/);
      }
      
      if (!match) {
        match = line.match(/^(.+?)\s+(\d+):(\d+)\s+(.*)$/);
      }
      
      if (!match) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1];
          const verseParts = lastPart.match(/^(\d+):(\d+)$/);
          if (verseParts) {
            const bookName = parts.slice(0, -1).join(' ');
            const restOfLine = '';
            match = [line, bookName, verseParts[1], verseParts[2], restOfLine];
          }
        }
      }
      
      if (!match) {
        const colonMatch = line.match(/(\d+):(\d+)/);
        if (colonMatch) {
          const colonIndex = line.indexOf(colonMatch[0]);
          const bookName = line.substring(0, colonIndex).trim();
          const chapter = colonMatch[1];
          const verse = colonMatch[2];
          const afterColon = line.substring(colonIndex + colonMatch[0].length).trim();
          match = [line, bookName, chapter, verse, afterColon];
        }
      }
      
      if (match) {
        matchedLines++;
        const bookAbbrev = match[1].trim();
        const chapter = parseInt(match[2]);
        const verseNum = parseInt(match[3]);
        const verseText = match[4].trim();
        
        if (matchedLines <= 3) {
          console.log(`[Database] Line ${i} matched:`, { bookAbbrev, chapter, verseNum, textPreview: verseText.substring(0, 50) });
        }
        
        const bookId = bookAbbrev.toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        if (bookId !== currentBook) {
          if (currentBook) {
            bookChapters.set(currentBook, maxChapter);
          }
          currentBook = bookId;
          
          if (chapter === 1 && verseNum === 1 && lastNonVerseLine) {
            bookNames.set(bookId, lastNonVerseLine);
            console.log(`[Database] Found book: ${bookId} -> "${lastNonVerseLine}"`);
          } else {
            bookNames.set(bookId, bookAbbrev);
          }
          
          maxChapter = 0;
        }
        
        if (chapter > maxChapter) {
          maxChapter = chapter;
        }
        
        const cacheKey = `${bookId}-${chapter}`;
        if (!verses.has(cacheKey)) {
          verses.set(cacheKey, []);
        }
        
        verses.get(cacheKey)!.push({
          book: bookId,
          chapter,
          verse: verseNum,
          text: verseText,
        });
      } else {
        skippedLines++;
        if (skippedLines <= 10) {
          console.log(`[Database] Line ${i} skipped (no match):`, JSON.stringify(line.substring(0, 150)));
        }
        lastNonVerseLine = line;
      }
    }
    
    if (currentBook) {
      bookChapters.set(currentBook, maxChapter);
    }
    
    bookChapters.forEach((chapters, bookId) => {
      const bookName = bookNames.get(bookId) || bookId;
      
      books.push({
        book: bookId,
        bookName: bookName,
        chapters,
      });
    });
    
    console.log(`[Database] Parsing complete:`);
    console.log(`  - Matched lines: ${matchedLines}`);
    console.log(`  - Skipped lines: ${skippedLines}`);
    console.log(`  - Books found: ${books.length}`);
    console.log(`  - Chapters cached: ${verses.size}`);
    console.log(`  - Book list:`, books.map(b => `${b.book}(${b.chapters}ch)`).join(', '));
    
    if (books.length === 0) {
      console.error('[Database] WARNING: No books were parsed!');
    }
    
    const parsed = { books, verses };
    bibleCache.set(lang, parsed);
    return parsed;
  } catch (error) {
    console.error('[Database] Error parsing Bible file:', error);
    throw error;
  }
}

async function fetchBooks(lang: Language): Promise<BookData[]> {
  const bible = await parseBibleFile(lang);
  return bible.books;
}

async function fetchVerses(lang: Language, book: string, chapter: number): Promise<VerseData[]> {
  const bible = await parseBibleFile(lang);
  const cacheKey = `${book}-${chapter}`;
  return bible.verses.get(cacheKey) || [];
}

export async function getBooks(lang: Language): Promise<string[]> {
  const books = await fetchBooks(lang);
  return books.map(book => book.book);
}

export async function getChapters(lang: Language, book: string): Promise<number[]> {
  const books = await fetchBooks(lang);
  const bookData = books.find(b => b.book === book);
  
  if (!bookData) {
    throw new Error(`Book ${book} not found`);
  }
  
  return Array.from({ length: bookData.chapters }, (_, i) => i + 1);
}

export async function getVerses(lang: Language, book: string, chapter: number): Promise<Verse[]> {
  const verses = await fetchVerses(lang, book, chapter);
  return verses;
}

export async function getVerse(lang: Language, book: string, chapter: number, verseNum: number): Promise<Verse | null> {
  const verses = await fetchVerses(lang, book, chapter);
  const verse = verses.find(v => v.verse === verseNum);
  return verse || null;
}

export async function getRandomVerse(lang: Language): Promise<Verse | null> {
  const books = await fetchBooks(lang);
  
  if (books.length === 0) {
    return null;
  }
  
  const randomBook = books[Math.floor(Math.random() * books.length)];
  const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
  
  const verses = await fetchVerses(lang, randomBook.book, randomChapter);
  
  if (verses.length === 0) {
    return null;
  }
  
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  return randomVerse;
}

export async function getBookName(lang: Language, book: string): Promise<string> {
  const books = await fetchBooks(lang);
  const bookData = books.find(b => b.book === book);
  return bookData?.bookName || book;
}

const NEW_TESTAMENT_PATTERNS = [
  'matt', 'matth', 'matthieu', 'mateo', 'matteo',
  'marc', 'mark', 'marcos', 'marco',
  'luc', 'luke', 'lucas', 'luca',
  'jean', 'john', 'juan', 'giovanni', 'joh',
  'act', 'actes', 'hechos', 'atti',
  'rom', 'romains', 'romanos', 'romani',
  'cor', 'corinth', 'corintios', 'corinzi',
  'gal', 'galat',
  'eph', 'ephes', 'efes',
  'phil', 'philip', 'filipenses', 'filippesi',
  'col', 'coloss',
  'thess', 'tesal', 'tessalon',
  'tim', 'timoth', 'timoteo',
  'tit', 'tite', 'tito',
  'philem', 'filem',
  'heb', 'hebr', 'hebreux', 'ebrei',
  'jacq', 'jam', 'james', 'santiago', 'giacomo',
  'pier', 'pet', 'pedro', 'pietro',
  'jude', 'judas', 'giuda',
  'apoc', 'rev', 'revel', 'apocal', 'apocalypse',
];

function isNewTestamentBook(bookId: string): boolean {
  const normalized = bookId.toLowerCase();
  return NEW_TESTAMENT_PATTERNS.some(pattern => normalized.includes(pattern));
}

export async function getRandomNewTestamentVerse(lang: Language): Promise<Verse | null> {
  const books = await fetchBooks(lang);
  
  const ntBooks = books.filter(b => isNewTestamentBook(b.book));
  
  if (ntBooks.length === 0) {
    console.log('[Database] No NT books found, falling back to all books');
    return getRandomVerse(lang);
  }
  
  console.log('[Database] NT books found:', ntBooks.map(b => b.book).join(', '));
  
  const randomBook = ntBooks[Math.floor(Math.random() * ntBooks.length)];
  const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
  
  const verses = await fetchVerses(lang, randomBook.book, randomChapter);
  
  if (verses.length === 0) {
    return null;
  }
  
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  return randomVerse;
}

export async function getRandomOldTestamentVerse(lang: Language): Promise<Verse | null> {
  const books = await fetchBooks(lang);
  
  const otBooks = books.filter(b => !isNewTestamentBook(b.book));
  
  if (otBooks.length === 0) {
    console.log('[Database] No OT books found, falling back to all books');
    return getRandomVerse(lang);
  }
  
  console.log('[Database] OT books found:', otBooks.map(b => b.book).join(', '));
  
  const randomBook = otBooks[Math.floor(Math.random() * otBooks.length)];
  const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
  
  const verses = await fetchVerses(lang, randomBook.book, randomChapter);
  
  if (verses.length === 0) {
    return null;
  }
  
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  return randomVerse;
}
