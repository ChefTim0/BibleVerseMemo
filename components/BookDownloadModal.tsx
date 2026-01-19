import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Download, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useApp } from '../contexts/AppContext';
import { t } from '../constants/translations';
import { getColors } from '../constants/colors';
import { downloadBook, type DownloadProgress } from '../services/BookDownloadService';

interface BookDownloadModalProps {
  visible: boolean;
  onClose: () => void;
  onDownloadComplete: () => void;
}

export function BookDownloadModal({ visible, onClose, onDownloadComplete }: BookDownloadModalProps) {
  const { language, uiLanguage, theme } = useApp();
  const colors = getColors(theme);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      await downloadBook(language, (progressData) => {
        setProgress(progressData);
      });

      onDownloadComplete();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      console.error('[BookDownloadModal] Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Download color={colors.primary} size={48} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t(uiLanguage, 'downloadBooksTitle')}
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'downloadBooksDescription')}
          </Text>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <AlertCircle color={colors.error} size={20} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {progress && progress.status === 'downloading' && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'downloading')}... {Math.round((progress.progress / progress.total) * 100)}%
              </Text>
            </View>
          )}

          {progress && progress.status === 'completed' && (
            <View style={[styles.successContainer, { backgroundColor: colors.success + '20' }]}>
              <CheckCircle color={colors.success} size={20} />
              <Text style={[styles.successText, { color: colors.success }]}>
                {t(uiLanguage, 'downloadComplete')}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.laterButton, { backgroundColor: colors.border }]}
              onPress={handleLater}
              disabled={downloading}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'later')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.downloadButton, { backgroundColor: colors.primary }]}
              onPress={handleDownload}
              disabled={downloading}
              activeOpacity={0.7}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.downloadButtonText}>
                  {t(uiLanguage, 'downloadNow')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
  },
  successContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  laterButton: {
    borderWidth: 0,
  },
  downloadButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
