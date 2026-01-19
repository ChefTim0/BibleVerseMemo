import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../constants/translations";
import { getColors } from "../../constants/colors";
import { BookOpen, PlayCircle, Award, Target, BarChart3, CheckCheck } from "lucide-react-native";

export default function ProgressScreen() {
  const { uiLanguage, theme, progress } = useApp();
  const colors = getColors(theme);

  const totalVerses = progress.length;
  const versesStarted = progress.filter(p => p.started).length;
  const versesCompleted = progress.filter(p => p.completed).length;
  const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
  const correctGuesses = progress.reduce((sum, p) => sum + p.correctGuesses, 0);
  const accuracy = totalAttempts > 0 ? (correctGuesses / totalAttempts * 100).toFixed(1) : '0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'progress')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {totalVerses === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t(uiLanguage, 'noProgress')}</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.iconContainer}>
                <BookOpen color={colors.primary} size={32} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalVerses}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'totalVerses')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.iconContainer}>
                <PlayCircle color={colors.success} size={32} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{versesStarted}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'versesStarted')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.iconContainer}>
                <Award color={colors.warning} size={32} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{versesCompleted}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'versesCompleted')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.iconContainer}>
                <Target color={colors.error} size={32} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{accuracy}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'accuracy')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.iconContainer}>
                <BarChart3 color={colors.purple} size={32} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalAttempts}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'totalAttempts')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.iconContainer}>
                <CheckCheck color={colors.info} size={32} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{correctGuesses}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'correctGuesses')}</Text>
            </View>
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
  content: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  statsContainer: {
    padding: 20,
    gap: 16,
  },
  statCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 40,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    textAlign: "center",
  },
});
