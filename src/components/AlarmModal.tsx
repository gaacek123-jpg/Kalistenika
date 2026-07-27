// Pełnoekranowy ekran dzwoniącego budzika (gdy apka jest na pierwszym planie / została
// otwarta przez full-screen intent). Duże przyciski Wyłącz / Drzemka.

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, mono, radius, space } from '../theme';
import { SNOOZE_MINUTES } from '../notifications/alarm';

export function AlarmModal({
  visible,
  title,
  body,
  onDismiss,
  onSnooze,
}: {
  visible: boolean;
  title: string;
  body: string;
  onDismiss: () => void;
  onSnooze: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.bg}>
        <Text style={styles.bell}>⏰</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <View style={styles.buttons}>
          <Pressable style={[styles.btn, { backgroundColor: colors.surfaceAlt }]} onPress={onSnooze}>
            <Text style={[styles.btnTxt, { color: colors.text }]}>Drzemka {SNOOZE_MINUTES} min</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: colors.accent }]} onPress={onDismiss}>
            <Text style={[styles.btnTxt, { color: '#12130F' }]}>Wyłącz budzik</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.lg },
  bell: { fontSize: 96 },
  title: { color: colors.accent, fontFamily: mono, fontSize: font.h1, fontWeight: '700', textAlign: 'center' },
  body: { color: colors.text, fontSize: font.h3, textAlign: 'center', lineHeight: 26 },
  buttons: { width: '100%', gap: space.md, marginTop: space.xl },
  btn: { height: 72, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: font.h3, fontWeight: '700' },
});
