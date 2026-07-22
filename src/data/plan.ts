// Seed planu treningowego — dane z KALISTENIKA_APP_SPEC.md §2.
// Ćwiczenia + drabinki progresji + rozgrzewka + szablony sesji A/B.
// Instrukcje techniki pisane ręcznie, z naciskiem na najczęstsze błędy (spec §3.7).

import { Exercise, ExerciseLevel, SessionTemplate } from '../types';

const lvl = (
  id: string,
  order: number,
  name: string,
  isometric: boolean,
  instructions: string,
  cues: string[],
  videoUrl?: string,
): ExerciseLevel => ({ id, order, name, isometric, instructions, cues, videoUrl });

// ── Drabinki progresji ──────────────────────────────────────────────

export const EXERCISES: Record<string, Exercise> = {
  pushup: {
    id: 'pushup',
    name: 'Pompki',
    ladderLabel: 'pompki',
    levels: [
      lvl('pushup-1', 1, 'Pompki na kolanach', false,
        'Kolana na macie, ciało od kolan do głowy w jednej linii. Opuszczasz klatkę do podłogi, łokcie ok. 45° do tułowia — nie na boki.',
        ['Biodra nie w górze', 'Łokcie 45°, nie na boki', 'Klatka do ziemi']),
      lvl('pushup-2', 2, 'Pompki klasyczne', false,
        'Podpór z prostymi nogami. Spięty brzuch i pośladki — tułów jak deska. Schodzisz aż klatka blisko podłogi.',
        ['Napięty brzuch', 'Biodra nie zapadają', 'Pełen zakres']),
      lvl('pushup-3', 3, 'Pompki, nogi na krześle', false,
        'Stopy na krześle — większy nacisk na górę klatki i barki. Uwaga na zapadające biodra przy zmęczeniu.',
        ['Linia ciała prosta', 'Nie zadzieraj głowy']),
      lvl('pushup-4', 4, 'Pompki diamentowe', false,
        'Dłonie blisko siebie (kciuki i palce wskazujące tworzą trójkąt) pod klatką. Mocny nacisk na triceps. Łokcie blisko tułowia.',
        ['Łokcie przy ciele', 'Dłonie pod klatką']),
      lvl('pushup-5', 5, 'Pompki nierówne', false,
        'Jedna dłoń na podwyższeniu (książka/piłka), zmiana strony między seriami. Krok w stronę pompki jednorącz.',
        ['Równo obie strony', 'Kontrola na dole']),
    ],
  },

  pullup: {
    id: 'pullup',
    name: 'Podciąganie nachwytem',
    ladderLabel: 'podciąganie',
    levels: [
      lvl('pull-1', 1, 'Zwis na drążku', true,
        'Zawiśnij nachwytem, barki delikatnie ściągnięte (nie luźne „na stawach"). Buduje chwyt i zdrowie barku.',
        ['Barki aktywne', 'Oddychaj']),
      lvl('pull-2', 2, 'Negatywy (opuszczanie 5 s)', false,
        'Wskocz/podbij się do góry brody nad drążek, potem opuszczaj w 5 sekund pod kontrolą. Tu buduje się siła.',
        ['5 s w dół', 'Bez puszczania', 'Łopatki w dół']),
      lvl('pull-3', 3, 'Podciąganie z gumą', false,
        'Guma oporowa pod stopą/kolanem odciąża. Pełen zakres: broda nad drążek, w dole prawie proste ręce.',
        ['Broda nad drążek', 'Bez bujania', 'Pełen zakres']),
      lvl('pull-4', 4, 'Podciąganie pełne', false,
        'Bez pomocy. Zainicjuj ściągnięciem łopatek, prowadź łokcie w dół i do tyłu. Nie bujaj — to nie kip.',
        ['Łopatki najpierw', 'Bez bujania (kipu)', 'Broda nad drążek']),
      lvl('pull-5', 5, 'Podciąganie z pauzą w górze', false,
        'Pełne podciągnięcie + 1–2 s pauzy z brodą nad drążkiem. Brutalne na siłę i kontrolę.',
        ['Pauza 1–2 s', 'Klatka do drążka']),
      lvl('pull-6', 6, 'Podciąganie z obciążeniem', false,
        'Pas/plecak z ciężarem. Dokładaj małymi krokami. Technika bez zmian względem pełnego.',
        ['Małe przyrosty', 'Technika bez zmian']),
    ],
  },

  chinup: {
    id: 'chinup',
    name: 'Podciąganie podchwytem',
    ladderLabel: 'podciąganie podchwytem',
    levels: [
      lvl('chin-1', 1, 'Zwis podchwytem', true,
        'Chwyt podchwytem (dłonie do siebie), barki aktywne. Bicepsy pomagają — często łatwiejsze niż nachwyt.',
        ['Barki aktywne', 'Nadgarstki neutralne']),
      lvl('chin-2', 2, 'Negatywy podchwytem 5 s', false,
        'Do góry z pomocą, opuszczanie 5 s pod kontrolą.',
        ['5 s w dół', 'Łokcie do tułowia']),
      lvl('chin-3', 3, 'Podchwyt z gumą', false,
        'Guma odciąża. Pełen zakres, bez bujania.',
        ['Pełen zakres', 'Bez bujania']),
      lvl('chin-4', 4, 'Podchwyt pełny', false,
        'Bez pomocy. Prowadź łokcie w dół, klatka do drążka.',
        ['Łokcie w dół', 'Klatka do drążka']),
      lvl('chin-5', 5, 'Podchwyt z pauzą', false,
        'Pauza w górze 1–2 s.',
        ['Pauza w górze']),
    ],
  },

  // Drążek zamontowany wysoko i nieprzekładalny — klasyczne wiosłowanie australijskie odpada.
  // Warianty ciągnące oparte o klamki drzwi i gumę oporową (rekomendowana).
  rowAus: {
    id: 'rowAus',
    name: 'Wiosłowanie',
    ladderLabel: 'wiosłowanie',
    levels: [
      lvl('row-1', 1, 'Wiosłowanie o klamki, stopy blisko', false,
        'Ręcznik przełożony przez obie klamki solidnych, ZAMKNIĘTYCH drzwi (na zawiasach). Odchyl się do tyłu, stopy blisko drzwi, ciągnij klatkę do dłoni, łopatki ściągnięte. Im bliżej stopy, tym łatwiej. Alternatywy: pod stabilnym stołem albo w opadzie tułowia z plecakiem.',
        ['Łopatki ściągaj', 'Ciało prosto', 'Klatka do dłoni']),
      lvl('row-2', 2, 'Wiosłowanie o klamki, stopy daleko', false,
        'To samo, ale stopy dalej od drzwi — większy kąt, więcej masy ciała na plecach.',
        ['Biodra nie opadają', 'Pełne ściągnięcie']),
      lvl('row-3', 3, 'Wiosłowanie z gumą (słabsza)', false,
        'Guma oporowa zaczepiona o wysoki drążek. Ciągnij łokcie w dół i do tyłu, łopatki najpierw. Kontrola w obie strony. (Zestaw gum ~30–60 zł — daje też asystę przy podciąganiu.)',
        ['Łokcie w dół i do tyłu', 'Łopatki najpierw', 'Bez szarpania']),
      lvl('row-4', 4, 'Wiosłowanie z gumą (mocniejsza)', false,
        'Mocniejsza guma = większy opór. Technika bez zmian.',
        ['Pełen zakres', 'Kontrola tempa']),
    ],
  },

  scapPull: {
    id: 'scapPull',
    name: 'Ściąganie łopatek w zwisie',
    ladderLabel: 'łopatki',
    levels: [
      lvl('scap-1', 1, 'Zwis bierny', false,
        'Zawiśnij na prostych rękach, barki „w uszach" (rozluźnione). Punkt wyjścia — oswojenie chwytu i barku.',
        ['Proste ręce', 'Rozluźnione barki']),
      lvl('scap-2', 2, 'Ściąganie łopatek w zwisie', false,
        'Z biernego zwisu unieś całe ciało kilka cm SAMYM ruchem łopatek w dół — bez zginania łokci. Uczy aktywacji, której brak najczęściej zatrzymuje progres w podciąganiu.',
        ['Łokcie proste', 'Ruch z łopatek', 'Barki w dół']),
      lvl('scap-3', 3, 'Ściąganie łopatek z pauzą 2 s', false,
        'Jak wyżej + 2 s pauzy w górnej pozycji (łopatki maksymalnie ściągnięte w dół).',
        ['Pauza 2 s', 'Kontrola']),
    ],
  },

  squat: {
    id: 'squat',
    name: 'Przysiady',
    ladderLabel: 'przysiad',
    levels: [
      lvl('squat-1', 1, 'Przysiad obunóż', false,
        'Stopy na szerokość barków, kolana śledzą palce stóp, schodzisz biodrami poniżej kolan jeśli możesz. Plecy proste.',
        ['Kolana za palcami stóp', 'Pięty na ziemi', 'Głęboko']),
      lvl('squat-2', 2, 'Wykrok', false,
        'Duży krok w przód, tylne kolano nisko, przednie nad piętą. Naprzemiennie nogi.',
        ['Kolano nad piętą', 'Tułów pionowo']),
      lvl('squat-3', 3, 'Przysiad bułgarski', false,
        'Tylna stopa na krześle za tobą, cały ciężar na przedniej nodze. Mocno obciąża jedną nogę.',
        ['Ciężar na przedniej', 'Kolano stabilne']),
      lvl('squat-4', 4, 'Pistolet na podwyższeniu', false,
        'Przysiad na jednej nodze z wyższego stopnia, druga w przód. Krok w stronę pełnego pistoletu.',
        ['Wolno w dół', 'Pięta na ziemi']),
    ],
  },

  plank: {
    id: 'plank',
    name: 'Deska',
    ladderLabel: 'deska',
    levels: [
      lvl('plank-1', 1, 'Deska na kolanach', true,
        'Przedramiona i kolana. Linia od kolan do głowy prosta, pośladki i brzuch spięte.',
        ['Biodra nie w górze', 'Napięty brzuch']),
      lvl('plank-2', 2, 'Deska klasyczna', true,
        'Przedramiona i palce stóp. NAJCZĘSTSZY BŁĄD: zapadnięte biodra. Podwiń miednicę, spnij pośladki.',
        ['Biodra NIE opadają', 'Pośladki spięte', 'Kark w linii']),
      lvl('plank-3', 3, 'Deska z unoszeniem nogi', true,
        'Klasyczna deska + naprzemienne unoszenie nóg kilka cm. Bez rotacji bioder.',
        ['Biodra bez rotacji', 'Powoli']),
      lvl('plank-4', 4, 'Deska z unoszeniem ręki', true,
        'Klasyczna deska + naprzemienne wyciąganie ręki w przód. Bez skręcania tułowia.',
        ['Tułów stabilny', 'Bez skrętu']),
    ],
  },

  superman: {
    id: 'superman',
    name: 'Superman',
    ladderLabel: 'superman',
    levels: [
      lvl('super-1', 1, 'Superman', false,
        'Leżysz na brzuchu, unosisz jednocześnie ręce i nogi, ściskasz pośladki i dolne plecy. Wytrzymaj chwilę w górze.',
        ['Ściśnij pośladki', 'Nie zadzieraj karku', 'Pauza w górze']),
    ],
  },

  pikePushup: {
    id: 'pikePushup',
    name: 'Pompki pike (barki)',
    ladderLabel: 'pike push-up',
    levels: [
      lvl('pike-1', 1, 'Pike na podłodze', false,
        'Pozycja „scyzoryk" — biodra wysoko, głowa schodzi między dłonie. Nacisk na barki.',
        ['Biodra wysoko', 'Głowa między dłonie']),
      lvl('pike-2', 2, 'Pike, stopy na krześle', false,
        'Stopy na krześle — bardziej pionowo, cięższe dla barków.',
        ['Tułów pionowo', 'Łokcie do tyłu']),
      lvl('pike-3', 3, 'Pike pod ścianą', false,
        'Stopy na ścianie, prawie pionowo — krok w stronę pompki na rękach.',
        ['Kontrola', 'Głowa nie uderza']),
    ],
  },

  lunge: {
    id: 'lunge',
    name: 'Wykroki / bułgarski',
    ladderLabel: 'wykrok',
    levels: [
      lvl('lunge-1', 1, 'Wykrok', false,
        'Krok w przód, oba kolana ~90°, tułów pionowo. 3× na nogę.',
        ['Kolano nad piętą', 'Pionowy tułów']),
      lvl('lunge-2', 2, 'Przysiad bułgarski', false,
        'Tylna stopa na krześle, ciężar na przedniej nodze.',
        ['Ciężar z przodu', 'Kolano stabilne']),
      lvl('lunge-3', 3, 'Bułgarski z podwyższeniem', false,
        'Przednia stopa na niskim podwyższeniu — większy zakres.',
        ['Głęboko', 'Kontrola']),
    ],
  },

  sidePlank: {
    id: 'sidePlank',
    name: 'Deska bokiem',
    ladderLabel: 'deska bokiem',
    levels: [
      lvl('side-1', 1, 'Deska bokiem na kolanie', true,
        'Podpór na przedramieniu i kolanie, biodro wysoko. Linia prosta.',
        ['Biodro w górę', 'Nie opadaj']),
      lvl('side-2', 2, 'Deska bokiem klasyczna', true,
        'Podpór na przedramieniu i stopach. Biodro nie opada do ziemi, ciało w jednej linii.',
        ['Biodro NIE opada', 'Ciało w linii']),
      lvl('side-3', 3, 'Deska bokiem z unoszeniem nogi', true,
        'Klasyczna + uniesiona górna noga.',
        ['Stabilne biodro']),
    ],
  },

  hollow: {
    id: 'hollow',
    name: 'Hollow hold',
    ladderLabel: 'hollow',
    levels: [
      lvl('hollow-1', 1, 'Dead bug', true,
        'Na plecach, dolny odcinek DOCIŚNIĘTY do podłogi. Naprzemiennie prostujesz przeciwną rękę i nogę.',
        ['Plecy dociśnięte', 'Wolno, kontrola']),
      lvl('hollow-2', 2, 'Hollow tuck', true,
        'Na plecach, kolana podciągnięte, łopatki i stopy nad ziemią, dół pleców przyklejony.',
        ['Dół pleców na ziemi', 'Bez wyginania']),
      lvl('hollow-3', 3, 'Hollow hold', true,
        'Ręce i nogi wyprostowane, całe ciało w kształt „banana" do góry. Dolny odcinek wciśnięty w matę.',
        ['Plecy dociśnięte', 'Napięty brzuch']),
    ],
  },
};

// Ćwiczenie występujące w sesji A jako osobny slot „negatywów" — mapujemy na
// poziom negatywów z drabinki podciągania, ale z własnym celem serii.
// Realizujemy przez slot wskazujący na exercise 'pullup' z sugerowanym poziomem.

// ── Rozgrzewka (wspólna) ────────────────────────────────────────────

export type WarmupItem = {
  name: string;
  amount: string; // etykieta do wyświetlenia
  icon: string; // klucz piktogramu
  seconds?: number; // czas do wykonania (pozycje na czas)
  reps?: number; // powtórzenia (pozycje na powtórzenia)
};
export const WARMUP: WarmupItem[] = [
  { name: 'Krążenia ramion', amount: '30 s', icon: 'arms', seconds: 30 },
  { name: 'Pajacyki', amount: '20', icon: 'jumpingjack', reps: 20 },
  { name: 'Przysiady bez obciążenia', amount: '10', icon: 'squat', reps: 10 },
  { name: 'Pompki na kolanach', amount: '10', icon: 'pushup', reps: 10 },
  { name: 'Zwis na drążku · S1', amount: '20 s', icon: 'hang', seconds: 20 },
  { name: 'Zwis na drążku · S2', amount: '20 s', icon: 'hang', seconds: 20 },
];

// ── Szablony sesji ──────────────────────────────────────────────────

export const SESSION_A: SessionTemplate = {
  type: 'A',
  title: 'Sesja A — plecy',
  slots: [
    { exerciseId: 'pullup', sets: 4, repsMin: 2, repsMax: 4, restSeconds: 150, toFailure: true, note: 'max (2–4)' },
    { exerciseId: 'pullup', sets: 3, repsMin: 4, repsMax: 4, restSeconds: 120, note: 'negatywy, 5 s w dół' },
    { exerciseId: 'rowAus', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
    { exerciseId: 'pushup', sets: 3, repsMin: 0, repsMax: 0, restSeconds: 90, toFailure: true, note: 'max −2' },
    { exerciseId: 'squat', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 },
    { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 45 },
    { exerciseId: 'superman', sets: 3, repsMin: 12, repsMax: 12, restSeconds: 45 },
  ],
};

export const SESSION_B: SessionTemplate = {
  type: 'B',
  title: 'Sesja B — push + nogi',
  slots: [
    { exerciseId: 'chinup', sets: 3, repsMin: 0, repsMax: 0, restSeconds: 150, toFailure: true, note: 'max' },
    { exerciseId: 'pushup', sets: 4, repsMin: 6, repsMax: 12, restSeconds: 120, note: 'wariant trudniejszy' },
    { exerciseId: 'pikePushup', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 90 },
    { exerciseId: 'lunge', sets: 3, repsMin: 10, repsMax: 10, restSeconds: 60, note: 'na nogę' },
    { exerciseId: 'rowAus', sets: 3, repsMin: 10, repsMax: 10, restSeconds: 90 },
    { exerciseId: 'scapPull', sets: 3, repsMin: 8, repsMax: 8, restSeconds: 60 },
    { exerciseId: 'sidePlank', sets: 3, repsMin: 25, repsMax: 25, restSeconds: 45, note: 'na stronę' },
    { exerciseId: 'hollow', sets: 3, repsMin: 20, repsMax: 20, restSeconds: 45 },
  ],
};

export const TEMPLATES: Record<'A' | 'B', SessionTemplate> = {
  A: SESSION_A,
  B: SESSION_B,
};

/** Domyślny wybór poziomu drabinki dla każdego ćwiczenia (start = najniższy). */
export function defaultLevels(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const ex of Object.values(EXERCISES)) {
    // Start dostosowany do poziomu 1–4 podciągnięcia: podciąganie od negatywów.
    if (ex.id === 'pullup' || ex.id === 'chinup') {
      out[ex.id] = ex.levels[1].id; // negatywy
    } else {
      out[ex.id] = ex.levels[0].id;
    }
  }
  return out;
}
