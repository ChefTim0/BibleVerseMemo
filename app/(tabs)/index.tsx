import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Shuffle, RefreshCw } from "lucide-react-native";
import { useApp } from "../../contexts/AppContext";
import { getBooks, getRandomVerse, getBookName } from "../../utils/database";
import { t } from "../../constants/translations";
import { getColors } from "../../constants/colors";



export default function BooksScreen() {
  const { language, uiLanguage, theme } = useApp();
  const colors = getColors(theme);
  const router = useRouter();
  const [books, setBooks] = useState<string[]>([]);
  const [bookNames, setBookNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[BooksScreen] Loading books for language:', language);
      const booksList = await getBooks(language);
      console.log('[BooksScreen] Books loaded:', booksList.length, booksList);
      setBooks(booksList);
      
      const names: Record<string, string> = {};
      for (const bookId of booksList) {
        const name = await getBookName(language, bookId);
        console.log('[BooksScreen] Book name:', bookId, '->', name);
        names[bookId] = name;
      }
      console.log('[BooksScreen] All book names loaded:', names);
      setBookNames(names);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BooksScreen] Error loading books:', errorMessage, error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleBookPress = (book: string) => {
    console.log('[BooksScreen] Navigating to book:', book);
    router.push({ pathname: '/book/[book]', params: { book } });
  };

  const handleRandomVerse = async () => {
    try {
      const verse = await getRandomVerse(language);
      if (verse) {
        router.push({ 
          pathname: '/learn/[book]/[chapter]/[verse]', 
          params: { 
            book: verse.book, 
            chapter: verse.chapter.toString(), 
            verse: verse.verse.toString() 
          } 
        });
      }
    } catch (error) {
      console.error('Error getting random verse:', error);
    }
  };



  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'books')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Bible data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'books')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Failed to load Bible data</Text>
          <Text style={[styles.errorDetails, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadBooks}
            activeOpacity={0.7}
          >
            <RefreshCw color="#FFFFFF" size={20} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'books')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'selectBook')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.randomButton, { backgroundColor: colors.primary }]}
            onPress={handleRandomVerse}
            activeOpacity={0.7}
          >
            <Shuffle color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bookCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleBookPress(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.bookName, { color: colors.text }]}>{bookNames[item] || item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  randomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  errorDetails: {
    fontSize: 14,
    textAlign: "center" as const,
  },
  retryButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  bookCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookName: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
});
