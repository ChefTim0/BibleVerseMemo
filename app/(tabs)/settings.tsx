import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Switch, Alert, Platform, Modal, ActivityIndicator, TextInput } from "react-native";
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { Check, Heart, BookOpen, Sun, Moon, Brain, Download, Upload, RefreshCcw, Palette, Zap, Folder, Info, X, Volume2, Play, User, UserRound, Plus, Link as LinkIcon, FileText, Github, Bell, Trash2 } from "lucide-react-native";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../constants/translations";
import { getColors } from "../../constants/colors";
import type { LearningMode, Theme, Language, TTSSpeed, TTSVoice, ValidationSettings, NotificationTime } from "../../types/database";
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { PROGRESSION_FILE_VERSION } from "../../constants/features";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getVoicesForLanguage, getLanguageCode, speak, stop } from "../../utils/tts";
import { scheduleMultipleReminders, cancelAllNotifications } from "../../utils/notifications";
import DateTimePicker from '@react-native-community/datetimepicker';

const TTS_LANGUAGES: { code: string; name: string; flag: string }[] = [
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'en-US', name: 'English', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'nl-NL', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'el-GR', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he-IL', name: 'עברית', flag: '🇮🇱' },
  { code: 'la', name: 'Latin', flag: '🇻🇦' },
];

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'LSG', name: 'Français - Louis Segond 1910', flag: '🇫🇷' },
  { code: 'FOB', name: 'Français (FOB) - La Sainte Bible', flag: '🇫🇷' },
  { code: 'darby', name: 'Français - Darby', flag: '🇫🇷' },
  { code: 'DarbyR', name: 'Français - Darby Révisée', flag: '🇫🇷' },
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
  { code: 'nld', name: 'Nederlands - De Heilige Schrift 1917', flag: '🇳🇱' },
  { code: 'AA', name: 'Português - Almeida Atualizada', flag: '🇧🇷' },
  { code: 'PBG', name: 'Polski - Biblia Gdańska', flag: '🇵🇱' },
  { code: 'RUSV', name: 'Русский - Синодальный перевод', flag: '🇷🇺' },
];

export default function SettingsScreen() {
  const { language, uiLanguage, learningMode, theme, dyslexiaSettings, validationSettings, appearanceSettings, learningSettings, ttsSettings, notificationSettings, progress, customVersionUrl, setLanguage, setLearningMode, setTheme, setDyslexiaSettings, setValidationSettings, setAppearanceSettings, setLearningSettings, setTTSSettings, setNotificationSettings, setCustomVersionUrl } = useApp();
  const colors = getColors(theme);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [showCustomVersionModal, setShowCustomVersionModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isLoadingCustomVersion, setIsLoadingCustomVersion] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);
  const [tempTime, setTempTime] = useState(new Date());

  useEffect(() => {
    const loadVoices = async () => {
      setLoadingVoices(true);
      const langCode = ttsSettings.voiceLanguage || getLanguageCode(language);
      const voices = await getVoicesForLanguage(langCode);
      setAvailableVoices(voices);
      setLoadingVoices(false);
      console.log('[Settings] Loaded voices for', langCode, ':', voices.length);
    };
    loadVoices();
  }, [ttsSettings.voiceLanguage, language]);

  const handleVoiceChange = async (voiceIdentifier: string | undefined) => {
    await setTTSSettings({ voiceIdentifier });
  };

  const testVoice = async (voiceIdentifier: string | undefined) => {
    const voiceLang = ttsSettings.voiceLanguage || getLanguageCode(language);
    const testText = voiceLang.startsWith('fr')
      ? 'Ceci est un test de la voix sélectionnée.'
      : voiceLang.startsWith('en')
      ? 'This is a test of the selected voice.'
      : voiceLang.startsWith('es')
      ? 'Esta es una prueba de la voz seleccionada.'
      : voiceLang.startsWith('de')
      ? 'Dies ist ein Test der ausgewählten Stimme.'
      : voiceLang.startsWith('it')
      ? 'Questo è un test della voce selezionata.'
      : voiceLang.startsWith('pt')
      ? 'Este é um teste da voz selecionada.'
      : voiceLang.startsWith('el')
      ? 'Αυτή είναι μια δοκιμή της επιλεγμένης φωνής.'
      : voiceLang.startsWith('he')
      ? 'זהו מבחן של הקול שנבחר.'
      : 'This is a test of the selected voice.';

    setTestingVoice(voiceIdentifier || 'default');
    await speak(testText, {
      language: voiceLang,
      speed: ttsSettings.speed,
      voiceIdentifier,
      onDone: () => setTestingVoice(null),
      onError: () => setTestingVoice(null),
    });
  };


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
      const url = 'https://timprojects.online/bible-verse-memo/sources';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening books source link:', error);
    }
  };

  const handleOpenFAQ = async () => {
    try {
      const url = 'https://timprojects.online/bible-verse-memo/FAQ#Version';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening FAQ link:', error);
    }
  };

  const handleImportCustomVersion = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setIsLoadingCustomVersion(true);
      const file = new File(result.assets[0].uri);
      const fileContent = file.textSync();

      if (fileContent.length < 100) {
        Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'invalidFileFormat'));
        setIsLoadingCustomVersion(false);
        return;
      }

      const customVersionName = 'CUSTOM_' + Date.now();
      await setCustomVersionUrl(customVersionName, fileContent);
      await setLanguage(customVersionName as Language);
      
      setShowCustomVersionModal(false);
      setIsLoadingCustomVersion(false);
      Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'customVersionImported'));
    } catch (error) {
      console.error('Error importing custom version:', error);
      setIsLoadingCustomVersion(false);
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToImport'));
    }
  };

  const handleLoadFromUrl = async () => {
    if (!customUrl.trim()) {
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'pleaseEnterUrl'));
      return;
    }

    setIsLoadingCustomVersion(true);
    try {
      const response = await fetch(customUrl.trim());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fileContent = await response.text();

      if (fileContent.length < 100) {
        Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'invalidFileFormat'));
        setIsLoadingCustomVersion(false);
        return;
      }

      const customVersionName = 'CUSTOM_' + Date.now();
      await setCustomVersionUrl(customVersionName, fileContent);
      await setLanguage(customVersionName as Language);
      
      setShowCustomVersionModal(false);
      setCustomUrl('');
      setIsLoadingCustomVersion(false);
      Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'customVersionImported'));
    } catch (error) {
      console.error('Error loading from URL:', error);
      setIsLoadingCustomVersion(false);
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToLoadUrl'));
    }
  };

  const handleDonate = async () => {
    try {
      const url = 'https://timprojects.online/bible-verse-memo/donate';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening donation link:', error);
    }
  };

  const handleMyProjects = async () => {
    try {
      const url = 'https://timprojects.online';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening my projects link:', error);
    }
  };

  const handleGithub = async () => {
    try {
      const url = 'https://github.com/ChefTim0/BibleVerseMemo';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening GitHub link:', error);
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
            await setDyslexiaSettings({ enabled: false, fontSize: 18, lineHeight: 32, wordSpacing: 0, validationTolerance: 0.8 });
            await setValidationSettings({ toleranceLevel: 0.95, allowLetterInversion: false, ignorePunctuation: true });
            await setAppearanceSettings({ fontSize: 16, animationsEnabled: true, showStartupVerse: true });
            await setLearningSettings({ autoAdvance: false, showHints: true, maxHints: 10, autoMarkMemorized: false, autoMarkThreshold: 5, hapticFeedback: true, maxMasteryLevel: 20 });
            await setTTSSettings({ speed: 'normal', voiceIdentifier: undefined, voiceLanguage: 'fr-FR' });
            Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'settingsReset'));
          },
        },
      ]
    );
  };

  const handleTTSSpeedChange = async (speed: TTSSpeed) => {
    await setTTSSettings({ speed });
  };

  const handleResetVoice = async () => {
    await stop();
    await setTTSSettings({ voiceIdentifier: undefined });
  };

  const handleVoiceLanguageChange = async (langCode: string) => {
    await setTTSSettings({ voiceLanguage: langCode, voiceIdentifier: undefined });
  };

  const handleNotificationToggle = async (value: boolean) => {
    console.log('[Settings] Notification toggle:', value);
    
    if (!value) {
      await cancelAllNotifications();
      await setNotificationSettings({ enabled: false, times: [] });
    } else {
      const defaultTime: NotificationTime = { hour: 9, minute: 0 };
      await setNotificationSettings({ enabled: true, times: [defaultTime] });
      await scheduleMultipleReminders([defaultTime]);
    }
  };

  const handleAddNotificationTime = async () => {
    if (notificationSettings.times.length >= 5) {
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'maxNotificationsReached'));
      return;
    }
    
    const newTime: NotificationTime = { hour: 12, minute: 0 };
    const newTimes = [...notificationSettings.times, newTime];
    await setNotificationSettings({ times: newTimes });
    await scheduleMultipleReminders(newTimes);
  };

  const handleRemoveNotificationTime = async (index: number) => {
    const newTimes = notificationSettings.times.filter((_, i) => i !== index);
    await setNotificationSettings({ times: newTimes });
    
    if (newTimes.length === 0) {
      await setNotificationSettings({ enabled: false });
      await cancelAllNotifications();
    } else {
      await scheduleMultipleReminders(newTimes);
    }
  };

  const handleTimeChange = async (index: number, event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
    }
    
    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      const newTimes = [...notificationSettings.times];
      newTimes[index] = { hour, minute };
      await setNotificationSettings({ times: newTimes });
      await scheduleMultipleReminders(newTimes);
      
      if (Platform.OS === 'ios') {
        setShowTimePicker(null);
      }
    }
  };

  const openTimePicker = (index: number) => {
    const time = notificationSettings.times[index];
    const date = new Date();
    date.setHours(time.hour);
    date.setMinutes(time.minute);
    setTempTime(date);
    setShowTimePicker(index);
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
              {language.startsWith('CUSTOM_') && (
                <Picker.Item
                  label={t(uiLanguage, 'customVersion')}
                  value={language}
                  color={colors.text}
                  style={Platform.OS === 'android' ? { backgroundColor: colors.cardBackground } : undefined}
                />
              )}
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.customVersionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
            onPress={() => setShowCustomVersionModal(true)}
          >
            <Plus color={colors.primary} size={20} />
            <Text style={[styles.customVersionButtonText, { color: colors.primary }]}>{t(uiLanguage, 'importCustomVersion')}</Text>
          </TouchableOpacity>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'readingSettings')}</Text>
          
          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'fontSize')}: {dyslexiaSettings.fontSize}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={14}
              maximumValue={28}
              step={1}
              value={dyslexiaSettings.fontSize}
              onValueChange={(value: number) => setDyslexiaSettings({ fontSize: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'lineSpacing')}: {dyslexiaSettings.lineHeight}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={20}
              maximumValue={48}
              step={2}
              value={dyslexiaSettings.lineHeight}
              onValueChange={(value: number) => setDyslexiaSettings({ lineHeight: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'wordSpacing')}: {dyslexiaSettings.wordSpacing}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={dyslexiaSettings.wordSpacing}
              onValueChange={(value: number) => setDyslexiaSettings({ wordSpacing: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'validationSettings')}</Text>
          
          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'validationTolerance')}: {Math.round(validationSettings.toleranceLevel * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={1}
              step={0.05}
              value={validationSettings.toleranceLevel}
              onValueChange={(value: number) => setValidationSettings({ toleranceLevel: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'allowLetterInversion')}</Text>
            </View>
            <Switch
              value={validationSettings.allowLetterInversion}
              onValueChange={(value) => setValidationSettings({ allowLetterInversion: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={validationSettings.allowLetterInversion ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'ignorePunctuation')}</Text>
            </View>
            <Switch
              value={validationSettings.ignorePunctuation}
              onValueChange={(value) => setValidationSettings({ ignorePunctuation: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={validationSettings.ignorePunctuation ? colors.primary : colors.textTertiary}
            />
          </View>
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

          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'showStartupVerse')}</Text>
            </View>
            <Switch
              value={appearanceSettings.showStartupVerse !== false}
              onValueChange={(value) => setAppearanceSettings({ showStartupVerse: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={appearanceSettings.showStartupVerse !== false ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Volume2 color={colors.info} size={20} /> {t(uiLanguage, 'ttsSettings')}
          </Text>
          
          <Text style={[styles.sliderLabel, { color: colors.text, marginBottom: 8, paddingHorizontal: 4 }]}>
            {t(uiLanguage, 'ttsSpeed')}
          </Text>
          
          <View style={styles.ttsSpeedContainer}>
            <TouchableOpacity
              style={[styles.ttsSpeedOption, { backgroundColor: ttsSettings.speed === 'slow' ? colors.primary + '20' : colors.cardBackground, borderColor: ttsSettings.speed === 'slow' ? colors.primary : colors.border }]}
              onPress={() => handleTTSSpeedChange('slow')}
            >
              <Text style={[styles.ttsSpeedText, { color: ttsSettings.speed === 'slow' ? colors.primary : colors.text }]}>
                {t(uiLanguage, 'ttsSlow')}
              </Text>
              {ttsSettings.speed === 'slow' && <Check color={colors.primary} size={16} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ttsSpeedOption, { backgroundColor: ttsSettings.speed === 'normal' ? colors.primary + '20' : colors.cardBackground, borderColor: ttsSettings.speed === 'normal' ? colors.primary : colors.border }]}
              onPress={() => handleTTSSpeedChange('normal')}
            >
              <Text style={[styles.ttsSpeedText, { color: ttsSettings.speed === 'normal' ? colors.primary : colors.text }]}>
                {t(uiLanguage, 'ttsNormal')}
              </Text>
              {ttsSettings.speed === 'normal' && <Check color={colors.primary} size={16} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ttsSpeedOption, { backgroundColor: ttsSettings.speed === 'fast' ? colors.primary + '20' : colors.cardBackground, borderColor: ttsSettings.speed === 'fast' ? colors.primary : colors.border }]}
              onPress={() => handleTTSSpeedChange('fast')}
            >
              <Text style={[styles.ttsSpeedText, { color: ttsSettings.speed === 'fast' ? colors.primary : colors.text }]}>
                {t(uiLanguage, 'ttsFast')}
              </Text>
              {ttsSettings.speed === 'fast' && <Check color={colors.primary} size={16} />}
            </TouchableOpacity>
          </View>

          <Text style={[styles.sliderLabel, { color: colors.text, marginTop: 16, marginBottom: 8, paddingHorizontal: 4 }]}>
            {t(uiLanguage, 'ttsVoiceLanguage')}
          </Text>

          <View style={[styles.pickerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginBottom: 16 }]}>
            <Picker
              selectedValue={ttsSettings.voiceLanguage || getLanguageCode(language)}
              onValueChange={(itemValue) => handleVoiceLanguageChange(itemValue as string)}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.text}
              mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
              itemStyle={Platform.OS === 'ios' ? { color: colors.text, backgroundColor: colors.cardBackground } : undefined}
            >
              {TTS_LANGUAGES.map((lang) => (
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

          <Text style={[styles.sliderLabel, { color: colors.text, marginBottom: 8, paddingHorizontal: 4 }]}>
            {t(uiLanguage, 'ttsVoice')}
          </Text>

          {loadingVoices ? (
            <View style={[styles.voiceLoadingContainer, { backgroundColor: colors.cardBackground }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.voiceLoadingText, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'ttsLoadingVoices')}
              </Text>
            </View>
          ) : availableVoices.length === 0 ? (
            <View style={[styles.voiceEmptyContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.voiceEmptyText, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'ttsNoVoices')}
              </Text>
            </View>
          ) : (
            <View style={styles.voicesContainer}>
              <TouchableOpacity
                style={[
                  styles.voiceOption,
                  {
                    backgroundColor: !ttsSettings.voiceIdentifier ? colors.primary + '20' : colors.cardBackground,
                    borderColor: !ttsSettings.voiceIdentifier ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleVoiceChange(undefined)}
              >
                <View style={styles.voiceInfo}>
                  <Text style={[styles.voiceName, { color: !ttsSettings.voiceIdentifier ? colors.primary : colors.text }]}>
                    {t(uiLanguage, 'ttsDefaultVoice')}
                  </Text>
                </View>
                <View style={styles.voiceActions}>
                  <TouchableOpacity
                    style={[styles.voiceTestButton, { backgroundColor: colors.info + '20' }]}
                    onPress={() => testVoice(undefined)}
                    disabled={testingVoice !== null}
                  >
                    {testingVoice === 'default' ? (
                      <ActivityIndicator size="small" color={colors.info} />
                    ) : (
                      <Play size={14} color={colors.info} />
                    )}
                  </TouchableOpacity>
                  {!ttsSettings.voiceIdentifier && <Check color={colors.primary} size={18} />}
                </View>
              </TouchableOpacity>

              {availableVoices.map((voice, index) => {
                const GenderIcon = voice.gender === 'female' ? UserRound : voice.gender === 'male' ? User : null;
                const genderColor = voice.gender === 'female' ? '#EC4899' : voice.gender === 'male' ? '#3B82F6' : colors.textSecondary;
                return (
                  <TouchableOpacity
                    key={`${voice.identifier}-${index}`}
                    style={[
                      styles.voiceOption,
                      {
                        backgroundColor: ttsSettings.voiceIdentifier === voice.identifier ? colors.primary + '20' : colors.cardBackground,
                        borderColor: ttsSettings.voiceIdentifier === voice.identifier ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleVoiceChange(voice.identifier)}
                  >
                    <View style={styles.voiceInfo}>
                      <View style={styles.voiceNameRow}>
                        {GenderIcon && <GenderIcon size={16} color={genderColor} />}
                        <Text
                          style={[styles.voiceName, { color: ttsSettings.voiceIdentifier === voice.identifier ? colors.primary : colors.text }]}
                          numberOfLines={1}
                        >
                          {voice.name}
                        </Text>
                      </View>
                      <Text style={[styles.voiceLanguage, { color: colors.textSecondary }]} numberOfLines={1}>
                        {voice.language}
                      </Text>
                    </View>
                    <View style={styles.voiceActions}>
                      <TouchableOpacity
                        style={[styles.voiceTestButton, { backgroundColor: colors.info + '20' }]}
                        onPress={() => testVoice(voice.identifier)}
                        disabled={testingVoice !== null}
                      >
                        {testingVoice === voice.identifier ? (
                          <ActivityIndicator size="small" color={colors.info} />
                        ) : (
                          <Play size={14} color={colors.info} />
                        )}
                      </TouchableOpacity>
                      {ttsSettings.voiceIdentifier === voice.identifier && <Check color={colors.primary} size={18} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={[styles.dyslexiaInfo, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'ttsVoiceInfo')}
          </Text>
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
                maximumValue={90}
                step={1}
                value={learningSettings.maxHints}
                onValueChange={(value: number) => setLearningSettings({ maxHints: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>
          )}

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
                {t(uiLanguage, 'masteryThreshold')}: {learningSettings.autoMarkThreshold}/{learningSettings.maxMasteryLevel || 5}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={learningSettings.maxMasteryLevel || 5}
                step={1}
                value={Math.min(learningSettings.autoMarkThreshold, learningSettings.maxMasteryLevel || 5)}
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

          <View style={[styles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              {t(uiLanguage, 'maxMasteryLevel')}: {learningSettings.maxMasteryLevel || 5}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={3}
              maximumValue={10}
              step={1}
              value={learningSettings.maxMasteryLevel || 5}
              onValueChange={(value: number) => setLearningSettings({ maxMasteryLevel: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={[styles.sliderDescription, { color: colors.textSecondary }]}>
              {t(uiLanguage, 'maxMasteryLevelDesc')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Bell color={colors.success} size={20} /> {t(uiLanguage, 'notificationReminders')}
          </Text>
          
          <View style={[styles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeOption}>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(uiLanguage, 'enableNotifications')}</Text>
            </View>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notificationSettings.enabled ? colors.primary : colors.textTertiary}
            />
          </View>

          {notificationSettings.enabled && (
            <View style={styles.notificationTimesContainer}>
              {notificationSettings.times.map((time, index) => (
                <View key={index} style={[styles.notificationTimeRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => openTimePicker(index)}
                  >
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {time.hour.toString().padStart(2, '0')}:{time.minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.removeTimeButton, { backgroundColor: colors.error + '20' }]}
                    onPress={() => handleRemoveNotificationTime(index)}
                  >
                    <Trash2 color={colors.error} size={18} />
                  </TouchableOpacity>
                </View>
              ))}

              {showTimePicker !== null && (
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => handleTimeChange(showTimePicker, event, date)}
                />
              )}

              {notificationSettings.times.length < 5 && (
                <TouchableOpacity
                  style={[styles.addTimeButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                  onPress={handleAddNotificationTime}
                >
                  <Plus color={colors.primary} size={20} />
                  <Text style={[styles.addTimeButtonText, { color: colors.primary }]}>
                    {t(uiLanguage, 'addNotificationTime')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={[styles.dyslexiaInfo, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'notificationInfo')}
          </Text>
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

          <TouchableOpacity
            style={styles.myProjectsButton}
            onPress={handleMyProjects}
            activeOpacity={0.8}
          >
            <Folder color="#3B82F6" size={20} />
            <Text style={styles.myProjectsButtonText}>{t(uiLanguage, 'myProjects')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aboutButton}
            onPress={() => setShowAboutModal(true)}
            activeOpacity={0.8}
          >
            <Info color={colors.primary} size={20} />
            <Text style={[styles.aboutButtonText, { color: colors.primary }]}>{t(uiLanguage, 'about')}</Text>
          </TouchableOpacity>
          
          <Text style={[styles.footerText, { color: colors.textTertiary, marginTop: 24 }]}>
            {t(uiLanguage, 'footerText')}
          </Text>

          <TouchableOpacity
            style={styles.githubButton}
            onPress={handleGithub}
            activeOpacity={0.7}
          >
            <Github color={colors.textTertiary} size={24} />
          </TouchableOpacity>

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

      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t(uiLanguage, 'about')}</Text>
              <TouchableOpacity
                onPress={() => setShowAboutModal(false)}
                style={styles.closeButton}
              >
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'version')}:</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.3</Text>
              
              <Text style={[styles.aboutLabel, { color: colors.textSecondary, marginTop: 24 }]}>{t(uiLanguage, 'credits')}:</Text>
              <View style={styles.creditItem}>
                <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>- {t(uiLanguage, 'application')}:</Text>
                <Text style={[styles.creditValue, { color: colors.text }]}>Timothée M.</Text>
              </View>
              <View style={styles.creditItem}>
                <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>- {t(uiLanguage, 'notificationIcon')}:</Text>
                <Text style={[styles.creditValue, { color: colors.text }]}>Juicy_Fish</Text>
              </View>
              <View style={styles.creditItem}>
                <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>- {t(uiLanguage, 'notificationSound')}:</Text>
                <Text style={[styles.creditValue, { color: colors.text }]}>uppbeat.io</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCustomVersionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomVersionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t(uiLanguage, 'importCustomVersion')}</Text>
              <TouchableOpacity
                onPress={() => setShowCustomVersionModal(false)}
                style={styles.closeButton}
              >
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.customVersionDescription, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'customVersionDescription')}
              </Text>

              <TouchableOpacity
                style={[styles.faqButton, { backgroundColor: colors.info + '20', borderColor: colors.info }]}
                onPress={handleOpenFAQ}
              >
                <Info color={colors.info} size={18} />
                <Text style={[styles.faqButtonText, { color: colors.info }]}>{t(uiLanguage, 'viewFormatGuide')}</Text>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t(uiLanguage, 'enterUrl')}:</Text>
              <TextInput
                style={[styles.urlInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder={t(uiLanguage, 'urlPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={customUrl}
                onChangeText={setCustomUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
                onPress={handleLoadFromUrl}
                disabled={isLoadingCustomVersion}
              >
                {isLoadingCustomVersion ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <LinkIcon color="#fff" size={20} />
                    <Text style={styles.modalActionButtonText}>{t(uiLanguage, 'loadFromUrl')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t(uiLanguage, 'or')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: colors.warning }]}
                onPress={handleImportCustomVersion}
                disabled={isLoadingCustomVersion}
              >
                {isLoadingCustomVersion ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FileText color="#fff" size={20} />
                    <Text style={styles.modalActionButtonText}>{t(uiLanguage, 'importLocalFile')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500" as const,
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
    marginBottom: 12,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#991B1B",
  },
  myProjectsButton: {
    backgroundColor: "#DBEAFE",
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
  myProjectsButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1E40AF",
  },
  footerText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: "center" as const,
    fontStyle: "italic" as const,
  },
  accountInfo: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 20,
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
  aboutButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    marginTop: 12,
  },
  aboutButtonText: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    gap: 8,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 18,
    fontWeight: "500" as const,
  },
  creditItem: {
    marginTop: 8,
  },
  creditLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  creditValue: {
    fontSize: 16,
    fontWeight: "500" as const,
    marginLeft: 16,
  },
  ttsSpeedContainer: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 12,
  },
  ttsSpeedOption: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  ttsSpeedText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  voicesContainer: {
    gap: 8,
  },
  voiceOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  voiceInfo: {
    flex: 1,
    marginRight: 12,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: "600" as const,
    flex: 1,
  },
  voiceNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },

  voiceLanguage: {
    fontSize: 12,
    marginTop: 2,
  },
  voiceActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  voiceTestButton: {
    padding: 8,
    borderRadius: 8,
  },
  voiceLoadingContainer: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 12,
  },
  voiceLoadingText: {
    fontSize: 14,
  },
  voiceEmptyContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  voiceEmptyText: {
    fontSize: 14,
    textAlign: "center" as const,
  },
  customVersionButton: {
    padding: 14,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    borderWidth: 2,
    marginTop: 12,
  },
  customVersionButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  customVersionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  faqButton: {
    padding: 12,
    borderRadius: 10,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  faqButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  urlInput: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActionButton: {
    padding: 14,
    borderRadius: 10,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  modalActionButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#fff",
  },
  divider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  githubButton: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 12,
    marginTop: 16,
  },
  notificationTimesContainer: {
    gap: 8,
    marginTop: 12,
  },
  notificationTimeRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeButton: {
    flex: 1,
    padding: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  removeTimeButton: {
    padding: 8,
    borderRadius: 8,
  },
  addTimeButton: {
    padding: 14,
    borderRadius: 12,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    borderWidth: 2,
    marginTop: 8,
  },
  addTimeButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
