import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Notifee wymaga zarejestrowania handlera zdarzeń w tle PRZED rejestracją appki —
// obsługuje akcje budzika (Wyłącz / Drzemka), gdy apka jest w tle lub ubita.
if (Platform.OS === 'android') {
  // Import dynamiczny, żeby nie ładować Notifee na web.
  const notifee = require('@notifee/react-native').default;
  const { handleAlarmEvent } = require('./src/notifications/alarmEvents');
  notifee.onBackgroundEvent(async ({ type, detail }: any) => {
    await handleAlarmEvent(type, detail);
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
