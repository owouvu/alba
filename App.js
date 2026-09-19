import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, IconButton } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer, DefaultTheme, createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import notifee, { EventType } from '@notifee/react-native';

import { theme, FONTS } from './src/theme';
import { initDatabase, getAlarmas } from './src/db/database';
import { initAlarms, rescheduleActivas } from './src/alarm/alarm';
import HomeScreen from './src/screens/HomeScreen';
import AlarmFormScreen from './src/screens/AlarmFormScreen';
import ChallengeScreen from './src/screens/ChallengeScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

// react-native-paper usará @expo/vector-icons (que sí carga su fuente de iconos),
// para que no aparezcan cuadraditos en lugar de los íconos.
const paperSettings = {
  icon: (props) => <MaterialCommunityIcons {...props} />,
};

function irAlReto(data) {
  if (!data?.tipo_reto) return;
  const params = {
    id_alarma: data.id_alarma ? Number(data.id_alarma) : null,
    tipo_reto: data.tipo_reto,
    meta: Number(data.meta) || 1,
  };
  if (navigationRef.isReady()) navigationRef.navigate('Challenge', params);
}

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.background,
    text: theme.colors.onSurface,
    primary: theme.colors.primary,
    border: theme.colors.surfaceVariant,
  },
};

const headerOptions = {
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.onSurface,
  headerTitleStyle: { fontFamily: FONTS.semibold, fontSize: 20 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: theme.colors.background },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const retoInicial = useRef(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    (async () => {
      await initDatabase();
      await initAlarms();
      await rescheduleActivas(await getAlarmas());

      const inicial = await notifee.getInitialNotification();
      if (inicial?.notification?.data?.tipo_reto) {
        retoInicial.current = inicial.notification.data;
      }
      setReady(true);
    })().catch((e) => console.error('Error al iniciar:', e));

    const unsub = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        irAlReto(detail.notification?.data);
      }
    });
    return unsub;
  }, []);

  if (!ready || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme} settings={paperSettings}>
        <NavigationContainer
          ref={navigationRef}
          theme={navTheme}
          onReady={() => {
            if (retoInicial.current) {
              irAlReto(retoInicial.current);
              retoInicial.current = null;
            }
          }}
        >
          <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'Alba',
                headerRight: () => (
                  <IconButton
                    icon="history"
                    onPress={() => navigation.navigate('History')}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="AlarmForm"
              component={AlarmFormScreen}
              options={{ title: 'Nueva alarma' }}
            />
            <Stack.Screen
              name="Challenge"
              component={ChallengeScreen}
              options={{ title: 'Reto', headerBackVisible: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: 'Historial' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
