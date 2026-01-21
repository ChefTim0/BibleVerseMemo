import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Modal, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Shuffle, RefreshCw, X, BookOpen } from "lucide-react-native";
import { useApp } from "../../contexts/AppContext";
import { getBooks, getRandomVerse, getBookName, getRandomNewTestamentVerse, getRandomOldTestamentVerse } from "../../utils/database";
import { t } from "../../constants/translations";
import { getColors } from "../../constants/colors";
import type { Verse } from "../../types/database";




export default function BooksScreen() {
  const { language, uiLanguage, theme, appearanceSettings } = useApp();
  const colors = getColors(theme);
  const router = useRouter();
  const [books, setBooks] = useState<string[]>([]);
  const [bookNames, setBookNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);
  const [dailyVerseBookName, setDailyVerseBookName] = useState<string>('');
  const [showDailyVerse, setShowDailyVerse] = useState(false);
  const [showTestamentPicker, setShowTestamentPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pickerFadeAnim = useRef(new Animated.Value(0)).current;


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

  useEffect(() => {
    const loadDailyVerse = async () => {
      if (appearanceSettings.showStartupVerse === false) {
        console.log('[BooksScreen] Startup verse disabled in settings');
        return;
      }
      try {
        console.log('[BooksScreen] Loading daily NT verse...');
        const verse = await getRandomNewTestamentVerse(language);
        if (verse) {
          console.log('[BooksScreen] Daily verse loaded:', verse.book, verse.chapter, verse.verse);
          setDailyVerse(verse);
          const bookNameStr = await getBookName(language, verse.book);
          setDailyVerseBookName(bookNameStr);
          setShowDailyVerse(true);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } catch (err) {
        console.error('[BooksScreen] Error loading daily verse:', err);
      }
    };
    loadDailyVerse();
  }, [language, appearanceSettings.showStartupVerse]);

  const closeDailyVerse = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDailyVerse(false);
    });
  };

  const learnDailyVerse = () => {
    if (dailyVerse) {
      closeDailyVerse();
      setTimeout(() => {
        router.push({
          pathname: '/learn/[book]/[chapter]/[verse]',
          params: {
            book: dailyVerse.book,
            chapter: dailyVerse.chapter.toString(),
            verse: dailyVerse.verse.toString(),
          },
        });
      }, 250);
    }
  };

  const handleBookPress = (book: string) => {
    console.log('[BooksScreen] Navigating to book:', book);
    router.push({ pathname: '/book/[book]', params: { book } });
  };

  const openTestamentPicker = () => {
    setShowTestamentPicker(true);
    Animated.timing(pickerFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeTestamentPicker = () => {
    Animated.timing(pickerFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowTestamentPicker(false);
    });
  };

  const handleRandomVerseFromTestament = async (testament: 'old' | 'new') => {
    closeTestamentPicker();
    try {
      const verse = testament === 'old' 
        ? await getRandomOldTestamentVerse(language)
        : await getRandomNewTestamentVerse(language);
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
            onPress={openTestamentPicker}
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

      <Modal
        visible={showDailyVerse}
        transparent
        animationType="none"
        onRequestClose={closeDailyVerse}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeDailyVerse}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.cardBackground,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <BookOpen color={colors.primary} size={24} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t(uiLanguage, 'randomVerse')}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.background }]}
                onPress={closeDailyVerse}
                activeOpacity={0.7}
              >
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            {dailyVerse && (
              <View style={styles.verseContainer}>
                <Text style={[styles.verseReference, { color: colors.primary }]}>
                  {dailyVerseBookName} {dailyVerse.chapter}:{dailyVerse.verse}
                </Text>
                <Text style={[styles.verseText, { color: colors.text }]}>
                  "{dailyVerse.text}"
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={closeDailyVerse}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                  {t(uiLanguage, 'close')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={learnDailyVerse}
                activeOpacity={0.7}
              >
                <BookOpen color="#FFFFFF" size={18} />
                <Text style={styles.primaryButtonText}>
                  {t(uiLanguage, 'learnThisVerse')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal
        visible={showTestamentPicker}
        transparent
        animationType="none"
        onRequestClose={closeTestamentPicker}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: pickerFadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeTestamentPicker}
          />
          <Animated.View
            style={[
              styles.pickerContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              {t(uiLanguage, 'chooseTestament')}
            </Text>
            <TouchableOpacity
              style={[styles.testamentOption, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
              onPress={() => handleRandomVerseFromTestament('old')}
              activeOpacity={0.7}
            >
              <Text style={[styles.testamentOptionText, { color: colors.primary }]}>
                {t(uiLanguage, 'oldTestament')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testamentOption, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
              onPress={() => handleRandomVerseFromTestament('new')}
              activeOpacity={0.7}
            >
              <Text style={[styles.testamentOptionText, { color: colors.primary }]}>
                {t(uiLanguage, 'newTestament')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={closeTestamentPicker}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'cancel')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  verseContainer: {
    padding: 24,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic' as const,
  },
  modalActions: {
    flexDirection: 'row' as const,
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  pickerContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  testamentOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  testamentOptionText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
