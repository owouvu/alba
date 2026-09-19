# Alba — Alarma con reto físico

App de alarma que **solo se apaga completando un reto físico** (uno por alarma).
Objetivo: obligar a levantarse de la cama de verdad.

## Stack
- React Native + **Expo** (development build para la alarma).
- **UI:** react-native-paper (Material 3), estilo minimalista, un solo color de acento (tono amanecer).
- **BD local:** expo-sqlite.
- **Sensores:** expo-sensors (acelerómetro + sensor de luz).
- **Alarma (pendiente):** notifee con full-screen intent + alarma exacta de Android.

## Retos (uno por alarma)
| Reto | Sensor | Anti-trampa |
|------|--------|-------------|
| Pasos | Acelerómetro (picos de movimiento) | umbral + histéresis, intervalo mín. 300 ms |
| Saltos | Acelerómetro (impacto fuerte) | umbral alto, intervalo mín. 600 ms |
| Lagartijas | Sensor de luz como "proximidad": la nariz cubre/descubre el sensor superior | intervalo mín. 1500 ms entre repeticiones |

> Nota: expo-sensors no tiene sensor de proximidad, así que usamos el **sensor de luz**
> (cubrir/descubrir) como proxy. Es Android-only, justo nuestro objetivo.

## Base de datos (SQLite)
- `alarmas` (id, hora, activa, dias, tipo_reto, meta)
- `historial` (id, id_alarma, fecha, reto, meta, completado, segundos)
- CRUD completo en `src/db/database.js`.

## Estructura del código
```
App.js                      Navegación + tema Material 3 + init de la BD
src/theme.js                Paleta MD3 y catálogo de retos (RETOS)
src/db/database.js          SQLite: crear tablas + CRUD
src/screens/HomeScreen.js   Lista de alarmas, Switch, FAB, botón probar reto
src/screens/AlarmFormScreen Crear/editar: hora, días, reto, meta
src/screens/ChallengeScreen El reto con sensores + anti-trampa
src/screens/HistoryScreen   Historial desde la BD
```

## Estado actual (hecho)
- [x] Proyecto Expo + librerías
- [x] Tema Material 3 minimalista
- [x] BD SQLite con CRUD
- [x] Pantallas: inicio, formulario, reto, historial
- [x] Los 3 retos con sus sensores y anti-trampa
- [x] **Alarma en segundo plano** con Notifee (alarma exacta + full-screen intent)
- [x] Sonido en bucle con expo-audio hasta completar el reto
- [x] Reprogramación de alarmas repetidas y al abrir la app

## Cómo funciona la alarma
- `src/alarm/alarm.js`: crea el canal, calcula la próxima hora y programa la
  alarma exacta de Android (`AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE`).
- La notificación usa `fullScreenAction` → abre la app sobre la pantalla de bloqueo.
- `index.js`: `notifee.onBackgroundEvent` (obligatorio para app cerrada).
- `App.js`: al abrir por una alarma, navega directo a `ChallengeScreen`.
- `ChallengeScreen`: reproduce `assets/alarm.wav` en bucle; al completar el reto
  detiene el sonido, cancela la notificación y reprograma si la alarma se repite.
- Permisos en `app.json`: USE_EXACT_ALARM, SCHEDULE_EXACT_ALARM,
  USE_FULL_SCREEN_INTENT, POST_NOTIFICATIONS, VIBRATE, WAKE_LOCK.

## IMPORTANTE: requiere development build (no Expo Go)
Notifee es módulo nativo → hay que compilar un dev build:
```
npx expo prebuild --platform android
npx expo run:android        # con un teléfono/emulador Android conectado
```
Luego `npx expo start --dev-client` para desarrollar.

## Arreglos del build de Android (importantes)
Dos cosas que hubo que resolver para que compilara el dev build:

1. **Repositorio de Notifee** (`Could not find app.notifee:core`): su `.aar` vive
   dentro de `node_modules`. Registrado en `android/build.gradle` y en `app.json`
   (`expo-build-properties` → `extraMavenRepos`).
2. **JDK correcto** (`jlink.exe ... JdkImageTransform failed`): el sistema tiene
   **JDK 26**, demasiado nuevo para Android. Se forzó el **JDK 21 de Android Studio**
   en `android/gradle.properties`:
   ```
   org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr
   ```

> ⚠️ Si algún día corres `npx expo prebuild --clean`, se regenera la carpeta
> `android/` y **se pierde la línea del JDK** en gradle.properties. Vuelve a
> agregarla (el repo de Notifee sí se conserva porque está en app.json).

## Pendientes / mejoras posibles
- [ ] Probar en teléfono real: ajustar umbrales de sensores si hace falta.
- [ ] Botón de "posponer" (snooze) opcional.
- [ ] En Android 14+, si el full-screen no aparece, revisar permiso de
      "notificaciones a pantalla completa" en Ajustes.

## Cómo correr
- UI, BD y sensores (rápido): `npx expo start` + Expo Go.
- Alarma completa: development build (ver arriba). La alarma NO suena en Expo Go.
