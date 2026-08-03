// Centralny stan aplikacji: ładowanie/zapisywanie + akcje domenowe.

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityEntry, AppData, DayLog, JointCheck, MealEntry, PersonalRecord, ReminderConfig, Session } from '../types';
import { emptyData, loadData, saveData } from './storage';
import { TEMPLATES } from '../data/plan';
import { metAdvanceCriteria, nextLevelId, updateRecords } from '../logic/derive';
import { ymd } from '../logic/dates';
import { rescheduleAll } from '../notifications/notify';
import { scheduleAlarms } from '../notifications/alarm';

const syncNotifications = (reminders: AppData['reminders']) => {
  rescheduleAll(reminders).catch(() => {});
  scheduleAlarms(reminders.enabled, reminders.trainingTimes).catch(() => {});
};

type SaveResult = {
  beatenRecords: PersonalRecord[];
  advancedExercises: { exerciseId: string; newLevelId: string }[];
};

type Ctx = {
  data: AppData;
  loading: boolean;
  saveSession: (session: Session, joint: { elbowPain: boolean; shoulderPain: boolean }) => SaveResult;
  setLevel: (exerciseId: string, levelId: string) => void;
  getDay: (date: string) => DayLog;
  patchDay: (date: string, patch: Partial<DayLog>) => void;
  addMeal: (date: string, time: string, text: string, photo?: string) => void;
  updateMeal: (date: string, id: string, patch: Partial<MealEntry>) => void;
  deleteMeal: (date: string, id: string) => void;
  addActivity: (date: string, name: string, minutes: number | null) => void;
  deleteActivity: (date: string, id: string) => void;
  incrementGtg: (delta: number, date?: string) => void;
  setWalk: (date: string, done: boolean, note?: string) => void;
  updateReminders: (config: ReminderConfig) => void;
  markDeloadDone: () => void;
  replaceAll: (next: AppData) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp poza providerem');
  return c;
}

const emptyDay = (date: string): DayLog => ({
  date,
  gtgReps: 0,
  gtgSets: 0,
  mealEntries: [],
  mood: null,
  emotions: [],
  emotionReason: '',
  sleepSegments: [],
  sleepHours: null,
  sleepQuality: null,
  walkDone: null,
  walkNote: '',
  activities: [],
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData());
  const [loading, setLoading] = useState(true);
  const persist = useRef<AppData>(data);

  // Utrwalamy najświeższy stan i zapisujemy po każdej zmianie.
  useEffect(() => {
    persist.current = data;
    if (!loading) saveData(data);
  }, [data, loading]);

  useEffect(() => {
    (async () => {
      const loaded = await loadData();
      setData(loaded);
      setLoading(false);
      // Ustaw powiadomienia zgodnie z zapisaną konfiguracją.
      syncNotifications(loaded.reminders);
    })();
  }, []);

  const api = useMemo<Ctx>(() => {
    const saveSession: Ctx['saveSession'] = (session, joint) => {
      const result: SaveResult = { beatenRecords: [], advancedExercises: [] };
      setData((prev) => {
        const { records, beaten } = updateRecords(prev, session);
        result.beatenRecords = beaten;

        // Progresja: awansuj poziomy, których kryterium spełniono.
        const template = TEMPLATES[session.type];
        const levels = { ...prev.levels };
        template.slots.forEach((slot, i) => {
          const levelId = levels[slot.exerciseId];
          if (levelId && metAdvanceCriteria(slot, i, session, levelId)) {
            const nxt = nextLevelId(slot.exerciseId, levelId);
            if (nxt) {
              levels[slot.exerciseId] = nxt;
              result.advancedExercises.push({ exerciseId: slot.exerciseId, newLevelId: nxt });
            }
          }
        });

        const jointCheck: JointCheck = {
          sessionId: session.id,
          date: session.date,
          elbowPain: joint.elbowPain,
          shoulderPain: joint.shoulderPain,
        };

        return {
          ...prev,
          sessions: [...prev.sessions, session],
          records,
          levels,
          jointChecks: [...prev.jointChecks, jointCheck],
          firstSessionDate: prev.firstSessionDate ?? session.date,
        };
      });
      return result;
    };

    const setLevel: Ctx['setLevel'] = (exerciseId, levelId) => {
      setData((p) => ({ ...p, levels: { ...p.levels, [exerciseId]: levelId } }));
    };

    const getDay: Ctx['getDay'] = (date) =>
      persist.current.days.find((d) => d.date === date) ?? emptyDay(date);

    const patchDay: Ctx['patchDay'] = (date, patch) => {
      setData((p) => {
        const idx = p.days.findIndex((d) => d.date === date);
        const base = idx === -1 ? emptyDay(date) : p.days[idx];
        const merged = { ...base, ...patch };
        const days = idx === -1 ? [...p.days, merged] : p.days.map((d, i) => (i === idx ? merged : d));
        return { ...p, days };
      });
    };

    const mutateMeals = (date: string, fn: (entries: MealEntry[]) => MealEntry[]) => {
      setData((p) => {
        const idx = p.days.findIndex((d) => d.date === date);
        const base = idx === -1 ? emptyDay(date) : p.days[idx];
        const merged: DayLog = { ...base, mealEntries: fn(base.mealEntries ?? []) };
        const days = idx === -1 ? [...p.days, merged] : p.days.map((d, i) => (i === idx ? merged : d));
        return { ...p, days };
      });
    };

    const addMeal: Ctx['addMeal'] = (date, time, text, photo) => {
      const entry: MealEntry = { id: `m-${Date.now()}`, time, text, ...(photo ? { photo } : {}) };
      mutateMeals(date, (e) => [...e, entry].sort((a, b) => a.time.localeCompare(b.time)));
    };

    const updateMeal: Ctx['updateMeal'] = (date, id, patch) => {
      mutateMeals(date, (e) =>
        e.map((m) => (m.id === id ? { ...m, ...patch } : m)).sort((a, b) => a.time.localeCompare(b.time)),
      );
    };

    const deleteMeal: Ctx['deleteMeal'] = (date, id) => {
      mutateMeals(date, (e) => e.filter((m) => m.id !== id));
    };

    const addActivity: Ctx['addActivity'] = (date, name, minutes) => {
      const entry: ActivityEntry = { id: `a-${Date.now()}`, name, minutes };
      setData((p) => {
        const idx = p.days.findIndex((d) => d.date === date);
        const base = idx === -1 ? emptyDay(date) : p.days[idx];
        const merged: DayLog = { ...base, activities: [...(base.activities ?? []), entry] };
        const days = idx === -1 ? [...p.days, merged] : p.days.map((d, i) => (i === idx ? merged : d));
        return { ...p, days };
      });
    };

    const deleteActivity: Ctx['deleteActivity'] = (date, id) => {
      setData((p) => {
        const idx = p.days.findIndex((d) => d.date === date);
        if (idx === -1) return p;
        const base = p.days[idx];
        const merged: DayLog = { ...base, activities: (base.activities ?? []).filter((a) => a.id !== id) };
        return { ...p, days: p.days.map((d, i) => (i === idx ? merged : d)) };
      });
    };

    const incrementGtg: Ctx['incrementGtg'] = (delta, date) => {
      const target = date ?? ymd();
      setData((p) => {
        const idx = p.days.findIndex((d) => d.date === target);
        const base = idx === -1 ? emptyDay(target) : p.days[idx];
        const merged: DayLog = {
          ...base,
          gtgSets: Math.max(0, base.gtgSets + (delta > 0 ? 1 : -1)),
          gtgReps: Math.max(0, base.gtgReps + delta),
        };
        const days = idx === -1 ? [...p.days, merged] : p.days.map((d, i) => (i === idx ? merged : d));
        return { ...p, days };
      });
    };

    const setWalk: Ctx['setWalk'] = (date, done, note) => {
      patchDay(date, { walkDone: done, ...(note !== undefined ? { walkNote: note } : {}) });
    };

    const updateReminders: Ctx['updateReminders'] = (config) => {
      setData((p) => ({ ...p, reminders: config }));
      syncNotifications(config);
    };

    const markDeloadDone: Ctx['markDeloadDone'] = () => {
      setData((p) => ({ ...p, lastDeloadDate: new Date().toISOString() }));
    };

    const replaceAll: Ctx['replaceAll'] = (next) => {
      setData(next);
      syncNotifications(next.reminders);
    };

    return {
      data,
      loading,
      saveSession,
      setLevel,
      getDay,
      patchDay,
      addMeal,
      updateMeal,
      deleteMeal,
      addActivity,
      deleteActivity,
      incrementGtg,
      setWalk,
      updateReminders,
      markDeloadDone,
      replaceAll,
    };
    // data i loading zmieniają referencję; reszta akcji jest stabilna względem setData.
  }, [data, loading]);

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}
