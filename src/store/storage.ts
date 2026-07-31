// Persystencja: AsyncStorage (odpowiednik localStorage z narzędzia do grafików).
// Eksport/import JSON — obowiązkowo, żeby dane nie zginęły (spec §3.4).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, ReminderConfig } from '../types';
import { defaultLevels } from '../data/plan';

const KEY = 'kalistenika:data:v1';
export const DATA_VERSION = 1;

export const defaultReminders = (): ReminderConfig => ({
  enabled: true,
  // Godziny wg życzenia użytkownika: 15:30 → 17:00 → eskalacja → budzik.
  trainingTimes: [
    { hour: 15, minute: 30, alarm: false },
    { hour: 17, minute: 0, alarm: false },
    { hour: 17, minute: 45, alarm: false },
    { hour: 18, minute: 15, alarm: false },
    { hour: 18, minute: 45, alarm: true }, // budzik: kanał alarmowy z dźwiękiem
  ],
  journalEnabled: true,
  journalTime: { hour: 21, minute: 0 },
});

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    sessions: [],
    days: [],
    records: [],
    jointChecks: [],
    levels: defaultLevels(),
    reminders: defaultReminders(),
    firstSessionDate: null,
    lastDeloadDate: null,
    createdAt: new Date().toISOString(),
  };
}

/** Uzupełnia brakujące pola (migracja miękka), gdy schemat się rozrósł. */
function hydrate(raw: Partial<AppData>): AppData {
  const base = emptyData();
  const days = (raw.days ?? []).map((d: any) => {
    // Migracja: stary string `meals` → pojedynczy wpis kalendarza.
    let mealEntries = Array.isArray(d.mealEntries) ? d.mealEntries : [];
    if (mealEntries.length === 0 && typeof d.meals === 'string' && d.meals.trim()) {
      mealEntries = [{ id: `m-${d.date}`, time: '12:00', text: d.meals.trim() }];
    }
    // Migracja: pojedyncza `emotion` → tablica `emotions`.
    const emotions = Array.isArray(d.emotions)
      ? d.emotions
      : typeof d.emotion === 'string' && d.emotion
      ? [d.emotion]
      : [];
    return {
      ...d,
      mealEntries,
      emotions,
      emotionReason: d.emotionReason ?? '',
      sleepSegments: Array.isArray(d.sleepSegments) ? d.sleepSegments : [],
      sleepHours: d.sleepHours ?? null,
      sleepQuality: d.sleepQuality ?? null,
      activities: Array.isArray(d.activities) ? d.activities : [],
    };
  });
  return {
    ...base,
    ...raw,
    days,
    levels: { ...base.levels, ...(raw.levels ?? {}) },
    reminders: { ...base.reminders, ...(raw.reminders ?? {}) },
    version: DATA_VERSION,
  };
}

export async function loadData(): Promise<AppData> {
  try {
    const s = await AsyncStorage.getItem(KEY);
    if (!s) return emptyData();
    return hydrate(JSON.parse(s));
  } catch (e) {
    console.warn('loadData failed, using empty', e);
    return emptyData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('saveData failed', e);
  }
}

export function serialize(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseImport(text: string): AppData {
  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed == null) throw new Error('Nieprawidłowy plik');
  return hydrate(parsed);
}
