// Wspólna obsługa akcji budzika (Wyłącz / Drzemka), używana w tle i na pierwszym planie.

import { EventType } from '@notifee/react-native';
import { snoozeAlarm, stopAlarm } from './alarm';

export type AlarmAction = 'dismiss' | 'snooze' | null;

/** Obsługuje naciśnięcie akcji z powiadomienia budzika. Zwraca co zrobiono. */
export async function handleAlarmEvent(type: EventType, detail: any): Promise<AlarmAction> {
  const pressId: string | undefined = detail?.pressAction?.id;
  const notifId: string | undefined = detail?.notification?.id;

  if (type === EventType.ACTION_PRESS) {
    if (pressId === 'dismiss') {
      await stopAlarm(notifId);
      return 'dismiss';
    }
    if (pressId === 'snooze') {
      await stopAlarm(notifId);
      await snoozeAlarm();
      return 'snooze';
    }
  }
  return null;
}
