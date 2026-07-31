// Pomocniki snu: liczenie godzin z segmentów (noc bywa „przez północ").

import { SleepSegment } from '../types';

/** Długość segmentu w godzinach. Jeśli koniec ≤ początek, traktujemy jako przez północ (+24h). */
export function segmentHours(s: SleepSegment): number {
  const [h1, m1] = s.start.split(':').map((x) => parseInt(x, 10));
  const [h2, m2] = s.end.split(':').map((x) => parseInt(x, 10));
  if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return 0;
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

export function totalSleepHours(segments: SleepSegment[]): number {
  return segments.reduce((s, seg) => s + segmentHours(seg), 0);
}

export function napHours(segments: SleepSegment[]): number {
  return segments.filter((s) => s.nap).reduce((s, seg) => s + segmentHours(seg), 0);
}

export function nightSegment(segments: SleepSegment[]): SleepSegment | undefined {
  return segments.find((s) => !s.nap);
}

export function fmtHours(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm ? `${hh}h ${mm}min` : `${hh}h`;
}
