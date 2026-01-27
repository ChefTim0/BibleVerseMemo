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

  console.log('[Notifications] Requesting notification permissions...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[Notifications] Permission request result:', status);
  } else {
    console.log('[Notifications] Permission already granted');
  }
  
  if (finalStatus !== 'granted') {
    console.log('[Notifications] Notification permission not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    try {
      const alarmPermission = await Notifications.getAlarmPermissionsAsync();
      console.log('[Notifications] Alarm permission status:', alarmPermission);
      
      if (alarmPermission.status !== 'granted') {
        const alarmRequest = await Notifications.requestAlarmPermissionsAsync();
        console.log('[Notifications] Alarm permission request result:', alarmRequest);
        
        if (alarmRequest.status !== 'granted') {
          console.log('[Notifications] Exact alarm permission not granted');
          return false;
        }
      }
    } catch (error) {
      console.error('[Notifications] Error requesting alarm permissions:', error);
    }
  }
  
  return finalStatus === 'granted';
}

export async function scheduleVerseReminderNotification(
  hour: number = 9,
  minute: number = 0
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission || Platform.OS === 'web') {
    console.log('[Notifications] Notification permission not granted or on web');
    return null;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Scheduling notification for', hour, ':', minute);

  try {
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
    console.log('[Notifications] Scheduled notification with ID:', identifier);
    return identifier;
  } catch (error) {
    console.error('[Notifications] Error scheduling notification:', error);
    return null;
  }
}

export async function scheduleMultipleReminders(
  times: NotificationTime[]
): Promise<string[]> {
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission || Platform.OS === 'web') {
    console.log('[Notifications] Notification permission not granted or on web');
    return [];
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Scheduling', times.length, 'notifications');

  const identifiers: string[] = [];

  for (const time of times) {
    try {
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
      console.log(`[Notifications] Scheduled notification at ${time.hour}:${time.minute.toString().padStart(2, '0')} with ID: ${identifier}`);
    } catch (error) {
      console.error(`[Notifications] Error scheduling notification at ${time.hour}:${time.minute}:`, error);
    }
  }

  console.log('[Notifications] Successfully scheduled', identifiers.length, 'notifications');
  return identifiers;
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  console.log('[Notifications] Cancelling all scheduled notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] All notifications cancelled');
}

export async function getScheduledNotifications() {
  if (Platform.OS === 'web') {
    return [];
  }
  return await Notifications.getAllScheduledNotificationsAsync();
}
