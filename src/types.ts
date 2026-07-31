// Model danych — na podstawie KALISTENIKA_APP_SPEC.md §3.3, lekko rozszerzony
// o pola potrzebne w praktyce (id sesji, znaczniki czasu).

export type SessionType = 'A' | 'B';

export type Scale5 = 1 | 2 | 3 | 4 | 5;

/** Pojedynczy poziom w drabince progresji danego ćwiczenia. */
export type ExerciseLevel = {
  id: string;
  name: string; // "Pompki diamentowe"
  order: number; // pozycja w drabince
  instructions: string; // technika, najczęstsze błędy
  cues: string[]; // krótkie hasła-przypomnienia (na ekranie sesji)
  videoUrl?: string; // opcjonalny link do techniki
  isometric: boolean; // czy mierzymy czas zamiast powtórzeń
};

/** Definicja ćwiczenia wraz z drabinką progresji. Cele (serie/powt.) zależą od
 *  konkretnej sesji, więc trzymamy je w SessionSlot, nie tutaj. */
export type Exercise = {
  id: string;
  name: string; // "Pompki"
  ladderLabel: string; // krótka nazwa drabinki, np. "pompki"
  levels: ExerciseLevel[];
};

/** Jedno miejsce w szablonie sesji: które ćwiczenie i z jakim celem. */
export type SessionSlot = {
  exerciseId: string;
  sets: number;
  repsMin: number; // dla izometrycznych: sekundy
  repsMax: number;
  restSeconds: number;
  note?: string; // np. "max −2", "5 s opuszczania", "na stronę"
  toFailure?: boolean; // cel "max"
};

export type SessionTemplate = {
  type: SessionType;
  title: string;
  slots: SessionSlot[];
};

/** Log jednej serii wykonanej w sesji. */
export type SetLog = {
  slotIndex: number; // które miejsce w szablonie (rozróżnia to samo ćwiczenie w 2 slotach)
  exerciseId: string;
  levelId: string;
  setNumber: number;
  reps: number | null; // null dla izometrycznych
  seconds: number | null; // null dla powtórzeniowych
  toFailure: boolean;
  done: boolean;
};

export type Session = {
  id: string;
  date: string; // ISO
  type: SessionType;
  sets: SetLog[];
  durationMinutes: number;
  moodBefore: Scale5 | null;
  energyAfter: Scale5 | null;
  soreness: Scale5 | null;
  notes: string;
  completed: boolean;
};

/** Segment snu: noc lub drzemka, ze znacznikami początku i końca (HH:MM). */
export type SleepSegment = {
  id: string;
  start: string; // "HH:MM" (dla nocy: godzina zaśnięcia, zwykle poprzedni wieczór)
  end: string; // "HH:MM" (godzina pobudki)
  nap: boolean; // true = drzemka, false = sen główny (noc)
};

/** Pojedynczy wpis jedzeniowy — freetext ze znacznikiem godziny (jak spotkanie w kalendarzu). */
export type MealEntry = {
  id: string;
  time: string; // "HH:MM"
  text: string; // wolny tekst, bez liczenia kalorii
};

/** Inna aktywność fizyczna dnia (poza planem treningowym) — np. taniec, rower. */
export type ActivityEntry = {
  id: string;
  name: string;
  minutes: number | null;
};

export type DayLog = {
  date: string; // YYYY-MM-DD
  gtgReps: number; // greasing the groove
  gtgSets: number; // liczba podejść (cel dzienny 6)
  mealEntries: MealEntry[]; // wpisy jedzeniowe z godziną, forma wewnętrznego kalendarza
  mood: Scale5 | null;
  emotions: string[]; // dominujące emocje dnia (wielokrotny wybór)
  emotionReason: string; // powód / kontekst emocji
  sleepSegments: SleepSegment[]; // noc + drzemki (początek/koniec)
  sleepHours: number | null; // suma godzin (auto z segmentów; legacy: ręczna wartość)
  sleepQuality: Scale5 | null; // jakość snu (nocy) 1–5

  walkDone: boolean | null; // tylko soboty; null = dzień nieweekendowy / niezadeklarowany
  walkNote: string;
  activities: ActivityEntry[]; // inne aktywności fizyczne (poza planem), osobno od statystyk sesji
};

export type JointCheck = {
  sessionId: string;
  date: string;
  elbowPain: boolean;
  shoulderPain: boolean;
};

export type PersonalRecord = {
  exerciseId: string;
  levelId: string;
  value: number;
  unit: 'reps' | 'seconds';
  date: string;
};

/** Aktualnie wybrany poziom drabinki dla każdego ćwiczenia (progres użytkownika). */
export type LevelSelection = Record<string, string>; // exerciseId -> levelId

export type ReminderConfig = {
  enabled: boolean;
  /** Godziny przypomnień treningowych (tylko pon/śr/pt), rosnąca eskalacja. */
  trainingTimes: { hour: number; minute: number; alarm: boolean }[];
  /** Codzienne przypomnienie o dzienniku (jedzenie / nastrój). */
  journalEnabled: boolean;
  journalTime: { hour: number; minute: number };
};

export type AppData = {
  version: number;
  sessions: Session[];
  days: DayLog[];
  records: PersonalRecord[];
  jointChecks: JointCheck[];
  levels: LevelSelection;
  reminders: ReminderConfig;
  firstSessionDate: string | null; // do liczenia deloadu
  lastDeloadDate: string | null;
  createdAt: string;
};
