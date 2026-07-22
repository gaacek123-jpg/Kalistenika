// Nakładka timera — używana do przerw między seriami ORAZ do ćwiczeń izometrycznych.
// Wielki monospace (czytelny z 2 m), duże przyciski, wibracja na koniec.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { colors, font, mono, radius, space } from '../theme';
import { fmtClock } from '../logic/dates';

export type TimerMode = 'rest' | 'hold';

export function CountdownOverlay({
  visible,
  seconds,
  label,
  mode,
  onDone,
  onCancel,
}: {
  visible: boolean;
  seconds: number;
  label: string;
  mode: TimerMode;
  onDone: (elapsedSeconds: number) => void;
  onCancel: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [running, setRunning] = useState(true);
  const startRef = useRef<number>(Date.now());
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // reset przy otwarciu
  useEffect(() => {
    if (visible) {
      setRemaining(seconds);
      setTotal(seconds);
      setRunning(true);
      startRef.current = Date.now();
    }
  }, [visible, seconds]);

  useEffect(() => {
    if (!visible || !running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          Vibration.vibrate(mode === 'hold' ? [0, 400, 150, 400] : [0, 250, 120, 250]);
          if (tick.current) clearInterval(tick.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [visible, running, mode]);

  const elapsed = () => Math.min(total, Math.round((Date.now() - startRef.current) / 1000));
  const add = (d: number) => setRemaining((r) => Math.max(0, r + d));
  const done = () => onDone(mode === 'hold' ? Math.max(elapsed(), total - remaining) : total);

  const progress = total > 0 ? remaining / total : 0;
  const finished = remaining === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <Text style={styles.mode}>{mode === 'rest' ? 'PRZERWA' : 'CZAS ĆWICZENIA'}</Text>

        <Text style={[styles.clock, { color: finished ? colors.good : colors.accent }]}>
          {fmtClock(remaining)}
        </Text>

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: finished ? colors.good : colors.accent }]} />
        </View>

        <View style={styles.row}>
          <Pressable style={styles.smallBtn} onPress={() => add(-15)}>
            <Text style={styles.smallBtnTxt}>−15s</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => setRunning((r) => !r)}>
            <Text style={styles.smallBtnTxt}>{running ? 'Pauza' : 'Wznów'}</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => add(15)}>
            <Text style={styles.smallBtnTxt}>+15s</Text>
          </Pressable>
        </View>

        <View style={[styles.row, { marginTop: space.lg }]}>
          <Pressable style={[styles.bigBtn, { backgroundColor: colors.surfaceAlt }]} onPress={onCancel}>
            <Text style={[styles.bigBtnTxt, { color: colors.textDim }]}>Anuluj</Text>
          </Pressable>
          <Pressable style={[styles.bigBtn, { backgroundColor: colors.good }]} onPress={done}>
            <Text style={[styles.bigBtnTxt, { color: '#12130F' }]}>{mode === 'hold' ? 'Zapisz czas' : 'Gotowe'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  label: { color: colors.text, fontSize: font.h3, fontWeight: '700', textAlign: 'center' },
  mode: { color: colors.textDim, fontSize: font.tiny, letterSpacing: 2, fontWeight: '700' },
  clock: { fontFamily: mono, fontSize: font.timerHuge, fontWeight: '700', letterSpacing: 2 },
  bar: { width: '80%', height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%' },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, minWidth: 84, alignItems: 'center' },
  smallBtnTxt: { color: colors.text, fontFamily: mono, fontSize: font.body, fontWeight: '700' },
  bigBtn: { flex: 1, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  bigBtnTxt: { fontSize: font.h3, fontWeight: '700' },
});
