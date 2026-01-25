import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useApp } from "../../contexts/AppContext";
import { t, getBookName } from "../../constants/translations";
import { getColors } from "../../constants/colors";
import { Heart, BookOpen } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";

export default function MemorizedScreen() {
  const { language, uiLanguage, theme, progress, learningSettings } = useApp();
  const colors = getColors(theme);
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  const memorizedVerses = progress.filter(p => p.memorized);

  const booksWithMemorizedVerses = useMemo(() => {
    const books = new Set<string>();
    memorizedVerses.forEach(v => books.add(v.book));
    return Array.from(books);
  }, [memorizedVerses]);

  const filteredVerses = useMemo(() => {
    if (!selectedBook) return memorizedVerses;
    return memorizedVerses.filter(v => v.book === selectedBook);
  }, [memorizedVerses, selectedBook]);

  const handleVersePress = (book: string, chapter: number, verse: number) => {
    router.push(`/learn/${book}/${chapter}/${verse}`);
  };

  const maxMastery = learningSettings.maxMasteryLevel || 5;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'memorized')}</Text>
      </View>
      
      {booksWithMemorizedVerses.length > 0 && (
        <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                { 
                  backgroundColor: selectedBook === null ? colors.primary : colors.background,
                  borderColor: selectedBook === null ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedBook(null)}
            >
              <BookOpen 
                size={16} 
                color={selectedBook === null ? '#fff' : colors.textSecondary} 
              />
              <Text style={[
                styles.filterTabText,
                { color: selectedBook === null ? '#fff' : colors.text }
              ]}>
                {t(uiLanguage, 'allBooks')} ({memorizedVerses.length})
              </Text>
            </TouchableOpacity>
            
            {booksWithMemorizedVerses.map((book) => {
              const count = memorizedVerses.filter(v => v.book === book).length;
              const isSelected = selectedBook === book;
              return (
                <TouchableOpacity
                  key={book}
                  style={[
                    styles.filterTab,
                    { 
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedBook(book)}
                >
                  <Text style={[
                    styles.filterTabText,
                    { color: isSelected ? '#fff' : colors.text }
                  ]}>
                    {getBookName(language, book)} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        {filteredVerses.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart color={colors.textSecondary} size={64} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t(uiLanguage, 'noMemorizedVerses')}
            </Text>
          </View>
        ) : (
          <View style={styles.versesList}>
            {filteredVerses.map((verseProgress, index) => (
              <TouchableOpacity
                key={`${verseProgress.book}-${verseProgress.chapter}-${verseProgress.verse}-${index}`}
                style={[styles.verseCard, { backgroundColor: colors.cardBackground }]}
                onPress={() => handleVersePress(verseProgress.book, verseProgress.chapter, verseProgress.verse)}
              >
                <View style={styles.verseHeader}>
                  <View style={[styles.heartIcon, { backgroundColor: colors.success + '20' }]}>
                    <Heart color={colors.success} size={20} fill={colors.success} />
                  </View>
                  <Text style={[styles.verseReference, { color: colors.primary }]}>
                    {getBookName(language, verseProgress.book)} {verseProgress.chapter}:{verseProgress.verse}
                  </Text>
                </View>
                
                {verseProgress.masteryLevel > 0 && (
                  <View style={styles.masteryContainer}>
                    <Text style={[styles.masteryLabel, { color: colors.textSecondary }]}>
                      {t(uiLanguage, 'mastery')}: {Math.min(verseProgress.masteryLevel, maxMastery)}/{maxMastery}
                    </Text>
                    <View style={styles.masteryBar}>
                      {Array.from({ length: maxMastery }, (_, i) => i + 1).map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.masterySegment,
                            { backgroundColor: level <= verseProgress.masteryLevel ? colors.success : colors.border },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  filterContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  versesList: {
    padding: 20,
    gap: 12,
  },
  verseCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verseHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 12,
  },
  heartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  verseReference: {
    fontSize: 18,
    fontWeight: "700" as const,
    flex: 1,
  },
  masteryContainer: {
    gap: 8,
  },
  masteryLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  masteryBar: {
    flexDirection: "row" as const,
    gap: 4,
  },
  masterySegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
});
