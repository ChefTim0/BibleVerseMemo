import { Platform } from 'react-native';
import type { NotificationTime } from '../types/database';

let Notifications: any = null;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleVerseReminderNotification(
  hour: number = 9,
  minute: number = 0
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission || Platform.OS === 'web') {
    console.log('Notification permission not granted or on web');
    return null;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📖 Time to practice!',
      body: 'Review your verses to maintain your streak',
      data: { type: 'daily_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });

  return identifier;
}

export async function scheduleMultipleReminders(
  times: NotificationTime[]
): Promise<string[]> {
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission || Platform.OS === 'web') {
    console.log('Notification permission not granted or on web');
    return [];
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const identifiers: string[] = [];

  for (const time of times) {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📖 Temps de s\'exercer !',
        body: 'Révisez vos versets pour progresser',
        data: { type: 'daily_reminder', hour: time.hour, minute: time.minute },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    });
    identifiers.push(identifier);
    console.log(`[Notifications] Scheduled notification at ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
  }

  return identifiers;
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  if (Platform.OS === 'web') {
    return [];
  }
  return await Notifications.getAllScheduledNotificationsAsync();
}
