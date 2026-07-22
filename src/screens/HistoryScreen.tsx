// Statystyki: liczba sesji, seria, ton wg opuszczonych, wykres objętości, rekordy, historia.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../store/AppState';
import { EXERCISES } from '../data/plan';
import { currentStreak, missedInARow, sessionVolume, totalCompleted } from '../logic/derive';
import { missedLine } from '../data/reminders';
import { shortDate } from '../logic/dates';
import { colors, font, mono, radius, sessionColor, space } from '../theme';
import { AppText, Card, Screen, SectionLabel, Title } from '../components/ui';

export default function HistoryScreen() {
  const { data } = useApp();
  const done = data.sessions.filter((s) => s.completed).sort((a, b) => b.date.localeCompare(a.date));
  const total = totalCompleted(data.sessions);
  const streak = currentStreak(data.sessions);
  const missed = missedInARow(data.sessions);
  const tone = missedLine(missed);

  const volumes = [...done].reverse().slice(-12).map((s) => ({ v: sessionVolume(s), t: s.type, date: s.date }));
  const maxV = Math.max(1, ...volumes.map((x) => x.v));

  // rekordy pogrupowane wg ćwiczenia
  const recsByEx = Object.values(EXERCISES)
    .map((ex) => ({
      ex,
      recs: data.records
        .filter((r) => r.exerciseId === ex.id)
        .sort((a, b) => b.value - a.value),
    }))
    .filter((g) => g.recs.length > 0);

  // Nastrój w czasie (obserwacja cykliczności) — ostatnie 30 dni z zapisem.
  const moodDays = data.days
    .filter((d) => d.mood != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  const moodSeries = moodDays.slice(-30);

  // Częstość emocji (do eksportu i obserwacji).
  const emotionCounts: Record<string, number> = {};
  data.days.forEach((d) => (d.emotions ?? []).forEach((e) => (emotionCounts[e] = (emotionCounts[e] ?? 0) + 1)));
  const emotionsSorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  const maxEmotion = Math.max(1, ...emotionsSorted.map(([, n]) => n));

  return (
    <Screen>
      <Title>Statystyki</Title>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Stat label="Sesje" value={String(total)} />
        <Stat label="Seria" value={String(streak)} accent />
      </View>

      <Card style={missed > 0 ? { borderColor: colors.warn } : { borderColor: colors.goodDim }}>
        <SectionLabel>Drążek melduje</SectionLabel>
        <AppText>{tone.body}</AppText>
      </Card>

      {volumes.length > 0 && (
        <Card>
          <SectionLabel>Objętość ostatnich sesji</SectionLabel>
          <View style={styles.chart}>
            {volumes.map((x, i) => (
              <View key={i} style={styles.barWrap}>
                <View style={[styles.bar, { height: `${Math.max(6, (x.v / maxV) * 100)}%`, backgroundColor: sessionColor(x.t) }]} />
                <AppText faint size={9} monoFont>{x.t}</AppText>
              </View>
            ))}
          </View>
          <AppText faint size={font.tiny}>Objętość = powtórzenia + sekundy izometryczne/4. Trend ważniejszy niż liczba.</AppText>
        </Card>
      )}

      {recsByEx.length > 0 && (
        <Card>
          <SectionLabel>Rekordy osobiste</SectionLabel>
          {recsByEx.map((g) => {
            const best = g.recs[0];
            const lvl = g.ex.levels.find((l) => l.id === best.levelId);
            return (
              <View key={g.ex.id} style={styles.recRow}>
                <AppText style={{ flex: 1 }}>{g.ex.name}</AppText>
                <AppText dim size={font.tiny} style={{ flex: 1 }}>{lvl?.name}</AppText>
                <AppText monoFont weight="700" style={{ color: colors.accent }}>
                  {best.value} {best.unit === 'reps' ? 'powt.' : 's'}
                </AppText>
              </View>
            );
          })}
        </Card>
      )}

      {moodSeries.length >= 2 && (
        <Card>
          <SectionLabel>Nastrój w czasie · ostatnie {moodSeries.length}</SectionLabel>
          <View style={styles.moodChart}>
            {moodSeries.map((d) => (
              <View key={d.date} style={styles.moodCol}>
                <View style={[styles.moodBar, { height: `${((d.mood ?? 0) / 5) * 100}%`, backgroundColor: (d.mood ?? 0) >= 3 ? colors.good : colors.warn }]} />
              </View>
            ))}
          </View>
          <AppText faint size={font.tiny}>Do obserwacji tendencji i wahań. Pełne dane wyeksportujesz z Ustawień (JSON / CSV).</AppText>
        </Card>
      )}

      {emotionsSorted.length > 0 && (
        <Card>
          <SectionLabel>Emocje · częstość</SectionLabel>
          {emotionsSorted.map(([name, n]) => (
            <View key={name} style={styles.emoRow}>
              <AppText size={font.small} style={{ width: 110 }}>{name}</AppText>
              <View style={styles.emoTrack}>
                <View style={[styles.emoFill, { width: `${(n / maxEmotion) * 100}%` }]} />
              </View>
              <AppText monoFont dim size={font.small} style={{ width: 28, textAlign: 'right' }}>{n}</AppText>
            </View>
          ))}
        </Card>
      )}

      <SectionLabel>Historia sesji</SectionLabel>
      {done.length === 0 ? (
        <AppText dim>Brak sesji. Pierwsza zawsze najtrudniejsza — potem już z górki.</AppText>
      ) : (
        done.map((s) => (
          <Card key={s.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={[styles.typeBadge, { backgroundColor: sessionColor(s.type) }]}>
                <AppText monoFont weight="700" style={{ color: '#12130F' }}>{s.type}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="600">{shortDate(s.date)}</AppText>
                <AppText dim size={font.tiny}>
                  {s.sets.filter((x) => x.done).length} serii · {s.durationMinutes} min
                  {s.energyAfter ? ` · energia ${s.energyAfter}/5` : ''}
                </AppText>
              </View>
              <AppText monoFont dim>{Math.round(sessionVolume(s))}</AppText>
            </View>
            {s.notes ? <AppText faint size={font.tiny}>„{s.notes}"</AppText> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <AppText monoFont weight="700" style={{ fontSize: 40, color: accent ? colors.accent : colors.text }}>{value}</AppText>
      <SectionLabel>{label}</SectionLabel>
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, paddingVertical: space.sm },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 },
  bar: { width: '80%', borderRadius: 3, minHeight: 4 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  typeBadge: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  moodChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 80, paddingVertical: space.sm },
  moodCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  moodBar: { width: '100%', borderRadius: 2, minHeight: 3 },
  emoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  emoTrack: { flex: 1, height: 12, backgroundColor: colors.surfaceAlt, borderRadius: 6, overflow: 'hidden' },
  emoFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 6 },
});
