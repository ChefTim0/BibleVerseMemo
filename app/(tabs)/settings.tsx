import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Switch, Alert, Platform } from "react-native";
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { Check, Heart, BookOpen, Sun, Moon, Brain, Download, Upload, RefreshCcw, Palette, Zap } from "lucide-react-native";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../constants/translations";
import { getColors } from "../../constants/colors";
import type { LearningMode, Theme, Language } from "../../types/database";
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { PROGRESSION_FILE_VERSION } from "../../constants/features";

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'LSG', name: 'Français - Louis Segond 1910', flag: '🇫🇷' },
  { code: 'FOB', name: 'Français (FOB) - La Sainte Bible', flag: '🇫🇷' },
  { code: 'KJV', name: 'English - King James Version', flag: '🇬🇧' },
  { code: 'ITADIO', name: 'Italiano - Giovanni Diodati Bibbia 1649', flag: '🇮🇹' },
  { code: 'CEI', name: 'Italiano - Conferenza Episcopale Italiana', flag: '🇮🇹' },
  { code: 'RVA', name: 'Español - Reina-Valera Antigua', flag: '🇪🇸' },
  { code: 'spavbl', name: 'Español - Versión Biblia Libre', flag: '🇪🇸' },
  { code: 'ELB71', name: 'Deutsch - Elberfelder 1871', flag: '🇩🇪' },
  { code: 'ELB', name: 'Deutsch - Elberfelder 1905', flag: '🇩🇪' },
  { code: 'LUTH1545', name: 'Deutsch - Luther Bibel 1545', flag: '🇩🇪' },
  { code: 'deu1912', name: 'Deutsch - Luther Bibel 1912', flag: '🇩🇪' },
  { code: 'deutkw', name: 'Deutsch - Textbibel von Kautzsch und Weizsäcker', flag: '🇩🇪' },
  { code: 'VULGATE', name: 'Latin - Biblia Sacra Vulgata', flag: '🇻🇦' },
  { code: 'TR1894', name: 'Ελληνικά - Scrivener New Testament 1894', flag: '🇬🇷' },
  { code: 'TR1550', name: 'Ελληνικά - Stephanus New Testament 1550', flag: '🇬🇷' },
  { code: 'WHNU', name: 'Ελληνικά - Westcott-Hort New Testament 1881', flag: '🇬🇷' },
  { code: 'grm', name: 'Ελληνικά - Ελληνική Βίβλος', flag: '🇬🇷' },
  { code: 'WLC', name: 'עברית - כתבי הקודש', flag: '🇮🇱' },
  { code: 'heb', name: 'עברית - תנ ך עברי מודרני', flag: '🇮🇱' },
];

export default function SettingsScreen() {
  const { language, uiLanguage, learningMode, theme, dyslexiaSettings, lineByLineSettings, appearanceSettings, learningSettings, progress, setLanguage, setLearningMode, setTheme, setDyslexiaSettings, setLineByLineSettings, setAppearanceSettings, setLearningSettings } = useApp();
  const colors = getColors(theme);


  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  const handleModeChange = async (newMode: LearningMode) => {
    await setLearningMode(newMode);
  };

  const handleThemeChange = async (newTheme: Theme) => {
    await setTheme(newTheme);
  };



  const handleBooksSource = async () => {
    try {
      const url = 'https://bible4u.net/en/download';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening books source link:', error);
    }
  };

  const handleDonate = async () => {
    try {
      const url = 'https://timprojects.online';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening donation link:', error);
    }
  };

  const handleExportProgression = async () => {
    try {
      const totalVerses = progress.length;
      const versesStarted = progress.filter(p => p.started).length;
      const versesCompleted = progress.filter(p => p.completed).length;
      const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
      const correctGuesses = progress.reduce((sum, p) => sum + p.correctGuesses, 0);
      const accuracy = totalAttempts > 0 ? (correctGuesses / totalAttempts * 100) : 0;
      const memorizedVerses = progress.filter(p => p.memorized);

      const progressionData = {
        version: PROGRESSION_FILE_VERSION,
        statistics: {
          totalVerses,
          versesStarted,
          versesCompleted,
          accuracy,
          totalAttempts,
          correctGuesses,
        },
        progression: {
          level: 0,
          xp: versesCompleted * 10,
          sessionsCompleted: totalAttempts,
        },
        verseProgress: progress,
        memorizedVerses: memorizedVerses,
        lastUpdate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(progressionData, null, 2);
      const file = new File(Paths.document, 'progression.json');
      
      file.write(jsonString);

      if (Platform.OS === 'android') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: t(uiLanguage, 'exportProgression'),
            UTI: 'public.json',
          });
        } else {
          Alert.alert(t(uiLanguage, 'success'), `${t(uiLanguage, 'progressionExportedTo')}: ${file.uri}`);
        }
      } else {
        Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'progressionICloudBackup'));
      }
    } catch (error) {
      console.error('Error exporting progression:', error);
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToExport'));
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      t(uiLanguage, 'resetSettings'),
      t(uiLanguage, 'resetConfirm'),
      [
        { text: t(uiLanguage, 'cancel'), style: 'cancel' },
        {
          text: t(uiLanguage, 'reset'),
          style: 'destructive',
          onPress: async () => {
            await setDyslexiaSettings({ enabled: false, fontSize: 18, lineHeight: 32, tolerantValidation: true });
            await setLineByLineSettings({ enabled: false, wordsPerLine: 5 });
            await setAppearanceSettings({ fontSize: 16, lineHeight: 24, wordSpacing: 0, borderRadius: 12, cardOpacity: 1, animationsEnabled: true });
            await setLearningSettings({ autoAdvance: false, showHints: true, maxHints: 10, validationTolerance: 0.8, autoMarkMemorized: false, autoMarkThreshold: 5, hapticFeedback: true, soundEffects: false });
            Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'settingsReset'));
          },
        },
      ]
    );
  };

  const handleImportProgression = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = new File(result.assets[0].uri);
      const fileContent = file.textSync();
      const importedData = JSON.parse(fileContent);

      if (!importedData.version || importedData.version !== PROGRESSION_FILE_VERSION) {
        Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'invalidFileFormat'));
        return;
      }

      if (!importedData.verseProgress || !Array.isArray(importedData.verseProgress)) {
        Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'invalidDataStructure'));
        return;
      }

      Alert.alert(
        t(uiLanguage, 'importProgression'),
        t(uiLanguage, 'importConfirm').replace('{count}', importedData.verseProgress.length.toString()),
        [
          { text: t(uiLanguage, 'cancel'), style: 'cancel' },
          {
            text: t(uiLanguage, 'import'),
            onPress: async () => {
              try {
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                await AsyncStorage.setItem('@verse_progress', JSON.stringify(importedData.verseProgress));
                Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'progressionImported'));
              } catch (error) {
                console.error('Error saving imported progression:', error);
                Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToSaveImport'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error importing progression:', error);
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToImport'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'settings')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'dataManagement')}</Text>
            
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.info + '20' }]}
              onPress={handleExportProgression}
            >
              <Download color={colors.info} size={20} />
              <Text style={[styles.exportButtonText, { color: colors.info }]}>{t(uiLanguage, 'exportProgression')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.importButton, { backgroundColor: colors.warning + '20' }]}
              onPress={handleImportProgression}
            >
              <Upload color={colors.warning} size={20} />
              <Text style={[styles.importButtonText, { color: colors.warning }]}>{t(uiLanguage, 'importProgression')}</Text>
            </TouchableOpacity>
            
            <Text style={[styles.accountInfo, { color: colors.textSecondary }]}>{t(uiLanguage, 'exportImportInfo')}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'verseLanguage')}</Text>
          
          <View style={[styles.pickerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Picker
              selectedValue={language}
              onValueChange={(itemValue) => handleLanguageChange(itemValue as Language)}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.text}
              mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
              itemStyle={Platform.OS === 'ios' ? { color: colors.text, backgroundColor: colors.cardBackground } : undefined}
            >
              {LANGUAGES.map((lang) => (
                <Picker.Item
                  key={lang.code}
                  label={`${lang.flag} ${lang.name}`}
                  value={lang.code}
                  color={colors.text}
                  style={Platform.OS === 'android' ? { backgroundColor: colors.cardBackground } : undefined}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'theme')}</Text>
          
          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleThemeChange('light')}
          >
            <View style={styles.themeOption}>
              <Sun color={colors.warning} size={20} />
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'lightTheme')}</Text>
            </View>
            {theme === 'light' && <Check color={colors.primary} size={24} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleThemeChange('dark')}
          >
            <View style={styles.themeOption}>
              <Moon color={colors.info} size={20} />
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'darkTheme')}</Text>
            </View>
            {theme === 'dark' && <Check color={colors.primary} size={24} />}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'dyslexiaMode')}</Text>
          
          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Brain color={colors.primary} size={20} />
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'enableDyslexiaMode')}</Text>
            </View>
            <Switch
              value={dyslexiaSettings.enabled}
              onValueChange={(value) => setDyslexiaSettings({ enabled: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={dyslexiaSettings.enabled ? colors.primary : colors.textTertiary}
            />
          </View>

          {dyslexiaSettings.enabled && (
            <>
              <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'fontSize')}: {dyslexiaSettings.fontSize}px</Text>
              </View>

              <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.themeOption}>
                  <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'tolerantValidation')}</Text>
                </View>
                <Switch
                  value={dyslexiaSettings.tolerantValidation}
                  onValueChange={(value) => setDyslexiaSettings({ tolerantValidation: value })}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={dyslexiaSettings.tolerantValidation ? colors.primary : colors.textTertiary}
                />
              </View>

              <Text style={[styles.dyslexiaInfo, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'dyslexiaInfo')}
              </Text>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'lineByLineLearning')}</Text>
          
          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'enableLineByLine')}</Text>
            </View>
            <Switch
              value={lineByLineSettings.enabled}
              onValueChange={(value) => setLineByLineSettings({ enabled: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={lineByLineSettings.enabled ? colors.primary : colors.textTertiary}
            />
          </View>

          {lineByLineSettings.enabled && (
            <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sliderLabel, { color: colors.text }]}>
                {t(uiLanguage, 'wordsPerLineTitle')}: {lineByLineSettings.wordsPerLine}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={10}
                step={1}
                value={lineByLineSettings.wordsPerLine}
                onValueChange={(value: number) => setLineByLineSettings({ wordsPerLine: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={[styles.sliderDescription, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'wordsPerLineDesc')}
              </Text>
            </View>
          )}

          <Text style={[styles.dyslexiaInfo, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'lineByLineInfo')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Palette color={colors.primary} size={20} /> {t(uiLanguage, 'appearanceSettings')}
          </Text>
          
          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'textSize')}: {appearanceSettings.fontSize}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={24}
              step={1}
              value={appearanceSettings.fontSize}
              onValueChange={(value: number) => setAppearanceSettings({ fontSize: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'lineSpacing')}: {appearanceSettings.lineHeight}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={16}
              maximumValue={40}
              step={2}
              value={appearanceSettings.lineHeight}
              onValueChange={(value: number) => setAppearanceSettings({ lineHeight: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'wordSpacing')}: {appearanceSettings.wordSpacing}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={appearanceSettings.wordSpacing}
              onValueChange={(value: number) => setAppearanceSettings({ wordSpacing: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'cornerRadius')}: {appearanceSettings.borderRadius}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={24}
              step={2}
              value={appearanceSettings.borderRadius}
              onValueChange={(value: number) => setAppearanceSettings({ borderRadius: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'cardTransparency')}: {Math.round(appearanceSettings.cardOpacity * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={1}
              step={0.05}
              value={appearanceSettings.cardOpacity}
              onValueChange={(value: number) => setAppearanceSettings({ cardOpacity: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'enableAnimations')}</Text>
            </View>
            <Switch
              value={appearanceSettings.animationsEnabled}
              onValueChange={(value) => setAppearanceSettings({ animationsEnabled: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={appearanceSettings.animationsEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Zap color={colors.warning} size={20} /> {t(uiLanguage, 'learningCustomization')}
          </Text>
          
          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'autoAdvanceNext')}</Text>
            </View>
            <Switch
              value={learningSettings.autoAdvance}
              onValueChange={(value) => setLearningSettings({ autoAdvance: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={learningSettings.autoAdvance ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'showHintsButton')}</Text>
            </View>
            <Switch
              value={learningSettings.showHints}
              onValueChange={(value) => setLearningSettings({ showHints: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={learningSettings.showHints ? colors.primary : colors.textTertiary}
            />
          </View>

          {learningSettings.showHints && (
            <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sliderLabel, { color: colors.text }]}>
                {t(uiLanguage, 'maximumHints')}: {learningSettings.maxHints}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={learningSettings.maxHints}
                onValueChange={(value: number) => setLearningSettings({ maxHints: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>
          )}

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'validationTolerance')}: {Math.round(learningSettings.validationTolerance * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={1}
              step={0.05}
              value={learningSettings.validationTolerance}
              onValueChange={(value: number) => setLearningSettings({ validationTolerance: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'autoMarkMemorizedTitle')}</Text>
            </View>
            <Switch
              value={learningSettings.autoMarkMemorized}
              onValueChange={(value) => setLearningSettings({ autoMarkMemorized: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={learningSettings.autoMarkMemorized ? colors.primary : colors.textTertiary}
            />
          </View>

          {learningSettings.autoMarkMemorized && (
            <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sliderLabel, { color: colors.text }]}>
                {t(uiLanguage, 'masteryThreshold')}: {learningSettings.autoMarkThreshold}/5
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={learningSettings.autoMarkThreshold}
                onValueChange={(value: number) => setLearningSettings({ autoMarkThreshold: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={[styles.sliderDescription, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'autoMarkMemorizedDesc')}
              </Text>
            </View>
          )}

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'enableHaptics')}</Text>
            </View>
            <Switch
              value={learningSettings.hapticFeedback}
              onValueChange={(value) => setLearningSettings({ hapticFeedback: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={learningSettings.hapticFeedback ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'enableSounds')}</Text>
            </View>
            <Switch
              value={learningSettings.soundEffects}
              onValueChange={(value) => setLearningSettings({ soundEffects: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={learningSettings.soundEffects ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'learningMode')}</Text>
          
          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleModeChange('guess-verse')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'guessVerse')}</Text>
            {learningMode === 'guess-verse' && <Check color={colors.primary} size={24} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleModeChange('guess-reference')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'guessReference')}</Text>
            {learningMode === 'guess-reference' && <Check color={colors.primary} size={24} />}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'support')}</Text>
          
          <TouchableOpacity
            style={styles.booksSourceButton}
            onPress={handleBooksSource}
            activeOpacity={0.8}
          >
            <BookOpen color="#059669" size={20} />
            <Text style={styles.booksSourceButtonText}>{t(uiLanguage, 'booksSource')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.donateButton}
            onPress={handleDonate}
            activeOpacity={0.8}
          >
            <Heart color="#EF4444" size={20} fill="#EF4444" />
            <Text style={styles.donateButtonText}>{t(uiLanguage, 'donate')}</Text>
          </TouchableOpacity>
          
          <Text style={[styles.footerText, { color: colors.textTertiary, marginTop: 24 }]}>
            {t(uiLanguage, 'footerText')}
          </Text>

          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
            onPress={handleResetSettings}
            activeOpacity={0.8}
          >
            <RefreshCcw color={colors.error} size={20} />
            <Text style={[styles.resetButtonText, { color: colors.error }]}>{t(uiLanguage, 'resetSettings')}</Text>
          </TouchableOpacity>
        </View>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  themeOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  optionSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  booksSourceButton: {
    backgroundColor: "#D1FAE5",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  booksSourceButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#065F46",
  },
  donateButton: {
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#991B1B",
  },
  footerText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: "center" as const,
    fontStyle: "italic" as const,
  },
  loginButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  accountInfo: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 20,
  },
  friendsButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  friendsButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  exportButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  importButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  languageFlag: {
    fontSize: 24,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  picker: {
    height: 50,
    marginHorizontal: 4,
  },
  dyslexiaInfo: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sliderContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  resetButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 16,
    borderWidth: 2,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
