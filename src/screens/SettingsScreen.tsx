// Ustawienia: przypomnienia (godziny/eskalacja), test, eksport/import JSON,
// status deloadu, reset. + jawna informacja o ograniczeniach „budzika".

import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../store/AppState';
import { ReminderConfig } from '../types';
import { deloadDue } from '../logic/derive';
import { emptyData, parseImport, serialize } from '../store/storage';
import { fireTest, requestPermissions, scheduledCount } from '../notifications/notify';
import { exactAlarmAllowed, fireAlarmTest, openExactAlarmSettings } from '../notifications/alarm';
import { napHours, nightSegment } from '../logic/sleep';
import { ymd } from '../logic/dates';
import { colors, font, mono, radius, space } from '../theme';
import { AppText, Button, Card, Divider, Screen, SectionLabel, Title } from '../components/ui';

const two = (n: number) => String(n).padStart(2, '0');

export default function SettingsScreen() {
  const app = useApp();
  const r = app.data.reminders;
  const [count, setCount] = useState<number | null>(null);
  const [alarmOk, setAlarmOk] = useState<boolean | null>(null);
  const [picker, setPicker] = useState<{ open: boolean; kind: 'training' | 'journal'; index: number }>({ open: false, kind: 'training', index: 0 });

  useEffect(() => {
    scheduledCount().then(setCount).catch(() => setCount(null));
    exactAlarmAllowed().then(setAlarmOk).catch(() => setAlarmOk(null));
  }, [r]);

  const update = (patch: Partial<ReminderConfig>) => app.updateReminders({ ...r, ...patch });

  const setTime = (kind: 'training' | 'journal', index: number, hour: number, minute: number) => {
    if (kind === 'journal') {
      update({ journalTime: { hour, minute } });
    } else {
      const trainingTimes = r.trainingTimes.map((t, i) => (i === index ? { ...t, hour, minute } : t));
      update({ trainingTimes });
    }
  };

  const toggleAlarm = (index: number) => {
    update({ trainingTimes: r.trainingTimes.map((t, i) => (i === index ? { ...t, alarm: !t.alarm } : t)) });
  };

  const removeTime = (index: number) => {
    if (r.trainingTimes.length <= 1) return;
    update({ trainingTimes: r.trainingTimes.filter((_, i) => i !== index) });
  };

  const addTime = () => {
    const last = r.trainingTimes[r.trainingTimes.length - 1];
    update({ trainingTimes: [...r.trainingTimes, { hour: last.hour, minute: Math.min(59, last.minute + 15), alarm: true }] });
  };

  const enableNotifs = async () => {
    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('Brak zgody', 'Bez zgody na powiadomienia budzik nie zadziała. Włącz je w ustawieniach systemu.');
      return;
    }
    update({ enabled: true });
    Alert.alert('Gotowe', 'Powiadomienia włączone i zaplanowane na pon/śr/pt.');
  };

  const doExport = async () => {
    try {
      const path = `${FileSystem.cacheDirectory}kalistenika-${ymd()}.json`;
      await FileSystem.writeAsStringAsync(path, serialize(app.data));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Eksport danych Kalistenika' });
      } else {
        Alert.alert('Zapisano', path);
      }
    } catch (e: any) {
      Alert.alert('Błąd eksportu', String(e?.message ?? e));
    }
  };

  const doExportCsv = async () => {
    try {
      const esc = (s: unknown) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
      const header = ['data', 'nastroj_1_5', 'emocje', 'powod', 'sen_godziny', 'sen_od', 'sen_do', 'drzemki_h', 'sen_jakosc_1_5', 'wpisy_dnia', 'inne_aktywnosci', 'gtg_podejscia', 'spacer'].join(',');
      const rows = [...app.data.days]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => {
          const night = nightSegment(d.sleepSegments ?? []);
          const np = napHours(d.sleepSegments ?? []);
          return [
            d.date,
            d.mood ?? '',
            (d.emotions ?? []).join('|'),
            d.emotionReason ?? '',
            d.sleepHours ?? '',
            night?.start ?? '',
            night?.end ?? '',
            np > 0 ? Math.round(np * 10) / 10 : '',
            d.sleepQuality ?? '',
            (d.mealEntries ?? []).map((m) => `${m.time} ${m.text}`).join(' | '),
            (d.activities ?? []).map((a) => `${a.name}${a.minutes != null ? ` ${a.minutes}min` : ''}`).join(' | '),
            d.gtgSets ?? 0,
            d.walkDone === true ? 1 : d.walkDone === false ? 0 : '',
          ]
            .map(esc)
            .join(',');
        });
      const csv = [header, ...rows].join('\n');
      const path = `${FileSystem.cacheDirectory}kalistenika-nastroj-${ymd()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Eksport dziennika nastroju (CSV)' });
      } else {
        Alert.alert('Zapisano', path);
      }
    } catch (e: any) {
      Alert.alert('Błąd eksportu CSV', String(e?.message ?? e));
    }
  };

  const doImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const text = await FileSystem.readAsStringAsync(res.assets[0].uri);
      const data = parseImport(text);
      Alert.alert('Import', `Wczytać dane? Sesje: ${data.sessions.length}, dni: ${data.days.length}. To nadpisze obecne dane.`, [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Nadpisz', style: 'destructive', onPress: () => app.replaceAll(data) },
      ]);
    } catch (e: any) {
      Alert.alert('Błąd importu', String(e?.message ?? e));
    }
  };

  const confirmReset = () => {
    Alert.alert('Reset danych', 'Usunąć całą historię, rekordy i dziennik? Tego nie da się cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń wszystko', style: 'destructive', onPress: () => app.replaceAll(emptyData()) },
    ]);
  };

  const dl = deloadDue(app.data);

  return (
    <Screen>
      <Title>Ustawienia</Title>

      {/* Powiadomienia */}
      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <SectionLabel>Przypomnienia treningowe</SectionLabel>
          </View>
          <Switch value={r.enabled} onValueChange={(v) => (v ? enableNotifs() : update({ enabled: false }))} thumbColor={r.enabled ? colors.accent : undefined} />
        </View>
        <AppText faint size={font.tiny}>Tylko pon / śr / pt. Weekend jest cichy. Eskalacja rośnie w ciągu dnia.</AppText>

        {r.trainingTimes.map((t, i) => (
          <View key={i} style={styles.timeRow}>
            <AppText monoFont dim style={{ width: 22 }}>{i + 1}.</AppText>
            <Pressable style={styles.timeBtn} onPress={() => setPicker({ open: true, kind: 'training', index: i })}>
              <AppText monoFont size={font.h3} weight="700">{two(t.hour)}:{two(t.minute)}</AppText>
            </Pressable>
            <Pressable onPress={() => toggleAlarm(i)} style={[styles.alarmChip, t.alarm && { backgroundColor: colors.danger, borderColor: colors.danger }]}>
              <AppText size={font.tiny} weight="700" style={{ color: t.alarm ? '#fff' : colors.textDim }}>{t.alarm ? '⏰ budzik' : 'zwykłe'}</AppText>
            </Pressable>
            <Pressable onPress={() => removeTime(i)} style={styles.del}><AppText dim>✕</AppText></Pressable>
          </View>
        ))}
        <Button small kind="ghost" label="+ dodaj godzinę" onPress={addTime} />

        <Divider />
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <SectionLabel>Codzienne przypomnienie o dzienniku</SectionLabel>
          </View>
          <Switch value={r.journalEnabled} onValueChange={(v) => update({ journalEnabled: v })} thumbColor={r.journalEnabled ? colors.accent : undefined} />
        </View>
        <View style={styles.timeRow}>
          <Pressable style={styles.timeBtn} onPress={() => setPicker({ open: true, kind: 'journal', index: 0 })}>
            <AppText monoFont size={font.h3} weight="700">{two(r.journalTime.hour)}:{two(r.journalTime.minute)}</AppText>
          </Pressable>
          <AppText dim size={font.small}>jedzenie · nastrój</AppText>
        </View>

        <Divider />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button small kind="ghost" label="Test powiadomienia" onPress={() => fireTest()} style={{ flex: 1 }} />
          <Button small label="Test budzika" onPress={() => fireAlarmTest()} style={{ flex: 1 }} />
        </View>
        <AppText faint size={font.tiny}>Zaplanowanych powiadomień: {count ?? '—'}. „Test budzika" zadzwoni za ~3 s (pełny ekran).</AppText>

        <Divider />
        <SectionLabel>Budzik — uprawnienia</SectionLabel>
        <AppText faint size={font.tiny}>
          Godziny oznaczone „⏰ budzik" dzwonią pełnoekranowo, głośnością alarmu, aż wyłączysz. Wymaga zgody
          na dokładne alarmy i pełny ekran.
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <View style={[styles.dot, { backgroundColor: alarmOk == null ? colors.textFaint : alarmOk ? colors.good : colors.danger }]} />
          <AppText size={font.small} dim>
            Dokładne alarmy: {alarmOk == null ? '—' : alarmOk ? 'włączone' : 'ZABLOKOWANE'}
          </AppText>
        </View>
        <Button small kind="ghost" label="Ustawienia alarmów / pełny ekran" onPress={() => openExactAlarmSettings()} />
        <AppText faint size={font.tiny}>
          Dodatkowo wyłącz optymalizację baterii dla apki, a na Xiaomi/Samsung/Oppo włącz „autostart" —
          inaczej system potrafi ubić budzik.
        </AppText>
      </Card>

      {/* Deload */}
      <Card style={dl.due ? { borderColor: colors.warn } : undefined}>
        <SectionLabel>Deload</SectionLabel>
        {app.data.firstSessionDate ? (
          <AppText size={font.small} dim>
            Od punktu odniesienia minęło {dl.weeks} tyg. {dl.due ? 'Czas na lżejszy tydzień (połowa serii, ten sam wariant).' : 'Deload proponowany co 6–8 tyg.'}
          </AppText>
        ) : (
          <AppText size={font.small} dim>Licznik ruszy po pierwszej sesji.</AppText>
        )}
        {dl.due && <Button small label="Zrobiłem deload — resetuj licznik" onPress={app.markDeloadDone} />}
      </Card>

      {/* Dane */}
      <Card>
        <SectionLabel>Dane</SectionLabel>
        <AppText faint size={font.tiny}>Rób kopię co jakiś czas — dane trzymane są lokalnie na telefonie.</AppText>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button label="Eksport JSON" kind="ghost" onPress={doExport} style={{ flex: 1 }} />
          <Button label="Import JSON" kind="ghost" onPress={doImport} style={{ flex: 1 }} />
        </View>
        <Button label="Eksport nastroju (CSV)" kind="ghost" onPress={doExportCsv} />
        <AppText faint size={font.tiny}>CSV = data, nastrój 1–5, emocje, powód, sen (godziny + jakość), wpisy dnia (jedzenie/suplementy z godziną). Do analizy tendencji / dla lekarza.</AppText>
        <Button label="Reset — usuń wszystko" kind="danger" onPress={confirmReset} />
      </Card>

      <AppText faint size={font.tiny} style={{ textAlign: 'center' }}>
        Kalistenika · pon/śr/pt · konsekwencja {'>'} kilogramy
      </AppText>

      {picker.open && (
        <DateTimePicker
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={(() => {
            const d = new Date();
            if (picker.kind === 'journal') { d.setHours(r.journalTime.hour, r.journalTime.minute); }
            else { d.setHours(r.trainingTimes[picker.index].hour, r.trainingTimes[picker.index].minute); }
            return d;
          })()}
          onChange={(event, date) => {
            setPicker((p) => ({ ...p, open: false }));
            if (event.type === 'set' && date) setTime(picker.kind, picker.index, date.getHours(), date.getMinutes());
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: 4 },
  timeBtn: { backgroundColor: colors.surfaceAlt, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.sm },
  alarmChip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong },
  del: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
