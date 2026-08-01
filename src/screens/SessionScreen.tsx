// Ekran sesji — serce apki. Lista ćwiczeń, odhaczanie serii, timery, Wake Lock,
// zakończenie z nastrojem/energią/bólem stawów, automatyczna progresja i rekordy.

import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useApp } from '../store/AppState';
import { EXERCISES, TEMPLATES, WARMUP } from '../data/plan';
import { currentLevel, deloadDue, nextSessionType, recordFor } from '../logic/derive';
import { fmtClock, ymd } from '../logic/dates';
import { SetLog, Session } from '../types';
import { colors, font, HIT, mono, radius, sessionColor, space } from '../theme';
import { AppText, Button, Card, Scale5Input, SectionLabel, Stepper, Title } from '../components/ui';
import { Pictogram } from '../components/Pictogram';
import { CountdownOverlay, TimerMode } from '../components/Timer';
import { WarmupRunner } from '../components/WarmupRunner';
import { positiveLine } from '../data/reminders';

type WSet = { reps: number | null; seconds: number | null; done: boolean };

export default function SessionScreen({ navigation }: any) {
  useKeepAwake(); // ekran nie gaśnie w trakcie sesji

  const app = useApp();
  const type = nextSessionType(app.data.sessions);
  const template = TEMPLATES[type];

  const [startedAt] = useState(() => Date.now());
  const [warmDone, setWarmDone] = useState<boolean[]>(() => WARMUP.map(() => false));
  const [showWarmup, setShowWarmup] = useState(true);

  // Snapshot poziomów użytych w tej sesji (progresja liczona dopiero przy zapisie).
  const slotLevels = useMemo(
    () => template.slots.map((s) => currentLevel(app.data, s.exerciseId)?.id ?? EXERCISES[s.exerciseId].levels[0].id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type],
  );

  const build = (): WSet[][] =>
    template.slots.map((slot, i) => {
      const lvl = EXERCISES[slot.exerciseId].levels.find((l) => l.id === slotLevels[i])!;
      const rec = recordFor(app.data.records, slot.exerciseId, slotLevels[i]);
      return Array.from({ length: slot.sets }, () => {
        if (lvl.isometric) return { reps: null, seconds: slot.repsMin > 0 ? slot.repsMin : 20, done: false };
        const def = slot.repsMin > 0 ? slot.repsMin : rec?.value ?? 3;
        return { reps: def, seconds: null, done: false };
      });
    });

  const [work, setWork] = useState<WSet[][]>(build);

  // Timer overlay
  const [timer, setTimer] = useState<{ open: boolean; seconds: number; label: string; mode: TimerMode; slot: number; set: number }>(
    { open: false, seconds: 0, label: '', mode: 'rest', slot: -1, set: -1 },
  );

  const [finishOpen, setFinishOpen] = useState(false);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);

  const setValue = (slot: number, set: number, patch: Partial<WSet>) => {
    setWork((w) => w.map((s, si) => (si === slot ? s.map((x, xi) => (xi === set ? { ...x, ...patch } : x)) : s)));
  };

  const openRest = (slot: number, set: number) => {
    const rest = template.slots[slot].restSeconds;
    const isLast = set === template.slots[slot].sets - 1;
    if (rest > 0 && !isLast) {
      setTimer({ open: true, seconds: rest, label: `Przerwa · ${EXERCISES[template.slots[slot].exerciseId].name}`, mode: 'rest', slot, set });
    }
  };

  const toggleRepDone = (slot: number, set: number) => {
    const cur = work[slot][set];
    const nowDone = !cur.done;
    setValue(slot, set, { done: nowDone });
    if (nowDone) openRest(slot, set);
  };

  const startHold = (slot: number, set: number) => {
    const target = work[slot][set].seconds ?? template.slots[slot].repsMin ?? 20;
    setTimer({ open: true, seconds: target, label: EXERCISES[template.slots[slot].exerciseId].name, mode: 'hold', slot, set });
  };

  const onTimerDone = (elapsed: number) => {
    const { slot, set, mode } = timer;
    setTimer((t) => ({ ...t, open: false }));
    if (mode === 'hold' && slot >= 0) {
      setValue(slot, set, { seconds: elapsed, done: true });
      // po izometryku też przerwa
      setTimeout(() => openRest(slot, set), 250);
    }
  };

  const doneCount = work.flat().filter((s) => s.done).length;
  const totalSets = work.flat().length;

  const finish = (energyAfter: number | null, soreness: number | null, elbow: boolean, shoulder: boolean, notes: string) => {
    const sets: SetLog[] = [];
    template.slots.forEach((slot, si) => {
      work[si].forEach((ws, xi) => {
        sets.push({
          slotIndex: si,
          exerciseId: slot.exerciseId,
          levelId: slotLevels[si],
          setNumber: xi + 1,
          reps: ws.reps,
          seconds: ws.seconds,
          toFailure: !!slot.toFailure,
          done: ws.done,
        });
      });
    });

    const session: Session = {
      id: `s-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      sets,
      durationMinutes: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      moodBefore: null, // nastrój notowany w Dzienniku (codziennie, pod tendencję)
      energyAfter: (energyAfter as any) ?? null,
      soreness: (soreness as any) ?? null,
      notes,
      completed: true,
    };

    const res = app.saveSession(session, { elbowPain: elbow, shoulderPain: shoulder });
    setFinishOpen(false);

    // Komunikaty: rekordy, awanse, bezpieczeństwo stawów, deload.
    const lines: string[] = [positiveLine().body];
    if (res.beatenRecords.length) lines.push(`🏅 Nowe rekordy: ${res.beatenRecords.length}`);
    for (const a of res.advancedExercises) {
      const ex = EXERCISES[a.exerciseId];
      const lvl = ex.levels.find((l) => l.id === a.newLevelId);
      lines.push(`⬆️ Awans: ${ex.name} → ${lvl?.name}`);
    }

    // Bezpieczeństwo: dwa zgłoszenia bólu z rzędu → propozycja redukcji podciągania.
    const jc = [...app.data.jointChecks, { sessionId: session.id, date: session.date, elbowPain: elbow, shoulderPain: shoulder }]
      .slice(-2);
    if (jc.length === 2 && jc.every((j) => j.elbowPain || j.shoulderPain)) {
      lines.push('⚠️ Dwie sesje z rzędu z bólem łokcia/barku. Rozważ obniżenie objętości podciągania o połowę na 2 tygodnie.');
    }

    const dl = deloadDue(app.data);
    if (dl.due) lines.push(`🔋 Mija ${dl.weeks} tyg. — rozważ tydzień deloadu (połowa serii).`);

    Alert.alert('Sesja zapisana', lines.join('\n\n'), [
      { text: 'OK', onPress: () => { setWork(build()); setWarmDone(WARMUP.map(() => false)); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
        {/* nagłówek */}
        <View style={{ gap: space.xs }}>
          <SectionLabel>Dziś</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={[styles.badge, { backgroundColor: sessionColor(type) }]}>
              <Text style={styles.badgeTxt}>{type}</Text>
            </View>
            <Title style={{ flex: 1 }}>{template.title.replace(/^Sesja \w+ — /, '')}</Title>
          </View>
        </View>

        {/* Tryb nawyku — dziś liczy się, że zaczynasz */}
        <Card style={{ borderColor: colors.accentDim }}>
          <SectionLabel>Tryb nawyku</SectionLabel>
          <AppText size={font.small}>
            Dziś liczy się jedno: że <AppText size={font.small} weight="700" style={{ color: colors.accent }}>zaczynasz</AppText>.
            Cokolwiek zrobisz — 1 seria czy komplet — trening jest zaliczony.
          </AppText>
          <Button label="▶ Zaczynam · mata za 2 min" onPress={() => setActivationOpen(true)} />
        </Card>

        <SessionBody
          template={template}
          work={work}
          slotLevels={slotLevels}
          appData={app.data}
          showWarmup={showWarmup}
          setShowWarmup={setShowWarmup}
          warmDone={warmDone}
          setWarmDone={setWarmDone}
          setValue={setValue}
          toggleRepDone={toggleRepDone}
          startHold={startHold}
          navigation={navigation}
          openRunner={() => setRunnerOpen(true)}
        />

        <Button label="Zalicz trening ✓" onPress={() => setFinishOpen(true)} kind="good" />
        <AppText faint size={font.tiny} style={{ textAlign: 'center' }}>
          Nie musisz zrobić wszystkiego. Pojawiłeś się = wygrana{doneCount > 0 ? ` · dziś ${doneCount} serii` : ''}.
        </AppText>
      </ScrollView>

      <CountdownOverlay
        visible={timer.open}
        seconds={timer.seconds}
        label={timer.label}
        mode={timer.mode}
        onDone={onTimerDone}
        onCancel={() => setTimer((t) => ({ ...t, open: false }))}
      />

      <FinishModal visible={finishOpen} onCancel={() => setFinishOpen(false)} onConfirm={finish} />

      {/* Rytuał startu — obniża próg wejścia (jak przy spacerze) */}
      <CountdownOverlay
        visible={activationOpen}
        seconds={120}
        label="Mata na podłogę — schodzimy"
        mode="rest"
        onDone={() => setActivationOpen(false)}
        onCancel={() => setActivationOpen(false)}
      />

      <WarmupRunner
        visible={runnerOpen}
        onItemDone={(i) => setWarmDone((arr) => arr.map((x, xi) => (xi === i ? true : x)))}
        onFinish={() => setWarmDone(WARMUP.map(() => true))}
        onClose={() => setRunnerOpen(false)}
      />
    </SafeAreaView>
  );
}

/** Ciało sesji: nastrój, rozgrzewka, sloty. */
function SessionBody(props: any) {
  const {
    template, work, slotLevels, appData, showWarmup, setShowWarmup, warmDone, setWarmDone,
    setValue, toggleRepDone, startHold, navigation, openRunner,
  } = props;
  const warmCount = warmDone.filter(Boolean).length;

  return (
    <View style={{ gap: space.md }}>
      {/* rozgrzewka */}
      <Card>
        <Pressable onPress={() => setShowWarmup((v: boolean) => !v)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionLabel>Rozgrzewka · ~5 min {warmCount > 0 ? `· ${warmCount}/${WARMUP.length}` : ''}</SectionLabel>
          <AppText dim monoFont>{showWarmup ? '▾' : '▸'}</AppText>
        </Pressable>
        <Button label="▶ Rozgrzewka z timerem" onPress={openRunner} />
        {showWarmup &&
          WARMUP.map((w, i) => (
            <Pressable key={i} onPress={() => setWarmDone((arr: boolean[]) => arr.map((x, xi) => (xi === i ? !x : x)))} style={styles.warmRow}>
              <View style={[styles.check, warmDone[i] && { backgroundColor: colors.good, borderColor: colors.good }]}>
                {warmDone[i] && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <AppText style={{ flex: 1 }} dim={warmDone[i]}>{w.name}</AppText>
              <AppText monoFont dim>{w.amount}</AppText>
            </Pressable>
          ))}
      </Card>

      {/* sloty */}
      {template.slots.map((slot: any, si: number) => {
        const ex = EXERCISES[slot.exerciseId];
        const lvl = ex.levels.find((l: any) => l.id === slotLevels[si])!;
        const rec = recordFor(appData.records, slot.exerciseId, slotLevels[si]);
        const target = slot.toFailure
          ? `${slot.sets} × max${slot.note && slot.note !== 'max' ? ` (${slot.note})` : ''}`
          : lvl.isometric
          ? `${slot.sets} × ${slot.repsMin}${slot.repsMax !== slot.repsMin ? `–${slot.repsMax}` : ''} s${slot.note ? ` · ${slot.note}` : ''}`
          : `${slot.sets} × ${slot.repsMin}${slot.repsMax !== slot.repsMin ? `–${slot.repsMax}` : ''}${slot.note ? ` · ${slot.note}` : ''}`;

        return (
          <Card key={si}>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ width: 72 }}>
                <Pictogram exerciseId={slot.exerciseId} size={54} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText weight="700" size={font.h3}>{si + 1}. {ex.name}</AppText>
                <Pressable onPress={() => navigation.navigate('Exercise', { exerciseId: slot.exerciseId })}>
                  <AppText style={{ color: colors.accent }}>{lvl.name} ›</AppText>
                </Pressable>
                <AppText dim monoFont size={font.small}>{target} · przerwa {fmtClock(slot.restSeconds)}</AppText>
              </View>
            </View>

            {lvl.cues?.length ? (
              <AppText faint size={font.tiny}>▸ {lvl.cues.join(' · ')}</AppText>
            ) : null}

            {/* timer izometryki — jeden przycisk nad seriami, czyta pierwszą niewykonaną serię */}
            {lvl.isometric
              ? (() => {
                  const firstUndone = work[si].findIndex((w: WSet) => !w.done);
                  const tIdx = firstUndone >= 0 ? firstUndone : work[si].length - 1;
                  const tSecs = work[si][tIdx].seconds ?? slot.repsMin;
                  const allDone = firstUndone < 0;
                  return (
                    <Button
                      label={allDone ? `▶ Powtórz S${tIdx + 1} · ${tSecs}s` : `▶ Timer · S${tIdx + 1} · ${tSecs}s`}
                      onPress={() => startHold(si, tIdx)}
                    />
                  );
                })()
              : null}

            {/* serie */}
            <View style={{ gap: space.sm, marginTop: space.xs }}>
              {work[si].map((ws: WSet, xi: number) => (
                <View key={xi} style={styles.setRow}>
                  <Text style={styles.setNum}>S{xi + 1}</Text>
                  {lvl.isometric ? (
                    <Stepper value={ws.seconds ?? 0} onChange={(v) => setValue(si, xi, { seconds: v, done: v > 0 })} step={5} unit="s" />
                  ) : (
                    <Stepper value={ws.reps ?? 0} onChange={(v) => setValue(si, xi, { reps: v })} />
                  )}
                  <Pressable
                    onPress={() => (lvl.isometric ? setValue(si, xi, { done: !ws.done }) : toggleRepDone(si, xi))}
                    style={[styles.doneBtn, ws.done && { backgroundColor: colors.good, borderColor: colors.good }]}
                  >
                    <Text style={[styles.doneTxt, ws.done && { color: '#12130F' }]}>✓</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {rec ? (
              <AppText faint size={font.tiny}>Rekord: {rec.value} {rec.unit === 'reps' ? 'powt.' : 's'}</AppText>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

function FinishModal({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: (energy: number | null, soreness: number | null, elbow: boolean, shoulder: boolean, notes: string) => void }) {
  const [energy, setEnergy] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const [elbow, setElbow] = useState(false);
  const [shoulder, setShoulder] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <Title>Zamknięcie sesji</Title>

          <SectionLabel>Energia po sesji</SectionLabel>
          <Scale5Input value={energy} onChange={setEnergy} labelLow="wykończony" labelHigh="naładowany" />

          <SectionLabel>Zakwasy / obolałość</SectionLabel>
          <Scale5Input value={soreness} onChange={setSoreness} labelLow="brak" labelHigh="mocne" />

          <SectionLabel>Ból stawów? (jeden tap)</SectionLabel>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <PainToggle label="Łokieć" active={elbow} onPress={() => setElbow((v) => !v)} />
            <PainToggle label="Bark" active={shoulder} onPress={() => setShoulder((v) => !v)} />
          </View>

          <SectionLabel>Notatka (opcjonalnie)</SectionLabel>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="jak poszło, co bolało, co poprawić…"
            placeholderTextColor={colors.textFaint}
            multiline
            style={styles.input}
          />

          <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.sm }}>
            <Button label="Wróć" kind="ghost" onPress={onCancel} style={{ flex: 1 }} />
            <Button label="Zapisz sesję" kind="good" onPress={() => onConfirm(energy, soreness, elbow, shoulder, notes)} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PainToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pain, active && { backgroundColor: colors.danger, borderColor: colors.danger }]}>
      <Text style={{ color: active ? '#fff' : colors.textDim, fontWeight: '700' }}>{active ? '● ' : '○ '}{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#12130F', fontFamily: mono, fontSize: font.h2, fontWeight: '700' },
  warmRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  check: { width: 28, height: 28, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#12130F', fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  setNum: { color: colors.textDim, fontFamily: mono, fontWeight: '700', width: 28 },
  doneBtn: { width: HIT, height: HIT, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  doneTxt: { color: colors.textFaint, fontSize: 24, fontWeight: '700' },
  holdBtn: { paddingHorizontal: space.md, height: HIT, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', minWidth: 74 },
  holdTxt: { color: colors.accent, fontFamily: mono, fontWeight: '700' },
  sheetBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, gap: space.sm, borderTopWidth: 1, borderColor: colors.border },
  input: { color: colors.text, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: space.md, minHeight: 72, textAlignVertical: 'top' },
  pain: { flex: 1, height: HIT, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
});
