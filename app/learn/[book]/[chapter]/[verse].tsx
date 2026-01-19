import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Lightbulb, Check, X, CheckCircle2 } from "lucide-react-native";
import { useApp } from "../../../../contexts/AppContext";
import { getVerse } from "../../../../utils/database";
import { t, getBookName } from "../../../../constants/translations";
import { getColors } from "../../../../constants/colors";
import { checkDyslexiaFriendlyMatch } from "../../../../utils/text-validation";
import type { Verse } from "../../../../types/database";

export default function LearnScreen() {
  const { language, uiLanguage, learningMode, theme, dyslexiaSettings, lineByLineSettings, getVerseProgress, updateProgress, toggleMemorized } = useApp();
  const colors = getColors(theme);
  const router = useRouter();
  const { book, chapter, verse } = useLocalSearchParams<{ book: string; chapter: string; verse: string }>();
  
  const [verseData, setVerseData] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [isMemorized, setIsMemorized] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [verseLines, setVerseLines] = useState<string[]>([]);

  useEffect(() => {
    const loadVerse = async () => {
      setIsLoading(true);
      try {
        const data = await getVerse(language, book, parseInt(chapter), parseInt(verse));
        setVerseData(data);
        
        if (data) {
          const progress = getVerseProgress(data.book, data.chapter, data.verse);
          setMasteryLevel(progress?.masteryLevel || 0);
          setIsMemorized(progress?.memorized || false);
          
          if (learningMode === 'guess-verse') {
            setRevealedWords(new Set());
            
            if (lineByLineSettings.enabled) {
              const lines = splitIntoLines(data.text);
              setVerseLines(lines);
              setCurrentLineIndex(0);
            }
          }
        }
      } catch (error) {
        console.error('Error loading verse:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (book && chapter && verse) {
      loadVerse();
    }
  }, [book, chapter, verse, language, getVerseProgress, learningMode, lineByLineSettings.enabled]);

  const handleHint = () => {
    if (learningMode === 'guess-verse' && verseData) {
      const words = verseData.text.split(' ');
      const unrevealedIndices = words
        .map((_, index) => index)
        .filter(index => !revealedWords.has(index));
      
      if (unrevealedIndices.length > 0) {
        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        const newRevealed = new Set(revealedWords);
        newRevealed.add(randomIndex);
        setRevealedWords(newRevealed);
        setHintsUsed(prev => prev + 1);
      }
    }
  };

  const normalizePunctuation = (text: string): string => {
    return text.replace(/[.,;:!?"'()\[\]{}]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const splitIntoLines = (text: string): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    const wordsPerLine = 5;
    
    for (let i = 0; i < words.length; i += wordsPerLine) {
      lines.push(words.slice(i, i + wordsPerLine).join(' '));
    }
    
    return lines;
  };

  const handleNextLine = () => {
    if (currentLineIndex < verseLines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
    }
  };

  const handleCheck = async () => {
    if (!verseData) return;

    const currentProgress = getVerseProgress(verseData.book, verseData.chapter, verseData.verse);
    
    let correct = false;
    
    if (learningMode === 'guess-verse') {
      if (lineByLineSettings.enabled) {
        const currentLine = verseLines[currentLineIndex];
        
        if (dyslexiaSettings.tolerantValidation) {
          const result = checkDyslexiaFriendlyMatch(userAnswer, currentLine, {
            toleranceLevel: 0.80,
          });
          correct = result.isMatch;
          console.log('[Dyslexia Line Check]', {
            currentLine,
            userAnswer,
            similarity: result.similarity,
            isMatch: result.isMatch,
          });
        } else {
          const normalizedAnswer = normalizePunctuation(userAnswer);
          const normalizedLine = normalizePunctuation(currentLine);
          correct = normalizedAnswer === normalizedLine;
        }
      } else {
        const textToCheck = verseData.text;
        
        if (dyslexiaSettings.enabled && dyslexiaSettings.tolerantValidation) {
          const result = checkDyslexiaFriendlyMatch(userAnswer, textToCheck, {
            toleranceLevel: 0.80,
          });
          correct = result.isMatch;
        } else {
          const normalizedAnswer = normalizePunctuation(userAnswer);
          const normalizedVerse = normalizePunctuation(textToCheck);
          correct = normalizedAnswer === normalizedVerse;
        }
      }
    } else {
      const normalizedAnswer = userAnswer.trim().toLowerCase();
      const bookNameInLanguage = getBookName(language, verseData.book).toLowerCase();
      const hasBook = normalizedAnswer.includes(verseData.book.toLowerCase()) || 
                      normalizedAnswer.includes(bookNameInLanguage);
      correct = hasBook && 
                normalizedAnswer.includes(`${verseData.chapter}`) &&
                normalizedAnswer.includes(`${verseData.verse}`);
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    const currentMasteryLevel = currentProgress?.masteryLevel || 0;
    const newMasteryLevel = correct && currentMasteryLevel < 5 ? currentMasteryLevel + 1 : currentMasteryLevel;
    
    setMasteryLevel(newMasteryLevel);

    const newProgress = {
      book: verseData.book,
      chapter: verseData.chapter,
      verse: verseData.verse,
      attempts: (currentProgress?.attempts || 0) + 1,
      correctGuesses: (currentProgress?.correctGuesses || 0) + (correct ? 1 : 0),
      lastPracticed: new Date().toISOString(),
      completed: newMasteryLevel >= 5,
      started: true,
      masteryLevel: newMasteryLevel,
      memorized: currentProgress?.memorized || false,
    };

    await updateProgress(newProgress);
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setUserAnswer('');
    
    if (!lineByLineSettings.enabled) {
      setRevealedWords(new Set());
      setHintsUsed(0);
    }
  };

  const handleNext = () => {
    router.back();
  };

  const handleToggleMemorized = async () => {
    if (!verseData) return;
    await toggleMemorized(verseData.book, verseData.chapter, verseData.verse);
    setIsMemorized(!isMemorized);
  };

  const renderMaskedText = () => {
    if (!verseData) return null;
    
    if (lineByLineSettings.enabled) {
      return (
        <View style={styles.lineByLineContainer}>
          {verseLines.map((line, index) => {
            const isCompleted = index < currentLineIndex;
            const isCurrent = index === currentLineIndex;
            
            return (
              <View key={index} style={[
                styles.lineContainer,
                isCompleted && styles.lineCompleted,
                isCurrent && [styles.lineCurrent, { borderColor: colors.primary }],
              ]}>
                {isCompleted ? (
                  <Text style={[
                    styles.lineText,
                    { 
                      color: colors.success,
                      fontSize: dyslexiaSettings.fontSize,
                      lineHeight: dyslexiaSettings.lineHeight,
                    },
                  ]}>
                    ✓ {line}
                  </Text>
                ) : isCurrent ? (
                  <Text style={[
                    styles.lineText,
                    { 
                      color: colors.text,
                      fontSize: dyslexiaSettings.fontSize,
                      lineHeight: dyslexiaSettings.lineHeight,
                    },
                  ]}>
                    {line}
                  </Text>
                ) : (
                  <Text style={[
                    styles.lineText,
                    { 
                      color: colors.textTertiary,
                      fontSize: dyslexiaSettings.enabled ? dyslexiaSettings.fontSize : 16,
                      lineHeight: dyslexiaSettings.enabled ? dyslexiaSettings.lineHeight : 24,
                    },
                  ]}>
                    Ligne {index + 1}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      );
    }
    
    const words = verseData.text.split(' ');
    
    return (
      <View style={styles.maskedTextContainer}>
        {words.map((word, index) => (
          <Text 
            key={index} 
            style={[
              styles.maskedText, 
              { 
                color: colors.text,
                fontSize: dyslexiaSettings.enabled ? dyslexiaSettings.fontSize : 16,
                lineHeight: dyslexiaSettings.enabled ? dyslexiaSettings.lineHeight : 24,
              }
            ]}
          >
            {revealedWords.has(index) ? word : '____'}{' '}
          </Text>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t(uiLanguage, 'practice'), headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!verseData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t(uiLanguage, 'practice'), headerShown: true }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Verse not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t(uiLanguage, 'practice'), headerShown: true }} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <TouchableOpacity 
          style={[styles.memorizedButton, { 
            backgroundColor: isMemorized ? colors.success + '20' : colors.cardBackground,
            borderColor: isMemorized ? colors.success : colors.border 
          }]}
          onPress={handleToggleMemorized}
        >
          <CheckCircle2 
            color={isMemorized ? colors.success : colors.textSecondary} 
            size={20} 
            fill={isMemorized ? colors.success : 'transparent'}
          />
          <Text style={[styles.memorizedText, { color: isMemorized ? colors.success : colors.text }]}>
            {isMemorized ? t(uiLanguage, 'memorized') : t(uiLanguage, 'markAsMemorized')}
          </Text>
        </TouchableOpacity>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          {masteryLevel > 0 && (
            <View style={[styles.masteryContainer, { borderBottomColor: colors.border }]}>
              <Text style={[styles.masteryLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'mastery')}</Text>
              <View style={styles.masteryBar}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.masterySegment,
                      { backgroundColor: level <= masteryLevel ? colors.success : colors.border },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.masteryText, { color: colors.primary }]}>{masteryLevel}/5</Text>
            </View>
          )}
          {learningMode === 'guess-verse' ? (
            <>
              <Text style={[styles.reference, { color: colors.primary }]}>
                {getBookName(language, verseData.book)} {verseData.chapter}:{verseData.verse}
              </Text>
              {renderMaskedText()}
              <View style={[styles.hintContainer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.hintButton}
                  onPress={handleHint}
                >
                  <Lightbulb color={colors.warning} size={20} />
                  <Text style={styles.hintButtonText}>{t(uiLanguage, 'hint')}</Text>
                </TouchableOpacity>
                <Text style={[styles.hintsText, { color: colors.textSecondary }]}>Hints used: {hintsUsed}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[
                styles.verseText, 
                { 
                  color: colors.text,
                  fontSize: dyslexiaSettings.enabled ? dyslexiaSettings.fontSize : 16,
                  lineHeight: dyslexiaSettings.enabled ? dyslexiaSettings.lineHeight : 24,
                }
              ]}>
                {verseData.text}
              </Text>
            </>
          )}
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {learningMode === 'guess-verse' 
              ? t(uiLanguage, 'guessVerse')
              : t(uiLanguage, 'guessReference')
            }
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder={t(uiLanguage, 'yourAnswer')}
            multiline={learningMode === 'guess-verse'}
            numberOfLines={learningMode === 'guess-verse' ? 4 : 1}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {showFeedback && (
          <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
            {isCorrect ? (
              <>
                <Check color={colors.success} size={24} />
                <Text style={styles.feedbackTextCorrect}>{t(uiLanguage, 'correct')}</Text>
              </>
            ) : (
              <>
                <X color={colors.error} size={24} />
                <Text style={styles.feedbackTextIncorrect}>{t(uiLanguage, 'incorrect')}</Text>
              </>
            )}
          </View>
        )}

        {!showFeedback ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleCheck}
          >
            <Text style={styles.buttonTextPrimary}>{t(uiLanguage, 'check')}</Text>
          </TouchableOpacity>
        ) : isCorrect ? (
          lineByLineSettings.enabled && currentLineIndex < verseLines.length - 1 ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleNextLine}
            >
              <Text style={styles.buttonTextPrimary}>Ligne suivante</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>
                {t(uiLanguage, 'nextVerse')}
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRetry}
            >
              <Text style={styles.buttonTextPrimary}>
                {t(uiLanguage, 'tryAgain')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>
                {t(uiLanguage, 'nextVerse')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reference: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  maskedTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  maskedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#92400E",
  },
  hintsText: {
    fontSize: 14,
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  feedbackCorrect: {
    backgroundColor: "#D1FAE5",
  },
  feedbackIncorrect: {
    backgroundColor: "#FEE2E2",
  },
  feedbackTextCorrect: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#065F46",
  },
  feedbackTextIncorrect: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#991B1B",
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonSecondary: {
    borderWidth: 2,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  masteryContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  masteryLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  masteryBar: {
    flexDirection: "row" as const,
    gap: 4,
    marginBottom: 8,
  },
  masterySegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  masteryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  buttonGroup: {
    gap: 12,
  },
  memorizedButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  memorizedText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  lineByLineContainer: {
    gap: 12,
  },
  lineContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  lineCurrent: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 2,
  },
  lineCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  lineText: {
    fontWeight: "500" as const,
  },
});
