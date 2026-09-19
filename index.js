import { registerRootComponent } from 'expo';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';

// Manejador de eventos de notificación en segundo plano (app cerrada/en background).
// Necesario para que Notifee entregue la alarma aunque la app no esté abierta.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Al presionar la notificación, Android abre la app (launchActivity 'default').
  // La navegación al reto la resuelve App.js leyendo la notificación inicial.
  if (type === EventType.DELIVERED || type === EventType.PRESS) {
    // No hacemos trabajo pesado aquí; solo dejamos que la app arranque.
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
