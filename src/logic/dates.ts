// Pomocniki dat — wszystko w czasie lokalnym.

export function ymd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 0=Nd ... 6=Sob. Dni treningowe: pon(1) / śr(3) / pt(5). */
export function isTrainingDay(d: Date): boolean {
  const g = d.getDay();
  return g === 1 || g === 3 || g === 5;
}

export function isSaturday(d: Date): boolean {
  return d.getDay() === 6;
}

export function isWeekend(d: Date): boolean {
  const g = d.getDay();
  return g === 0 || g === 6;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

const DOW = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${DOW[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}.${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}`;
}

export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
