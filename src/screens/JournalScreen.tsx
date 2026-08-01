// Dziennik dnia: nastrój, kalendarz jedzenia (wpisy z godziną, jak spotkania),
// waga, greasing the groove + osobny widget sobotniego spaceru (spec §2).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../store/AppState';
import { ymd, isSaturday, shortDate, addDays } from '../logic/dates';
import { MealEntry, SleepSegment } from '../types';
import { fmtHours, napHours, nightSegment, segmentHours, totalSleepHours } from '../logic/sleep';
import { colors, font, HIT, radius, space } from '../theme';
import { AppText, Button, Card, Scale5Input, Screen, SectionLabel, Stepper, Title } from '../components/ui';
import { CountdownOverlay } from '../components/Timer';

const GTG_GOAL = 6;
const WALK_CHECKLIST = ['buty', 'klucze', 'telefon'];
const EMOTIONS = ['Spokój', 'Radość', 'Motywacja', 'Duma', 'Zmęczenie', 'Apatia', 'Stres', 'Rozdrażnienie', 'Smutek', 'Lęk', 'Znudzenie'];
const two = (n: number) => String(n).padStart(2, '0');
const nowHM = () => {
  const d = new Date();
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
};

type PickerReq = { value: string; onPick: (hm: string) => void } | null;

export default function JournalScreen() {
  const app = useApp();
  const [today, setToday] = useState(ymd());
  const todayRef = useRef(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const day = app.getDay(selectedDate);
  const isToday = selectedDate === today;
  const sat = isSaturday(new Date(selectedDate + 'T12:00:00'));

  const [walkNote, setWalkNote] = useState(day.walkNote);
  const [check, setCheck] = useState<boolean[]>(WALK_CHECKLIST.map(() => false));
  const [activation, setActivation] = useState(false);
  const [reason, setReason] = useState(day.emotionReason);
  const [actName, setActName] = useState('');
  const [actMin, setActMin] = useState(30);
  const [copied, setCopied] = useState(false);
  const [newTime, setNewTime] = useState(nowHM());
  const [newText, setNewText] = useState('');
  const [picker, setPicker] = useState<PickerReq>(null);
  const openTime = (value: string, onPick: (hm: string) => void) => setPicker({ value, onPick });

  const addEntry = () => {
    if (!newText.trim()) return;
    app.addMeal(selectedDate, newTime, newText.trim());
    setNewText('');
    setNewTime(nowHM());
  };

  // --- Sen (segmenty: noc + drzemki) ---
  const setSegments = (segs: SleepSegment[]) => {
    const total = segs.length ? Math.round(totalSleepHours(segs) * 10) / 10 : null;
    app.patchDay(selectedDate, { sleepSegments: segs, sleepHours: total });
  };
  const setNight = (patch: Partial<SleepSegment>) => {
    const naps = day.sleepSegments.filter((s) => s.nap);
    const cur = nightSegment(day.sleepSegments) ?? { id: `sn-${Date.now()}`, start: '23:00', end: '07:00', nap: false };
    setSegments([{ ...cur, ...patch }, ...naps]);
  };
  const addNap = () => {
    const n = nowHM();
    setSegments([...day.sleepSegments, { id: `sd-${Date.now()}`, start: n, end: n, nap: true }]);
  };
  const setNap = (id: string, patch: Partial<SleepSegment>) =>
    setSegments(day.sleepSegments.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const delNap = (id: string) => setSegments(day.sleepSegments.filter((s) => s.id !== id));

  // Odśwież bieżący dzień i domyślną godzinę (przycisk ⟳ / pull-to-refresh / powrót apki na pierwszy plan).
  const refreshNow = useCallback(() => {
    const nt = ymd();
    setSelectedDate((sd) => (sd === todayRef.current ? nt : sd)); // byłeś na „dziś" → przeskocz na realne dziś
    todayRef.current = nt;
    setToday(nt);
    setNewTime(nowHM());
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshNow();
    });
    return () => sub.remove();
  }, [refreshNow]);

  // Zmiana edytowanego dnia → odśwież lokalne pola tekstowe z tego dnia.
  useEffect(() => {
    const d = app.getDay(selectedDate);
    setReason(d.emotionReason);
    setWalkNote(d.walkNote);
    setActName('');
    setActMin(30);
    setNewText('');
    setNewTime(nowHM());
    setCheck(WALK_CHECKLIST.map(() => false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const goDay = (delta: number) => {
    const next = ymd(addDays(new Date(selectedDate + 'T12:00:00'), delta));
    if (next > today) return; // nie edytujemy przyszłości
    setSelectedDate(next);
  };
  const longDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  const copyDayLog = async () => {
    const entries = day.mealEntries ?? [];
    if (entries.length === 0) return;
    const text = `${longDate(selectedDate)} (${selectedDate})\n${entries.map((m) => `${m.time}  ${m.text}`).join('\n')}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Trend nastroju — ostatnie dni z zapisanym nastrojem (do wglądu w tendencję).
  const moodTrend = useMemo(
    () =>
      app.data.days
        .filter((d) => d.mood != null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14),
    [app.data.days],
  );

  // Inne dni z wpisami (agenda, klikalne do edycji)
  const pastDays = useMemo(
    () =>
      app.data.days
        .filter((d) => d.date !== selectedDate && (d.mealEntries?.length ?? 0) > 0)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7),
    [app.data.days, selectedDate],
  );

  return (
    <Screen onRefresh={refreshNow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title>Dziennik</Title>
        <Pressable onPress={refreshNow} style={styles.refreshBtn} hitSlop={8}>
          <AppText monoFont size={20} weight="700" style={{ color: colors.accent }}>⟳</AppText>
        </Pressable>
      </View>

      {/* Nawigator dnia — cofnij się, by uzupełnić wczoraj/wcześniej */}
      <View style={styles.dateNav}>
        <Pressable onPress={() => goDay(-1)} style={styles.dateArrow}>
          <AppText monoFont size={22} weight="700">‹</AppText>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText weight="700">{isToday ? 'Dziś' : longDate(selectedDate)}</AppText>
          {!isToday ? <AppText faint size={font.tiny}>{selectedDate}</AppText> : <AppText faint size={font.tiny}>{longDate(selectedDate)}</AppText>}
        </View>
        <Pressable onPress={() => goDay(1)} disabled={isToday} style={[styles.dateArrow, isToday && { opacity: 0.3 }]}>
          <AppText monoFont size={22} weight="700">›</AppText>
        </Pressable>
      </View>
      {!isToday ? <Button small kind="ghost" label="↩ Wróć do dziś" onPress={() => setSelectedDate(today)} /> : null}

      {/* Nastrój / samopoczucie — codziennie, pod tendencję */}
      <Card>
        <SectionLabel>Nastrój</SectionLabel>
        <Scale5Input value={day.mood} onChange={(v) => app.patchDay(selectedDate, { mood: v })} labelLow="kiepsko" labelHigh="świetnie" />

        <View style={{ height: space.xs }} />
        <SectionLabel>Dominujące emocje · można wybrać kilka</SectionLabel>
        <View style={styles.emotionWrap}>
          {EMOTIONS.map((e) => {
            const active = (day.emotions ?? []).includes(e);
            return (
              <Pressable
                key={e}
                onPress={() => {
                  const cur = day.emotions ?? [];
                  const next = active ? cur.filter((x) => x !== e) : [...cur, e];
                  app.patchDay(selectedDate, { emotions: next });
                }}
                style={[styles.emotionChip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <AppText size={font.small} style={{ color: active ? '#12130F' : colors.textDim, fontWeight: '700' }}>{active ? '✓ ' : ''}{e}</AppText>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Powód</SectionLabel>
        <TextInput
          value={reason}
          onChangeText={setReason}
          onEndEditing={() => app.patchDay(selectedDate, { emotionReason: reason })}
          placeholder="co na to wpłynęło? (praca, sen, trening, ludzie…)"
          placeholderTextColor={colors.textFaint}
          multiline
          style={styles.input}
        />
        <Button small kind="ghost" label="Zapisz powód" onPress={() => app.patchDay(selectedDate, { emotionReason: reason })} />

        {moodTrend.length >= 2 && (
          <>
            <View style={{ height: space.xs }} />
            <SectionLabel>Trend nastroju · ostatnie {moodTrend.length}</SectionLabel>
            <View style={styles.trend}>
              {moodTrend.map((d) => (
                <View key={d.date} style={styles.trendCol}>
                  <View style={[styles.trendBar, { height: `${((d.mood ?? 0) / 5) * 100}%`, backgroundColor: (d.mood ?? 0) >= 3 ? colors.good : colors.warn }]} />
                </View>
              ))}
            </View>
          </>
        )}
      </Card>

      {/* Sen — noc (od–do) + drzemki. Kluczowy sygnał pod cykliczność. */}
      <Card>
        <SectionLabel>Sen w nocy</SectionLabel>
        {(() => {
          const night = nightSegment(day.sleepSegments);
          const naps = day.sleepSegments.filter((s) => s.nap);
          const total = day.sleepSegments.length ? totalSleepHours(day.sleepSegments) : day.sleepHours ?? 0;
          const np = napHours(day.sleepSegments);
          return (
            <>
              <View style={styles.sleepRow}>
                <View style={{ alignItems: 'center' }}>
                  <AppText faint size={font.tiny}>zasnąłem</AppText>
                  <Pressable style={styles.timeChipSm} onPress={() => openTime(night?.start ?? '23:00', (hm) => setNight({ start: hm }))}>
                    <AppText monoFont weight="700">{night?.start ?? '—:—'}</AppText>
                  </Pressable>
                </View>
                <AppText dim monoFont>→</AppText>
                <View style={{ alignItems: 'center' }}>
                  <AppText faint size={font.tiny}>pobudka</AppText>
                  <Pressable style={styles.timeChipSm} onPress={() => openTime(night?.end ?? '07:00', (hm) => setNight({ end: hm }))}>
                    <AppText monoFont weight="700">{night?.end ?? '—:—'}</AppText>
                  </Pressable>
                </View>
                <View style={{ flex: 1 }} />
                <AppText monoFont weight="700" size={font.h3} style={{ color: colors.accent }}>{night ? fmtHours(segmentHours(night)) : '—'}</AppText>
              </View>

              {naps.length > 0 ? (
                <>
                  <SectionLabel>Drzemki</SectionLabel>
                  {naps.map((nap) => (
                    <View key={nap.id} style={styles.sleepRow}>
                      <Pressable style={styles.timeChipSm} onPress={() => openTime(nap.start, (hm) => setNap(nap.id, { start: hm }))}>
                        <AppText monoFont weight="700">{nap.start}</AppText>
                      </Pressable>
                      <AppText dim monoFont>→</AppText>
                      <Pressable style={styles.timeChipSm} onPress={() => openTime(nap.end, (hm) => setNap(nap.id, { end: hm }))}>
                        <AppText monoFont weight="700">{nap.end}</AppText>
                      </Pressable>
                      <AppText monoFont dim size={font.small}>{fmtHours(segmentHours(nap))}</AppText>
                      <View style={{ flex: 1 }} />
                      <Pressable onPress={() => delNap(nap.id)} style={styles.iconBtn}><AppText dim>✕</AppText></Pressable>
                    </View>
                  ))}
                </>
              ) : null}
              <Button small kind="ghost" label="+ dodaj drzemkę" onPress={addNap} />

              <AppText dim size={font.small}>
                Łącznie: <AppText monoFont weight="700" style={{ color: colors.text }}>{fmtHours(total)}</AppText>
                {np > 0 ? `  ·  drzemki ${fmtHours(np)}` : ''}
              </AppText>
            </>
          );
        })()}

        <View style={{ height: space.xs }} />
        <SectionLabel>Jakość snu</SectionLabel>
        <Scale5Input value={day.sleepQuality} onChange={(v) => app.patchDay(selectedDate, { sleepQuality: v })} labelLow="fatalny" labelHigh="rewelacyjny" />
      </Card>

      {/* Dziennik dnia — wpisy z godziną: jedzenie, suplementy, notatki */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionLabel>Dziennik dnia · wpisy z godziną</SectionLabel>
          {(day.mealEntries ?? []).length > 0 ? (
            <Pressable onPress={copyDayLog} hitSlop={8} style={styles.copyBtn}>
              <AppText size={font.tiny} weight="700" style={{ color: copied ? colors.good : colors.accent }}>
                {copied ? '✓ Skopiowano' : '⧉ Kopiuj'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
        <AppText faint size={font.tiny}>Jedzenie, suplementy, notatki — cokolwiek, ze znacznikiem czasu. Wpisz, kiedy się wydarzy (np. „magnez 200 mg" gdy weźmiesz).</AppText>

        {/* dodawanie */}
        <View style={styles.addRow}>
          <Pressable style={styles.timeChip} onPress={() => openTime(newTime, setNewTime)}>
            <AppText monoFont weight="700" size={font.h3}>{newTime}</AppText>
          </Pressable>
          <TextInput
            value={newText}
            onChangeText={setNewText}
            placeholder="np. owsianka; magnez 200 mg; kawa…"
            placeholderTextColor={colors.textFaint}
            style={styles.addInput}
            onSubmitEditing={addEntry}
            returnKeyType="done"
          />
        </View>
        <Button small label="+ Dodaj wpis" onPress={addEntry} />

        {/* dzisiejsza oś czasu */}
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {(day.mealEntries ?? []).length === 0 ? (
            <AppText faint size={font.tiny}>Brak wpisów dziś. Dodaj pierwszy powyżej.</AppText>
          ) : (
            (day.mealEntries ?? []).map((m) => (
              <EntryRow
                key={m.id}
                entry={m}
                onSave={(patch) => app.updateMeal(selectedDate, m.id, patch)}
                onDelete={() => app.deleteMeal(selectedDate, m.id)}
                openTime={openTime}
              />
            ))
          )}
        </View>
      </Card>

      {/* Inne dni — agenda, dotknij dnia, by go edytować */}
      {pastDays.length > 0 && (
        <Card>
          <SectionLabel>Inne dni · dotknij, by edytować</SectionLabel>
          {pastDays.map((d) => (
            <Pressable key={d.date} onPress={() => setSelectedDate(d.date)} style={{ marginTop: space.sm }}>
              <AppText weight="700" size={font.small} style={{ color: colors.accent }}>{shortDate(d.date + 'T12:00:00')} ›</AppText>
              {d.mealEntries.map((m) => (
                <View key={m.id} style={styles.pastRow}>
                  <AppText monoFont dim size={font.small} style={{ width: 52 }} numberOfLines={1}>{m.time}</AppText>
                  <AppText dim size={font.small} style={{ flex: 1 }}>{m.text}</AppText>
                </View>
              ))}
            </Pressable>
          ))}
        </Card>
      )}

      {/* Greasing the groove */}
      <Card>
        <SectionLabel>Greasing the Groove</SectionLabel>
        <AppText faint size={font.tiny}>1–2 podciągnięcia mijając drążek, zawsze daleko od upadku formy. Cel dnia: {GTG_GOAL} podejść.</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.xs }}>
          <AppText monoFont weight="700" style={{ fontSize: 44, color: day.gtgSets >= GTG_GOAL ? colors.good : colors.accent }}>
            {day.gtgSets}
          </AppText>
          <AppText dim>/ {GTG_GOAL}</AppText>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.minus} onPress={() => app.incrementGtg(-1, selectedDate)}>
            <AppText monoFont size={26} weight="700">−</AppText>
          </Pressable>
          <Pressable style={styles.plus} onPress={() => app.incrementGtg(1, selectedDate)}>
            <AppText monoFont size={26} weight="700" style={{ color: '#12130F' }}>+1</AppText>
          </Pressable>
        </View>
        {day.gtgSets >= GTG_GOAL ? <AppText style={{ color: colors.good }} size={font.small}>Cel dnia zaliczony. Najszybsza droga z 4 do 10.</AppText> : null}
      </Card>

      {/* Sobotni spacer — osobny widget, inny ton */}
      <Card style={{ borderColor: sat ? colors.push : colors.border }}>
        <SectionLabel>Sobotni spacer · osobno od treningu</SectionLabel>
        {day.walkDone ? (
          <AppText style={{ color: colors.good }}>✓ Było. {day.walkNote ? `„${day.walkNote}"` : ''}</AppText>
        ) : (
          <>
            <AppText dim size={font.small}>Bariera to wyjście z domu, nie sam spacer. Zadeklaruj mało — reszta się przedłuży.</AppText>
            <Button label="Wychodzę na 10 minut" onPress={() => setActivation(true)} />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {WALK_CHECKLIST.map((c, i) => (
                <Pressable key={c} onPress={() => setCheck((a) => a.map((x, xi) => (xi === i ? !x : x)))} style={[styles.checkChip, check[i] && { backgroundColor: colors.good, borderColor: colors.good }]}>
                  <AppText size={font.small} style={{ color: check[i] ? '#12130F' : colors.textDim, fontWeight: '700' }}>{check[i] ? '✓ ' : ''}{c}</AppText>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={walkNote}
              onChangeText={setWalkNote}
              placeholder="jedna linijka (opcjonalnie)"
              placeholderTextColor={colors.textFaint}
              style={styles.inputShort}
            />
            <Button kind="good" label="Zapisz: było" onPress={() => app.setWalk(selectedDate, true, walkNote)} />
          </>
        )}
      </Card>

      {/* Inne aktywności — poza planem treningowym, osobno od statystyk sesji */}
      <Card>
        <SectionLabel>Inne aktywności · poza planem</SectionLabel>
        <AppText faint size={font.tiny}>Taniec, rower, cokolwiek. Nie wchodzi do statystyk sesji ani serii.</AppText>
        <TextInput
          value={actName}
          onChangeText={setActName}
          placeholder="np. taniec, rower, basen…"
          placeholderTextColor={colors.textFaint}
          style={styles.inputShort}
          onSubmitEditing={() => {
            if (!actName.trim()) return;
            app.addActivity(selectedDate, actName.trim(), actMin > 0 ? actMin : null);
            setActName('');
            setActMin(30);
          }}
          returnKeyType="done"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Stepper value={actMin} onChange={setActMin} step={5} min={0} max={600} unit="min" />
        </View>
        <Button
          small
          label="+ Dodaj aktywność"
          onPress={() => {
            if (!actName.trim()) return;
            app.addActivity(selectedDate, actName.trim(), actMin > 0 ? actMin : null);
            setActName('');
            setActMin(30);
          }}
        />

        {(day.activities ?? []).length > 0 && (
          <View style={{ gap: space.xs, marginTop: space.xs }}>
            {(day.activities ?? []).map((a) => (
              <View key={a.id} style={styles.actRow}>
                <AppText style={{ flex: 1 }}>{a.name}</AppText>
                {a.minutes != null ? <AppText monoFont dim size={font.small}>{a.minutes} min</AppText> : null}
                <Pressable onPress={() => app.deleteActivity(selectedDate, a.id)} style={styles.iconBtn}>
                  <AppText dim>✕</AppText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Card>

      <CountdownOverlay
        visible={activation}
        seconds={120}
        label="Buty, klucze, telefon"
        mode="rest"
        onDone={() => setActivation(false)}
        onCancel={() => setActivation(false)}
      />

      {picker && (
        <DateTimePicker
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={(() => {
            const [h, m] = picker.value.split(':').map((x) => parseInt(x, 10));
            const d = new Date();
            d.setHours(isNaN(h) ? 12 : h, isNaN(m) ? 0 : m, 0, 0);
            return d;
          })()}
          onChange={(event, date) => {
            const cb = picker.onPick;
            setPicker(null);
            if (event.type === 'set' && date) cb(`${two(date.getHours())}:${two(date.getMinutes())}`);
          }}
        />
      )}
    </Screen>
  );
}

/** Wiersz osi czasu jednego wpisu jedzeniowego — z edycją inline i usuwaniem. */
function EntryRow({
  entry,
  onSave,
  onDelete,
  openTime,
}: {
  entry: MealEntry;
  onSave: (patch: Partial<MealEntry>) => void;
  onDelete: () => void;
  openTime: (value: string, onPick: (hm: string) => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(entry.time);
  const [text, setText] = useState(entry.text);

  if (editing) {
    return (
      <View style={styles.entryEdit}>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Pressable style={styles.timeChipSm} onPress={() => openTime(time, setTime)}>
            <AppText monoFont weight="700">{time}</AppText>
          </Pressable>
          <TextInput value={text} onChangeText={setText} style={styles.addInput} multiline />
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button small kind="ghost" label="Anuluj" onPress={() => { setEditing(false); setTime(entry.time); setText(entry.text); }} style={{ flex: 1 }} />
          <Button small kind="good" label="Zapisz" onPress={() => { onSave({ time, text: text.trim() }); setEditing(false); }} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.entry}>
      <View style={styles.entryTimeCol}>
        <AppText monoFont weight="700" numberOfLines={1} style={{ color: colors.accent }}>{entry.time}</AppText>
      </View>
      <AppText style={{ flex: 1 }}>{entry.text}</AppText>
      <Pressable onPress={() => setEditing(true)} style={styles.iconBtn}><AppText dim>✎</AppText></Pressable>
      <Pressable onPress={onDelete} style={styles.iconBtn}><AppText dim>✕</AppText></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { color: colors.text, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: space.md, minHeight: 56, textAlignVertical: 'top' },
  inputShort: { color: colors.text, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: space.md },
  emotionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  emotionChip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt },
  trend: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 56 },
  trendCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  trendBar: { width: '100%', borderRadius: 2, minHeight: 3 },
  minus: { width: HIT, height: HIT, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  plus: { width: HIT, height: HIT, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  checkChip: { flex: 1, height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  timeChip: { backgroundColor: colors.surfaceAlt, paddingHorizontal: space.md, height: HIT, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', minWidth: 76 },
  timeChipSm: { backgroundColor: colors.surfaceAlt, paddingHorizontal: space.md, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  addInput: { flex: 1, color: colors.text, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: HIT },
  entry: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm, borderLeftWidth: 3, borderLeftColor: colors.accent },
  entryTimeCol: { width: 58 },
  entryEdit: { gap: space.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: space.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pastRow: { flexDirection: 'row', gap: space.sm, paddingVertical: 2, alignItems: 'flex-start' },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: space.sm, paddingHorizontal: space.md },
  dateArrow: { width: HIT, height: HIT, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  sleepRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: 4 },
  copyBtn: { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
});
