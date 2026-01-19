import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../contexts/AppContext";
import { getChapters, getBookName } from "../../utils/database";
import { t } from "../../constants/translations";
import { getColors } from "../../constants/colors";

export default function ChaptersScreen() {
  const { language, uiLanguage, theme } = useApp();
  const colors = getColors(theme);
  const router = useRouter();
  const { book } = useLocalSearchParams<{ book: string }>();
  const [chapters, setChapters] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookName, setBookName] = useState<string>('');

  const loadChapters = useCallback(async () => {
    if (!book) {
      console.error('[ChaptersScreen] No book ID provided');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('[ChaptersScreen] Loading chapters for book:', book, 'language:', language);
      const chaptersList = await getChapters(language, book);
      console.log('[ChaptersScreen] Chapters loaded:', chaptersList.length);
      setChapters(chaptersList);
      
      const name = await getBookName(language, book);
      console.log('[ChaptersScreen] Book name:', name);
      setBookName(name);
    } catch (error) {
      console.error('[ChaptersScreen] Error loading chapters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [book, language]);

  useEffect(() => {
    if (book) {
      loadChapters();
    }
  }, [book, loadChapters]);

  const handleChapterPress = (chapter: number) => {
    router.push({ pathname: '/book/[book]/chapter/[chapter]', params: { book, chapter: chapter.toString() } });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: bookName || book, headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: bookName || book, headerShown: true }} />
      
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'selectChapter')}</Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.toString()}
        numColumns={4}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chapterCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleChapterPress(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chapterNumber, { color: colors.primary }]}>{item}</Text>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
  },
  chapterCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 0,
  },
  chapterNumber: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
});
