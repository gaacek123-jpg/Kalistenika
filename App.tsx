// Punkt wejścia: provider stanu, nawigacja, inicjalizacja powiadomień, ciemny motyw.

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppProvider, useApp } from './src/store/AppState';
import { Loader } from './src/components/ui';
import { colors, mono } from './src/theme';
import { configureHandler, ensureChannels, requestPermissions } from './src/notifications/notify';

import SessionScreen from './src/screens/SessionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import JournalScreen from './src/screens/JournalScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontFamily: mono, fontSize: 18, fontWeight: '700' }}>{glyph}</Text>;
}

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Sesja" component={SessionScreen} options={{ tabBarIcon: ({ color }) => <TabIcon glyph="▦" color={color} /> }} />
      <Tab.Screen name="Historia" component={HistoryScreen} options={{ tabBarIcon: ({ color }) => <TabIcon glyph="▤" color={color} /> }} />
      <Tab.Screen name="Dziennik" component={JournalScreen} options={{ tabBarIcon: ({ color }) => <TabIcon glyph="✎" color={color} /> }} />
      <Tab.Screen name="Ustawienia" component={SettingsScreen} options={{ tabBarIcon: ({ color }) => <TabIcon glyph="⚙" color={color} /> }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { loading } = useApp();
  if (loading) return <Loader />;
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} options={{ title: 'Ćwiczenie', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    configureHandler();
    ensureChannels().catch(() => {});
    requestPermissions().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <Root />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
