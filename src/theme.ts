// Motyw: „karta warsztatowa / dziennik pokładowy" (spec §3.6).
// Ciemny, wysoki kontrast, monospace na liczbach i timerach, duże pola dotykowe.
// Bez gradientów, płomieni i ikon mięśni.

import { Platform } from 'react-native';

export const colors = {
  bg: '#0E0F11',
  surface: '#17191C',
  surfaceAlt: '#1F2226',
  border: '#2C2F34',
  borderStrong: '#3A3E44',

  text: '#ECEAE4', // ciepła biel
  textDim: '#9A968E',
  textFaint: '#63615C',

  accent: '#E0A200', // ochra / warsztatowy amber
  accentDim: '#8A6600',

  push: '#5B9DD9', // sesja B (push+nogi)
  pull: '#C98A5B', // sesja A (plecy)

  good: '#6FB07A',
  goodDim: '#33472F',
  warn: '#D98A3D',
  danger: '#C4553B',

  overlay: 'rgba(0,0,0,0.72)',
};

export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 36,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
};

export const font = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  small: 14,
  tiny: 12,
  // timer czytelny z 2 m
  timerHuge: 72,
  timerBig: 48,
};

/** Minimalny rozmiar celu dotykowego — obsługa kciukiem, spocone ręce. */
export const HIT = 56;

export const sessionColor = (t: 'A' | 'B') => (t === 'A' ? colors.pull : colors.push);
