// Powiadomienia lokalne (expo-notifications) — powód wyboru apki natywnej.
// Planowane z wyprzedzeniem, tygodniowo, tylko pon/śr/pt. Weekend cichy.
// Ostatnie przypomnienie dnia idzie kanałem alarmowym (MAX + dźwięk) — „budzik".

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { ReminderConfig } from '../types';
import { intraday, journalLine } from '../data/reminders';

export const CH_REMINDER = 'reminders';
export const CH_ALARM = 'training-alarm';

// Dni treningowe w numeracji expo (1=Nd ... 7=Sob): pon=2, śr=4, pt=6.
const TRAINING_WEEKDAYS = [2, 4, 6];

let handlerSet = false;

export function configureHandler() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CH_REMINDER, {
    name: 'Przypomnienia',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 200, 120, 200],
    enableVibrate: true,
  });
  await Notifications.setNotificationChannelAsync(CH_ALARM, {
    name: 'Budzik treningowy',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    enableVibrate: true,
    bypassDnd: false,
    lightColor: '#E0A200',
  });
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) {
    // Emulator też potrafi, ale nie gwarantujemy.
  }
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

export async function cancelAll() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Przeplanowuje wszystkie przypomnienia zgodnie z konfiguracją. */
export async function rescheduleAll(config: ReminderConfig) {
  if (Platform.OS === 'web') return;
  await cancelAll();
  if (!config.enabled) return;
  await ensureChannels(); // kanały muszą istnieć ZANIM cokolwiek do nich zaplanujemy

  // Trening: dla każdego dnia pon/śr/pt i każdej godziny — tygodniowy repeat.
  for (const weekday of TRAINING_WEEKDAYS) {
    for (let i = 0; i < config.trainingTimes.length; i++) {
      const t = config.trainingTimes[i];
      if (t.alarm) continue; // budziki obsługuje Notifee (pełnoekranowo) — patrz alarm.ts
      const line = intraday(i);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: line.title || 'Trening',
          body: line.body,
          sound: 'default',
          ...(Platform.OS === 'android'
            ? { channelId: t.alarm ? CH_ALARM : CH_REMINDER }
            : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: t.hour,
          minute: t.minute,
        },
      });
    }
  }

  // Dziennik: codziennie o wskazanej godzinie.
  if (config.journalEnabled) {
    const line = journalLine();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: line.title,
        body: line.body,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CH_REMINDER } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: config.journalTime.hour,
        minute: config.journalTime.minute,
      },
    });
  }
}

/** Natychmiastowe testowe powiadomienie (przycisk w Ustawieniach). */
export async function fireTest() {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Test',
      body: 'Drążek testuje łączność. Słychać?',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: CH_ALARM } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
  });
}

export async function scheduledCount(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.length;
}
