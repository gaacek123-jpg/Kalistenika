// Teksty przypomnień — trzymane osobno, żeby dało się dopisywać własne (spec §3.5).
// Ton: pasywno-agresywny, ale NIGDY oparty na wstydzie związanym z wyglądem/wagą.
// Motyw przewodni: drążek jako urażony współlokator. Ma być śmieszne, nie dołujące.
//
// WAŻNE: po WYKONANEJ sesji ton natychmiast neutralno-pozytywny (patrz POSITIVE).
// Weekend jest cichy — te teksty lecą tylko w pon/śr/pt.

export type ReminderLine = { title: string; body: string };

/** Eskalacja W CIĄGU dnia treningowego — kolejne godziny są coraz bardziej natarczywe.
 *  Indeks = kolejność przypomnienia tego dnia (0 = pierwsze, najłagodniejsze). */
export const INTRADAY: ReminderLine[][] = [
  // 0 — pierwsze, łagodne (ok. 15:30)
  [
    { title: 'Drążek', body: '15:30. Drążek jest wolny. Ty podobno też.' },
    { title: 'Drążek', body: 'Cześć. Drążek pyta, czy dziś się widzimy.' },
    { title: 'Plan na dziś', body: 'Za chwilę trening. Bez spiny, przygotuj matę.' },
  ],
  // 1 — przypomnienie (ok. 17:00)
  [
    { title: 'Drążek', body: '17:00. Drążek odkurzony. Czeka.' },
    { title: 'Przypomnienie', body: 'Godzina treningowa się zbliża. Drążek wietrzy nadzieję.' },
    { title: 'Drążek', body: 'Jeszcze nic? Spokojnie, drążek jest cierpliwy. Na razie.' },
  ],
  // 2 — natarczywe (ok. 17:45)
  [
    { title: 'Druga próba', body: 'Druga próba. Drążek zaczyna wątpić w tę relację.' },
    { title: 'Drążek', body: 'Okno 17:30–18:00 się domyka. Drążek zerka na zegarek.' },
    { title: 'No dobra', body: 'Rozgrzewka to 5 minut. Drążek policzył. Zdążysz.' },
  ],
  // 3 — agresywne / prawie budzik (ok. 18:15)
  [
    { title: '⏰ Trening', body: 'Ostatni dzwonek. Drążek stroi minę.' },
    { title: '⏰ Serio', body: 'To nie jest sugestia. To jest 18:15. Matę na podłogę.' },
    { title: '⏰ Drążek', body: 'Drążek nie odpuści. Cztery serie i cię zostawiam w spokoju.' },
  ],
  // 4 — budzik (ok. 18:45), kanał alarmowy z dźwiękiem
  [
    { title: '⏰⏰ BUDZIK', body: 'Ostatnia szansa dziś. Wstawaj, dwie serie na start.' },
    { title: '⏰⏰ BUDZIK', body: 'Drążek dzwoni jak budzik, bo prośby nie działały.' },
    { title: '⏰⏰ Teraz', body: 'Teraz albo licznik opuszczonych podbija się o jeden.' },
  ],
];

/** Eskalacja między sesjami — pokazywana w apce po opuszczeniu treningów.
 *  Indeks = liczba opuszczonych SESJI z rzędu (nie dni). */
export const MISSED: ReminderLine[] = [
  { title: '', body: 'Wszystko na czasie. Drążek zadowolony.' }, // 0 — brak zaległości
  { title: 'Drążek', body: 'Ostatnia sesja poszła bez ciebie. Poradziła sobie.' }, // 1
  { title: 'Drążek', body: 'Drążek przekwalifikował się na wieszak. Tymczasowo.' }, // 2
  { title: 'Drążek', body: 'Trzy sesje w plecy. Drążek rozważa karierę w dekoracji wnętrz.' }, // 3+
];

/** Po WYKONANEJ sesji — ton neutralno-pozytywny, bez karania. */
export const POSITIVE: ReminderLine[] = [
  { title: 'Zrobione', body: 'Sesja zapisana. Drążek odzyskał wiarę w ludzkość.' },
  { title: 'Dobra robota', body: 'Konsekwencja > kilogramy. Tak trzymaj.' },
  { title: 'Zapisane', body: 'Jeden trening bliżej dziesiątki podciągnięć.' },
];

/** Codzienne przypomnienie o dzienniku (jedzenie / nastrój). Neutralny ton. */
export const JOURNAL: ReminderLine[] = [
  { title: 'Dziennik', body: 'Zanotuj dziś: co jadłeś i jak nastrój. Jedna linijka wystarczy.' },
  { title: 'Dziennik', body: 'Krótki wpis do dziennika — posiłki i samopoczucie.' },
  { title: 'Dziennik', body: 'Minuta na notatkę: jedzenie, nastrój, energia.' },
];

/** Greasing the groove — łagodne muśnięcie w dni nietreningowe (opcjonalne). */
export const GTG: ReminderLine[] = [
  { title: 'GtG', body: 'Przechodzisz obok drążka? 1–2 podciągnięcia, daleko od upadku formy.' },
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function intraday(index: number): ReminderLine {
  const bucket = INTRADAY[Math.min(index, INTRADAY.length - 1)];
  return pick(bucket);
}

export function missedLine(missedInARow: number): ReminderLine {
  return MISSED[Math.min(missedInARow, MISSED.length - 1)];
}

export function positiveLine(): ReminderLine {
  return pick(POSITIVE);
}

export function journalLine(): ReminderLine {
  return pick(JOURNAL);
}
