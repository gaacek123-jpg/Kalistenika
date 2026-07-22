// Szczegóły ćwiczenia: drabinka progresji, instrukcje techniki, piktogram, wybór poziomu.

import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '../store/AppState';
import { EXERCISES } from '../data/plan';
import { currentLevel } from '../logic/derive';
import { colors, font, radius, space } from '../theme';
import { AppText, Button, Card, Screen, SectionLabel, Title } from '../components/ui';
import { Pictogram } from '../components/Pictogram';

export default function ExerciseScreen({ route }: any) {
  const { exerciseId } = route.params;
  const app = useApp();
  const ex = EXERCISES[exerciseId];
  const cur = currentLevel(app.data, exerciseId);

  if (!ex) return <Screen><Title>Nie znaleziono</Title></Screen>;

  return (
    <Screen>
      <Title>{ex.name}</Title>
      <SectionLabel>Drabinka progresji · {ex.ladderLabel}</SectionLabel>
      <AppText dim size={font.small}>
        Awans po osiągnięciu górnej granicy powtórzeń we wszystkich seriach — nie po dołożeniu kolejnych.
      </AppText>

      {ex.levels.map((lvl) => {
        const active = cur?.id === lvl.id;
        return (
          <Card key={lvl.id} style={active ? { borderColor: colors.accent } : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={styles.step}>
                <AppText monoFont weight="700">{lvl.order}</AppText>
              </View>
              <AppText weight="700" size={font.h3} style={{ flex: 1 }}>{lvl.name}</AppText>
              {active && <View style={styles.badge}><AppText size={font.tiny} weight="700" style={{ color: '#12130F' }}>TERAZ</AppText></View>}
            </View>

            {active && (
              <View style={{ height: 90, marginVertical: space.sm }}>
                <Pictogram exerciseId={ex.id} size={90} />
              </View>
            )}

            <AppText dim size={font.small}>{lvl.instructions}</AppText>

            {lvl.cues?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs }}>
                {lvl.cues.map((c, i) => (
                  <View key={i} style={styles.cue}><AppText size={font.tiny} dim>{c}</AppText></View>
                ))}
              </View>
            ) : null}

            {lvl.videoUrl ? (
              <Pressable onPress={() => Linking.openURL(lvl.videoUrl!)}>
                <AppText style={{ color: colors.push }}>▶ Zobacz technikę (wideo)</AppText>
              </Pressable>
            ) : null}

            {!active && (
              <Button small kind="ghost" label="Ustaw jako aktualny poziom" onPress={() => app.setLevel(ex.id, lvl.id)} />
            )}
          </Card>
        );
      })}

      <AppText faint size={font.tiny}>
        Zmiana poziomu jest ręczna i odwracalna. Apka sama proponuje awans po spełnieniu kryterium w sesji.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: colors.accent, paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.sm },
  cue: { backgroundColor: colors.surfaceAlt, paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.sm },
});
