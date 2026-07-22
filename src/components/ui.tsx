// Komponenty UI wielokrotnego użytku — duże pola dotykowe, styl „karta warsztatowa".

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, HIT, mono, radius, space } from '../theme';

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: any }) {
  const inner = (
    <View style={[{ padding: space.lg, gap: space.md }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function AppText(props: TextProps & { dim?: boolean; faint?: boolean; monoFont?: boolean; size?: number; weight?: '400' | '600' | '700' }) {
  const { style, dim, faint, monoFont, size, weight, ...rest } = props;
  return (
    <Text
      {...rest}
      style={[
        {
          color: faint ? colors.textFaint : dim ? colors.textDim : colors.text,
          fontSize: size ?? font.body,
          fontFamily: monoFont ? mono : undefined,
          fontWeight: weight ?? '400',
        },
        style,
      ]}
    />
  );
}

export function Title({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{String(children).toUpperCase()}</Text>;
}

export function Card({ children, style, ...rest }: ViewProps & { children: React.ReactNode }) {
  return (
    <View {...rest} style={[styles.card, style]}>
      {children}
    </View>
  );
}

type BtnKind = 'primary' | 'ghost' | 'danger' | 'good';
export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  kind?: BtnKind;
  disabled?: boolean;
  small?: boolean;
  style?: any;
}) {
  const bg =
    kind === 'primary' ? colors.accent : kind === 'good' ? colors.good : kind === 'danger' ? colors.danger : 'transparent';
  const fg = kind === 'ghost' ? colors.text : '#12130F';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderWidth: kind === 'ghost' ? 1 : 0,
          borderColor: colors.borderStrong,
          minHeight: small ? 44 : HIT,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg, fontSize: small ? font.small : font.body }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? colors.accent : colors.surfaceAlt, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={{ color: active ? '#12130F' : colors.textDim, fontWeight: '600', fontSize: font.small }}>{label}</Text>
    </Pressable>
  );
}

/** Ocena 1–5 dużymi przyciskami. */
export function Scale5Input({ value, onChange, labelLow, labelHigh }: { value: number | null; onChange: (v: any) => void; labelLow?: string; labelHigh?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.scaleBtn, { backgroundColor: value === n ? colors.accent : colors.surfaceAlt }]}
          >
            <Text style={{ color: value === n ? '#12130F' : colors.textDim, fontFamily: mono, fontSize: font.h3, fontWeight: '700' }}>{n}</Text>
          </Pressable>
        ))}
      </View>
      {(labelLow || labelHigh) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.scaleHint}>{labelLow}</Text>
          <Text style={styles.scaleHint}>{labelHigh}</Text>
        </View>
      )}
    </View>
  );
}

/** Stepper liczbowy z dużymi +/−. */
export function Stepper({ value, onChange, min = 0, max = 999, step = 1, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(clamp(value - step))} style={styles.stepBtn}>
        <Text style={styles.stepSign}>−</Text>
      </Pressable>
      <Text style={styles.stepVal}>
        {value}
        {unit ? ` ${unit}` : ''}
      </Text>
      <Pressable onPress={() => onChange(clamp(value + step))} style={styles.stepBtn}>
        <Text style={styles.stepSign}>+</Text>
      </Pressable>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: space.xs }} />;
}

export function Loader() {
  return (
    <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sectionLabel: { color: colors.textDim, fontSize: font.tiny, letterSpacing: 1.5, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  btn: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  btnText: { fontWeight: '700' },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.sm },
  scaleBtn: { flex: 1, height: HIT, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  scaleHint: { color: colors.textFaint, fontSize: font.tiny },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepBtn: {
    width: HIT, height: HIT, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  stepSign: { color: colors.text, fontSize: 28, fontWeight: '700', fontFamily: mono },
  stepVal: { color: colors.text, fontSize: font.h2, fontFamily: mono, fontWeight: '700', minWidth: 64, textAlign: 'center' },
});
