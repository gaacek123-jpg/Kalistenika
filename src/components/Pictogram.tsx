// Schematyczne piktogramy sylwetek + strzałka kierunku ruchu (spec §3.7 opcja 1).
// Celowo proste linie — mają orientować, nie uczyć techniki (od tego są instrukcje).

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { colors } from '../theme';

const S = colors.text;
const A = colors.accent;
const D = colors.textFaint;

function Body({ children }: { children: React.ReactNode }) {
  return (
    <Svg viewBox="0 0 120 70" width="100%" height="100%">
      <G stroke={S} strokeWidth={3} strokeLinecap="round" fill="none">
        {children}
      </G>
    </Svg>
  );
}

const head = (cx: number, cy: number) => <Circle key="h" cx={cx} cy={cy} r={6} stroke={S} strokeWidth={3} fill="none" />;
const arrow = (x1: number, y1: number, x2: number, y2: number) => (
  <G key="arr" stroke={A} strokeWidth={3} strokeLinecap="round" fill="none">
    <Line x1={x1} y1={y1} x2={x2} y2={y2} />
    <Path d={`M ${x2} ${y2} l -5 -5 M ${x2} ${y2} l -5 5`} />
  </G>
);

const P: Record<string, React.ReactNode> = {
  // Pompki — sylwetka pozioma, strzałka w dół/górę
  pushup: (
    <Body>
      {head(24, 40)}
      <Line x1={30} y1={42} x2={92} y2={42} />
      <Line x1={92} y1={42} x2={92} y2={58} />
      <Line x1={40} y1={42} x2={40} y2={58} />
      {arrow(64, 30, 64, 44)}
    </Body>
  ),
  // Podciąganie — postać wisząca pod drążkiem, strzałka w górę
  pullup: (
    <Body>
      <Line x1={20} y1={10} x2={100} y2={10} />
      <Line x1={48} y1={10} x2={48} y2={20} />
      <Line x1={72} y1={10} x2={72} y2={20} />
      {head(60, 28)}
      <Line x1={60} y1={34} x2={60} y2={52} />
      <Line x1={48} y1={20} x2={60} y2={40} />
      <Line x1={72} y1={20} x2={60} y2={40} />
      {arrow(90, 40, 90, 22)}
    </Body>
  ),
  // Wiosłowanie — postać skośnie pod drążkiem, ciągnie do góry
  rowAus: (
    <Body>
      <Line x1={30} y1={12} x2={100} y2={12} />
      {head(44, 46)}
      <Line x1={50} y1={44} x2={92} y2={22} />
      <Line x1={62} y1={38} x2={70} y2={16} />
      <Line x1={92} y1={22} x2={100} y2={30} />
      {arrow(58, 40, 66, 22)}
    </Body>
  ),
  // Przysiad — postać pionowa, strzałka w dół
  squat: (
    <Body>
      {head(50, 14)}
      <Line x1={50} y1={20} x2={50} y2={40} />
      <Line x1={50} y1={40} x2={40} y2={56} />
      <Line x1={50} y1={40} x2={60} y2={56} />
      <Line x1={50} y1={26} x2={38} y2={34} />
      <Line x1={50} y1={26} x2={62} y2={34} />
      {arrow(84, 24, 84, 48)}
    </Body>
  ),
  // Deska — pozioma linia ciała na przedramionach
  plank: (
    <Body>
      {head(26, 42)}
      <Line x1={32} y1={44} x2={96} y2={52} />
      <Line x1={34} y1={44} x2={30} y2={58} />
      <Line x1={96} y1={52} x2={96} y2={58} />
      <Line x1={30} y1={58} x2={40} y2={58} />
    </Body>
  ),
  // Superman — leży na brzuchu, ręce i nogi uniesione
  superman: (
    <Body>
      <Path d="M 20 46 Q 60 34 100 46" />
      {head(16, 44)}
      <Line x1={30} y1={44} x2={18} y2={34} />
      <Line x1={90} y1={44} x2={102} y2={34} />
      {arrow(60, 44, 60, 30)}
    </Body>
  ),
  // Pike — biodra w górze, sylwetka w kształt V
  pikePushup: (
    <Body>
      {head(30, 40)}
      <Line x1={34} y1={40} x2={60} y2={16} />
      <Line x1={60} y1={16} x2={92} y2={52} />
      <Line x1={34} y1={40} x2={30} y2={54} />
      {arrow(40, 30, 34, 42)}
    </Body>
  ),
  // Wykrok — postać w wykroku
  lunge: (
    <Body>
      {head(50, 12)}
      <Line x1={50} y1={18} x2={50} y2={36} />
      <Line x1={50} y1={36} x2={72} y2={52} />
      <Line x1={72} y1={52} x2={72} y2={40} />
      <Line x1={50} y1={36} x2={34} y2={56} />
      {arrow(84, 22, 84, 46)}
    </Body>
  ),
  // Deska bokiem — ciało skośnie, podpór na jednym przedramieniu
  sidePlank: (
    <Body>
      {head(24, 30)}
      <Line x1={30} y1={34} x2={96} y2={56} />
      <Line x1={34} y1={36} x2={30} y2={58} />
      <Line x1={30} y1={58} x2={40} y2={58} />
      <Line x1={44} y1={42} x2={44} y2={24} />
    </Body>
  ),
  // Hollow — leży, ciało w kształt banana, ręce i nogi w górze
  hollow: (
    <Body>
      <Path d="M 22 50 Q 60 40 98 50" />
      {head(16, 46)}
      <Line x1={26} y1={49} x2={16} y2={38} />
      <Line x1={94} y1={49} x2={104} y2={38} />
    </Body>
  ),
};

// Krążenia ramion — postać z okrężną strzałką przy barku
P.arms = (
  <Body>
    {head(50, 16)}
    <Line x1={50} y1={22} x2={50} y2={44} />
    <Line x1={50} y1={44} x2={42} y2={58} />
    <Line x1={50} y1={44} x2={58} y2={58} />
    <Line x1={50} y1={28} x2={64} y2={24} />
    <G stroke={A} strokeWidth={3} fill="none">
      <Path d="M 78 20 a 12 12 0 1 1 -8 -4" strokeLinecap="round" />
      <Path d="M 70 16 l 2 8 l 8 -2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Body>
);

// Pajacyki — postać z rozłożonymi rękami i nogami + łuki ruchu
P.jumpingjack = (
  <Body>
    {head(60, 16)}
    <Line x1={60} y1={22} x2={60} y2={42} />
    <Line x1={60} y1={26} x2={40} y2={16} />
    <Line x1={60} y1={26} x2={80} y2={16} />
    <Line x1={60} y1={42} x2={46} y2={58} />
    <Line x1={60} y1={42} x2={74} y2={58} />
    <G stroke={A} strokeWidth={2.5} fill="none" strokeLinecap="round">
      <Path d="M 32 22 a 16 16 0 0 1 8 -10" />
      <Path d="M 88 22 a 16 16 0 0 0 -8 -10" />
    </G>
  </Body>
);

// chinup dzieli sylwetkę z pullup; zwis i ściąganie łopatek to też wis na drążku
P.chinup = P.pullup;
P.hang = P.pullup;
P.scapPull = P.pullup;

export function Pictogram({ exerciseId, size = 90 }: { exerciseId: string; size?: number }) {
  const node = P[exerciseId] ?? P.plank;
  return <View style={{ width: '100%', height: size }}>{node}</View>;
}
