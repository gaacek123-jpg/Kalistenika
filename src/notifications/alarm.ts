// Prawdziwy budzik treningowy przez Notifee: pełnoekranowy alarm, dzwoni do skutku,
// dokładny AlarmManager (działa w Doze), akcje Wyłącz / Drzemka. Tylko Android.
// Godziny oznaczone jako `alarm` w konfiguracji idą tędy; reszta zostaje na expo-notifications.

import { Platform } from 'react-native';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import { intraday } from '../data/reminders';

// v2: nowy ID wymusza utworzenie kanału od nowa z własnym dźwiękiem + wibracją
// (kanałów Androida NIE da się zaktualizować po utworzeniu).
export const ALARM_CHANNEL = 'alarm-fullscreen-v2';
const ALARM_SOUND = 'alarm'; // assets/alarm.wav spakowany przez expo-notifications
const ID_PREFIX = 'alarm-';
// Dni treningowe w numeracji JS getDay(): pon=1, śr=3, pt=5.
const TRAINING_WEEKDAYS = [1, 3, 5];
export const SNOOZE_MINUTES = 5;

export async function ensureAlarmChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: ALARM_CHANNEL,
    name: 'Budzik treningowy',
    importance: AndroidImportance.HIGH,
    sound: ALARM_SOUND,
    vibration: true,
    vibrationPattern: [400, 600, 400, 600, 400, 600],
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: true,
  });
}

export async function requestAlarmPermission() {
  if (Platform.OS === 'web') return;
  await notifee.requestPermission();
}

/** Czy system pozwala na DOKŁADNE alarmy (Android 12+). */
export async function exactAlarmAllowed(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const s = await notifee.getNotificationSettings();
  return s.android.alarm === AndroidNotificationSetting.ENABLED;
}

/** Otwiera systemowy ekran „Alarmy i przypomnienia" (gdy dokładne alarmy zablokowane). */
export async function openExactAlarmSettings() {
  if (Platform.OS !== 'android') return;
  await notifee.openAlarmPermissionSettings();
}

function nextOccurrence(jsWeekday: number, hour: number, minute: number): number {
  const now = new Date();
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  let add = (jsWeekday - now.getDay() + 7) % 7;
  if (add === 0 && d.getTime() <= now.getTime()) add = 7; // dziś już po godzinie → za tydzień
  d.setDate(d.getDate() + add);
  return d.getTime();
}

function alarmNotification(id: string, body: string, title: string) {
  return {
    id,
    title,
    body,
    android: {
      channelId: ALARM_CHANNEL,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: ALARM_SOUND,
      vibrationPattern: [400, 600, 400, 600, 400, 600],
      fullScreenAction: { id: 'alarm' },
      pressAction: { id: 'alarm' },
      loopSound: true,
      ongoing: true,
      autoCancel: false,
      color: '#E0A200',
      actions: [
        { title: 'Wyłącz', pressAction: { id: 'dismiss' } },
        { title: `Drzemka ${SNOOZE_MINUTES} min`, pressAction: { id: 'snooze' } },
      ],
    },
  };
}

export async function cancelAlarms() {
  if (Platform.OS !== 'android') return;
  const ids = await notifee.getTriggerNotificationIds();
  await Promise.all(
    ids.filter((id) => id.startsWith(ID_PREFIX)).map((id) => notifee.cancelTriggerNotification(id)),
  );
}

/** Planuje pełnoekranowe budziki dla godzin oznaczonych `alarm` (pon/śr/pt, tygodniowo). */
export async function scheduleAlarms(
  enabled: boolean,
  times: { hour: number; minute: number; alarm: boolean }[],
) {
  if (Platform.OS !== 'android') return;
  await ensureAlarmChannel();
  await cancelAlarms();
  if (!enabled) return;

  const alarmTimes = times.filter((t) => t.alarm);
  for (const t of alarmTimes) {
    for (const wd of TRAINING_WEEKDAYS) {
      const line = intraday(4); // najostrzejszy poziom tekstu (budzik)
      const id = `${ID_PREFIX}${wd}-${t.hour}-${t.minute}`;
      await notifee.createTriggerNotification(
        alarmNotification(id, line.body, line.title || '⏰ Budzik'),
        {
          type: TriggerType.TIMESTAMP,
          timestamp: nextOccurrence(wd, t.hour, t.minute),
          repeatFrequency: RepeatFrequency.WEEKLY,
          alarmManager: { allowWhileIdle: true },
        },
      );
    }
  }
}

/** Drzemka: jednorazowy alarm za SNOOZE_MINUTES. */
export async function snoozeAlarm() {
  if (Platform.OS !== 'android') return;
  const line = intraday(4);
  await notifee.createTriggerNotification(
    alarmNotification(`${ID_PREFIX}snooze-${Date.now()}`, line.body, line.title || '⏰ Budzik (drzemka)'),
    {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + SNOOZE_MINUTES * 60000,
      alarmManager: { allowWhileIdle: true },
    },
  );
}

/** Wyłącza dzwoniący alarm (zatrzymuje dźwięk pętli). */
export async function stopAlarm(notificationId?: string) {
  if (Platform.OS !== 'android') return;
  if (notificationId) await notifee.cancelDisplayedNotification(notificationId);
  else await notifee.cancelAllNotifications();
}

/** Natychmiastowy test budzika (Ustawienia). */
export async function fireAlarmTest() {
  if (Platform.OS !== 'android') return;
  await ensureAlarmChannel();
  await notifee.createTriggerNotification(
    alarmNotification(`${ID_PREFIX}test`, 'Test budzika — słychać i widać na pełnym ekranie?', '⏰ Test budzika'),
    { type: TriggerType.TIMESTAMP, timestamp: Date.now() + 3000, alarmManager: { allowWhileIdle: true } },
  );
}
