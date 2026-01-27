import type { Verse, Language } from '../types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookNames as canonicalBookNames } from '../constants/translations';

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

function getStandardBookKey(bookId: string, bookAbbrev: string): string {
  const mappings: Record<string, string> = {
    'gen': 'Gen', 'genese': 'Gen', 'genesis': 'Gen', 'genesi': 'Gen',
    'exod': 'Exod', 'exode': 'Exod', 'exodus': 'Exod', 'esodo': 'Exod',
    'lev': 'Lev', 'levitique': 'Lev', 'leviticus': 'Lev', 'levitico': 'Lev',
    'num': 'Num', 'nombres': 'Num', 'numbers': 'Num', 'numeri': 'Num',
    'deut': 'Deut', 'deuteronome': 'Deut', 'deuteronomy': 'Deut', 'deuteronomio': 'Deut',
    'josh': 'Josh', 'josue': 'Josh', 'joshua': 'Josh', 'giosue': 'Josh',
    'judg': 'Judg', 'juges': 'Judg', 'judges': 'Judg', 'giudici': 'Judg',
    'ruth': 'Ruth', 'rut': 'Ruth',
    '1-sam': '1Sam', '1sam': '1Sam', '1-samuel': '1Sam', '1samuel': '1Sam', '1-samuele': '1Sam',
    '2-sam': '2Sam', '2sam': '2Sam', '2-samuel': '2Sam', '2samuel': '2Sam', '2-samuele': '2Sam',
    '1-kgs': '1Kgs', '1kgs': '1Kgs', '1-rois': '1Kgs', '1rois': '1Kgs', '1-re': '1Kgs', '1re': '1Kgs',
    '2-kgs': '2Kgs', '2kgs': '2Kgs', '2-rois': '2Kgs', '2rois': '2Kgs', '2-re': '2Kgs', '2re': '2Kgs',
    '1-chr': '1Chr', '1chr': '1Chr', '1-chroniques': '1Chr', '1chroniques': '1Chr', '1-cronache': '1Chr',
    '2-chr': '2Chr', '2chr': '2Chr', '2-chroniques': '2Chr', '2chroniques': '2Chr', '2-cronache': '2Chr',
    'ezra': 'Ezra', 'esdras': 'Ezra',
    'neh': 'Neh', 'nehemie': 'Neh', 'nehemiah': 'Neh', 'neemia': 'Neh',
    'esth': 'Esth', 'esther': 'Esth', 'ester': 'Esth',
    'job': 'Job', 'giobbe': 'Job',
    'ps': 'Ps', 'psaumes': 'Ps', 'psalms': 'Ps', 'salmi': 'Ps',
    'prov': 'Prov', 'proverbes': 'Prov', 'proverbs': 'Prov', 'proverbi': 'Prov',
    'eccl': 'Eccl', 'ecclesiaste': 'Eccl', 'ecclesiastes': 'Eccl',
    'song': 'Song', 'cantique': 'Song', 'cantique-des-cantiques': 'Song', 'cantico': 'Song',
    'isa': 'Isa', 'esaie': 'Isa', 'isaiah': 'Isa', 'isaia': 'Isa',
    'jer': 'Jer', 'jeremie': 'Jer', 'jeremiah': 'Jer', 'geremia': 'Jer',
    'lam': 'Lam', 'lamentations': 'Lam', 'lamentazioni': 'Lam',
    'ezek': 'Ezek', 'ezechiel': 'Ezek', 'ezekiel': 'Ezek', 'ezechiele': 'Ezek',
    'dan': 'Dan', 'daniel': 'Dan', 'daniele': 'Dan',
    'hos': 'Hos', 'osee': 'Hos', 'hosea': 'Hos', 'osea': 'Hos',
    'joel': 'Joel', 'gioele': 'Joel',
    'amos': 'Amos',
    'obad': 'Obad', 'abdias': 'Obad', 'obadiah': 'Obad', 'abdia': 'Obad',
    'jonah': 'Jonah', 'jonas': 'Jonah', 'giona': 'Jonah',
    'mic': 'Mic', 'michee': 'Mic', 'micah': 'Mic', 'michea': 'Mic',
    'nah': 'Nah', 'nahum': 'Nah', 'naum': 'Nah',
    'hab': 'Hab', 'habacuc': 'Hab', 'habakkuk': 'Hab', 'abacuc': 'Hab',
    'zeph': 'Zeph', 'sophonie': 'Zeph', 'zephaniah': 'Zeph', 'sofonia': 'Zeph',
    'hag': 'Hag', 'aggee': 'Hag', 'haggai': 'Hag', 'aggeo': 'Hag',
    'zech': 'Zech', 'zacharie': 'Zech', 'zechariah': 'Zech', 'zaccaria': 'Zech',
    'mal': 'Mal', 'malachie': 'Mal', 'malachi': 'Mal', 'malachia': 'Mal',
    'matt': 'Matt', 'matthieu': 'Matt', 'matthew': 'Matt', 'matteo': 'Matt',
    'mark': 'Mark', 'marc': 'Mark', 'marco': 'Mark',
    'luke': 'Luke', 'luc': 'Luke', 'luca': 'Luke',
    'john': 'John', 'jean': 'John', 'giovanni': 'John',
    'acts': 'Acts', 'actes': 'Acts', 'actes-des-apotres': 'Acts', 'atti': 'Acts',
    'rom': 'Rom', 'romains': 'Rom', 'romans': 'Rom', 'romani': 'Rom',
    '1-cor': '1Cor', '1cor': '1Cor', '1-corinthiens': '1Cor', '1corinthiens': '1Cor', '1-corinzi': '1Cor',
    '2-cor': '2Cor', '2cor': '2Cor', '2-corinthiens': '2Cor', '2corinthiens': '2Cor', '2-corinzi': '2Cor',
    'gal': 'Gal', 'galates': 'Gal', 'galatians': 'Gal', 'galati': 'Gal',
    'eph': 'Eph', 'ephesiens': 'Eph', 'ephesians': 'Eph', 'efesini': 'Eph',
    'phil': 'Phil', 'philippiens': 'Phil', 'philippians': 'Phil', 'filippesi': 'Phil',
    'col': 'Col', 'colossiens': 'Col', 'colossians': 'Col', 'colossesi': 'Col',
    '1-thess': '1Thess', '1thess': '1Thess', '1-thessaloniciens': '1Thess', '1thessaloniciens': '1Thess',
    '2-thess': '2Thess', '2thess': '2Thess', '2-thessaloniciens': '2Thess', '2thessaloniciens': '2Thess',
    '1-tim': '1Tim', '1tim': '1Tim', '1-timothee': '1Tim', '1timothee': '1Tim', '1-timoteo': '1Tim',
    '2-tim': '2Tim', '2tim': '2Tim', '2-timothee': '2Tim', '2timothee': '2Tim', '2-timoteo': '2Tim',
    'titus': 'Titus', 'tite': 'Titus', 'tito': 'Titus',
    'phlm': 'Phlm', 'philemon': 'Phlm', 'filemone': 'Phlm',
    'heb': 'Heb', 'hebreux': 'Heb', 'hebrews': 'Heb', 'ebrei': 'Heb',
    'jas': 'Jas', 'jacques': 'Jas', 'james': 'Jas', 'giacomo': 'Jas',
    '1-pet': '1Pet', '1pet': '1Pet', '1-pierre': '1Pet', '1pierre': '1Pet', '1-pietro': '1Pet',
    '2-pet': '2Pet', '2pet': '2Pet', '2-pierre': '2Pet', '2pierre': '2Pet', '2-pietro': '2Pet',
    '1-john': '1John', '1john': '1John', '1-jean': '1John', '1jean': '1John', '1-giovanni': '1John',
    '2-john': '2John', '2john': '2John', '2-jean': '2John', '2jean': '2John', '2-giovanni': '2John',
    '3-john': '3John', '3john': '3John', '3-jean': '3John', '3jean': '3John', '3-giovanni': '3John',
    'jude': 'Jude', 'giuda': 'Jude',
    'rev': 'Rev', 'apocalypse': 'Rev', 'revelation': 'Rev', 'apocalisse': 'Rev',
  };
  
  const normalized = bookId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return mappings[normalized] || bookAbbrev;
}

function getCanonicalBookName(standardKey: string): string | null {
  const frenchBooks = canonicalBookNames['fr'];
  return frenchBooks?.[standardKey] || null;
}

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
          
          const standardKey = getStandardBookKey(bookId, bookAbbrev);
          const canonicalName = getCanonicalBookName(standardKey);
          bookNames.set(bookId, canonicalName || bookAbbrev);
          console.log(`[Database] Found book: ${bookId} -> "${canonicalName || bookAbbrev}"`);
          
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
