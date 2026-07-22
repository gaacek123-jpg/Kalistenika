// Prowadzona rozgrzewka: przechodzi po pozycjach WARMUP, pokazuje aktualną czynność
// + prostą ikonę, odlicza czas (rundy) albo pokazuje cel powtórzeń. Wibracja na koniec.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { WARMUP } from '../data/plan';
import { fmtClock } from '../logic/dates';
import { colors, font, mono, radius, space } from '../theme';
import { Pictogram } from './Pictogram';

export function WarmupRunner({
  visible,
  onItemDone,
  onFinish,
  onClose,
}: {
  visible: boolean;
  onItemDone?: (index: number) => void;
  onFinish?: () => void;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(true);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const item = WARMUP[idx];
  const isTimed = !!item?.seconds;
  const total = WARMUP.length;

  const goNext = () => {
    onItemDone?.(idx);
    if (idx + 1 < total) setIdx(idx + 1);
    else {
      onFinish?.();
      onClose();
    }
  };

  const goPrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  // Start / zmiana pozycji: reset licznika.
  useEffect(() => {
    if (!visible) return;
    setRemaining(WARMUP[idx].seconds ?? 0);
    setRunning(true);
  }, [visible, idx]);

  // Reset całości przy zamknięciu.
  useEffect(() => {
    if (!visible) setIdx(0);
  }, [visible]);

  // Odliczanie dla pozycji na czas.
  useEffect(() => {
    if (!visible || !isTimed || !running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [visible, isTimed, running, idx]);

  // Przejście po dojściu do zera → następna pozycja.
  useEffect(() => {
    if (!visible || !isTimed || remaining !== 0) return;
    Vibration.vibrate([0, 300, 120, 300]);
    const t = setTimeout(() => goNext(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, visible, isTimed]);

  if (!visible || !item) return null;

  const progress = isTimed && item.seconds ? remaining / item.seconds : 0;
  const finishedTimed = isTimed && remaining === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Text style={styles.tag}>ROZGRZEWKA · {idx + 1}/{total}</Text>

        <View style={styles.iconBox}>
          <Pictogram exerciseId={item.icon} size={120} />
        </View>

        <Text style={styles.name}>{item.name}</Text>

        {isTimed ? (
          <>
            <Text style={[styles.clock, { color: finishedTimed ? colors.good : colors.accent }]}>{fmtClock(remaining)}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: finishedTimed ? colors.good : colors.accent }]} />
            </View>
            <Pressable style={styles.pauseBtn} onPress={() => setRunning((r) => !r)}>
              <Text style={styles.pauseTxt}>{running ? '⏸ Pauza' : '▶ Wznów'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.clock, { color: colors.accent }]}>{item.reps}</Text>
            <Text style={styles.reps}>powtórzeń</Text>
          </>
        )}

        <View style={styles.nav}>
          <Pressable style={[styles.navBtn, { backgroundColor: colors.surfaceAlt, opacity: idx === 0 ? 0.4 : 1 }]} onPress={goPrev} disabled={idx === 0}>
            <Text style={[styles.navTxt, { color: colors.textDim }]}>‹ Wstecz</Text>
          </Pressable>
          <Pressable style={[styles.navBtn, { backgroundColor: colors.good }]} onPress={goNext}>
            <Text style={[styles.navTxt, { color: '#12130F' }]}>{idx + 1 === total ? 'Zakończ ✓' : (isTimed ? 'Dalej ›' : 'Gotowe ›')}</Text>
          </Pressable>
        </View>

        <Pressable onPress={onClose} style={{ padding: space.md }}>
          <Text style={styles.close}>Pomiń rozgrzewkę</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.sm },
  tag: { color: colors.textDim, fontSize: font.tiny, letterSpacing: 2, fontWeight: '700' },
  iconBox: { width: 180, height: 130, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: font.h1, fontWeight: '700', textAlign: 'center' },
  clock: { fontFamily: mono, fontSize: font.timerHuge, fontWeight: '700', letterSpacing: 2 },
  reps: { color: colors.textDim, fontSize: font.h3, marginTop: -8 },
  bar: { width: '80%', height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%' },
  pauseBtn: { paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, marginTop: space.xs },
  pauseTxt: { color: colors.text, fontFamily: mono, fontWeight: '700', fontSize: font.body },
  nav: { flexDirection: 'row', gap: space.md, marginTop: space.lg, width: '100%' },
  navBtn: { flex: 1, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  navTxt: { fontSize: font.h3, fontWeight: '700' },
  close: { color: colors.textFaint, fontSize: font.small },
});
