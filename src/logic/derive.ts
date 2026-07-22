// Logika pochodna: rotacja A/B, opuszczone sesje, rekordy, progresja, deload, statystyki.

import {
  AppData,
  Exercise,
  PersonalRecord,
  Session,
  SessionSlot,
  SessionTemplate,
  SessionType,
} from '../types';
import { EXERCISES, TEMPLATES } from '../data/plan';
import { addDays, isTrainingDay, startOfDay } from './dates';

/** Typ następnej sesji = przeciwny do ostatniej WYKONANEJ (nie zaplanowanej).
 *  Dzięki temu opuszczony trening nie rozjeżdża rotacji. Domyślnie A. */
export function nextSessionType(sessions: Session[]): SessionType {
  const completed = sessions
    .filter((s) => s.completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (completed.length === 0) return 'A';
  return completed[completed.length - 1].type === 'A' ? 'B' : 'A';
}

export function nextTemplate(data: AppData): SessionTemplate {
  return TEMPLATES[nextSessionType(data.sessions)];
}

/** Liczba opuszczonych SESJI z rzędu (dni treningowe po ostatniej wykonanej,
 *  bez dzisiaj i bez weekendów — weekend nie podbija licznika). */
export function missedInARow(sessions: Session[]): number {
  const completed = sessions
    .filter((s) => s.completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  const today = startOfDay(new Date());
  const floor = completed.length
    ? startOfDay(new Date(completed[completed.length - 1].date))
    : addDays(today, -21);

  let count = 0;
  let d = addDays(today, -1); // dzisiaj jeszcze nie liczymy jako opuszczone
  while (d.getTime() > floor.getTime()) {
    if (isTrainingDay(d)) count++;
    if (count >= 3) break;
    d = addDays(d, -1);
  }
  return count;
}

// ── Rekordy osobiste ───────────────────────────────────────────────

/** Zwraca zaktualizowaną listę rekordów oraz listę nowo pobitych (do gratulacji). */
export function updateRecords(
  data: AppData,
  session: Session,
): { records: PersonalRecord[]; beaten: PersonalRecord[] } {
  const records = [...data.records];
  const beaten: PersonalRecord[] = [];

  for (const set of session.sets) {
    if (!set.done) continue;
    const value = set.reps ?? set.seconds ?? 0;
    if (value <= 0) continue;
    const unit: 'reps' | 'seconds' = set.reps != null ? 'reps' : 'seconds';
    const idx = records.findIndex(
      (r) => r.exerciseId === set.exerciseId && r.levelId === set.levelId,
    );
    if (idx === -1) {
      const rec = { exerciseId: set.exerciseId, levelId: set.levelId, value, unit, date: session.date };
      records.push(rec);
      beaten.push(rec);
    } else if (value > records[idx].value) {
      records[idx] = { ...records[idx], value, date: session.date };
      beaten.push(records[idx]);
    }
  }
  return { records, beaten };
}

export function recordFor(
  records: PersonalRecord[],
  exerciseId: string,
  levelId: string,
): PersonalRecord | undefined {
  return records.find((r) => r.exerciseId === exerciseId && r.levelId === levelId);
}

// ── Progresja (drabinki) ───────────────────────────────────────────

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES[id];
}

export function currentLevel(data: AppData, exerciseId: string) {
  const ex = EXERCISES[exerciseId];
  if (!ex) return undefined;
  const id = data.levels[exerciseId] ?? ex.levels[0].id;
  return ex.levels.find((l) => l.id === id) ?? ex.levels[0];
}

/** Czy w tej sesji spełniono warunek awansu dla danego slotu:
 *  górna granica powtórzeń osiągnięta we WSZYSTKICH seriach (spec §2.3). */
export function metAdvanceCriteria(
  slot: SessionSlot,
  slotIndex: number,
  session: Session,
  levelId: string,
): boolean {
  if (slot.repsMax <= 0) return false; // sloty "max" nie mają twardego progu awansu
  const sets = session.sets.filter(
    (s) => s.slotIndex === slotIndex && s.levelId === levelId && s.done,
  );
  if (sets.length < slot.sets) return false;
  return sets.every((s) => (s.reps ?? s.seconds ?? 0) >= slot.repsMax);
}

/** Zwraca kolejny poziom drabinki, jeśli istnieje. */
export function nextLevelId(exerciseId: string, levelId: string): string | null {
  const ex = EXERCISES[exerciseId];
  if (!ex) return null;
  const i = ex.levels.findIndex((l) => l.id === levelId);
  if (i === -1 || i + 1 >= ex.levels.length) return null;
  return ex.levels[i + 1].id;
}

// ── Deload ─────────────────────────────────────────────────────────

/** Sugestia deloadu co 6–8 tygodni, licząc od pierwszej sesji, z resetem po deloadzie. */
export function deloadDue(data: AppData): { due: boolean; weeks: number } {
  const from = data.lastDeloadDate ?? data.firstSessionDate;
  if (!from) return { due: false, weeks: 0 };
  const weeks = Math.floor((Date.now() - new Date(from).getTime()) / (7 * 86400000));
  return { due: weeks >= 6, weeks };
}

// ── Statystyki ─────────────────────────────────────────────────────

/** Objętość sesji = suma powtórzeń + sekundy izometryczne/4 (przybliżenie). */
export function sessionVolume(session: Session): number {
  return session.sets.reduce((acc, s) => {
    if (!s.done) return acc;
    if (s.reps != null) return acc + s.reps;
    if (s.seconds != null) return acc + s.seconds / 4;
    return acc;
  }, 0);
}

export function totalCompleted(sessions: Session[]): number {
  return sessions.filter((s) => s.completed).length;
}

/** Prosta seria: liczba kolejnych zaplanowanych sesji wykonanych bez opuszczenia. */
export function currentStreak(sessions: Session[]): number {
  return totalCompleted(sessions) > 0 && missedInARow(sessions) === 0
    ? countStreak(sessions)
    : 0;
}

function countStreak(sessions: Session[]): number {
  // liczymy wykonane sesje wstecz aż do pierwszego opuszczenia
  const completedDates = new Set(
    sessions.filter((s) => s.completed).map((s) => s.date.slice(0, 10)),
  );
  let streak = 0;
  let d = startOfDay(new Date());
  // od dziś wstecz; jeśli dziś nietreningowy lub jeszcze nietrenowany, cofamy
  for (let i = 0; i < 400; i++) {
    if (isTrainingDay(d)) {
      const key = ymdLocal(d);
      if (completedDates.has(key)) streak++;
      else if (d.getTime() < startOfDay(new Date()).getTime()) break; // opuszczony miniony dzień kończy serię
    }
    d = addDays(d, -1);
  }
  return streak;
}

function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}
