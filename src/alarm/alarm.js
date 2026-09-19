import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  TriggerType,
  AlarmType,
} from '@notifee/react-native';

const CHANNEL_ID = 'alarma';

// getDay(): 0=Dom..6=Sab  ->  letras que usamos en la app
const LETRA_POR_DIA = { 0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S' };

// Pide permisos y crea el canal de notificación de alarmas. Se llama al iniciar.
export async function initAlarms() {
  await notifee.requestPermission();
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Alarmas',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    bypassDnd: true,
  });
}

// Calcula el timestamp (ms) de la próxima vez que debe sonar la alarma.
export function computeNextTrigger(hora, dias = []) {
  const [h, m] = hora.split(':').map(Number);
  const ahora = new Date();

  // Busca en los próximos 8 días (hoy incluido) el primer momento válido y futuro.
  for (let i = 0; i < 8; i++) {
    const cand = new Date(ahora);
    cand.setDate(ahora.getDate() + i);
    cand.setHours(h, m, 0, 0);

    if (cand.getTime() <= ahora.getTime()) continue; // ya pasó
    if (dias.length === 0) return cand.getTime();     // sin repetición: la más próxima
    if (dias.includes(LETRA_POR_DIA[cand.getDay()])) return cand.getTime();
  }
  // Respaldo: mañana a esa hora.
  const f = new Date(ahora);
  f.setDate(ahora.getDate() + 1);
  f.setHours(h, m, 0, 0);
  return f.getTime();
}

// Programa (o reemplaza) la alarma exacta de Android para una alarma dada.
export async function scheduleAlarm(alarma) {
  const dias = alarma.dias ? alarma.dias.split(',') : [];
  const timestamp = computeNextTrigger(alarma.hora, dias);

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
  };

  await notifee.createTriggerNotification(
    {
      id: `alarma-${alarma.id}`,
      title: 'Alba',
      body: '¡Hora de levantarte! Te espera un reto sorpresa 🎲',
      data: {
        id_alarma: String(alarma.id),
        tipo_reto: String(alarma.tipo_reto),
        meta: String(alarma.meta),
      },
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        // full-screen intent: abre la app sobre la pantalla de bloqueo.
        fullScreenAction: { id: 'default', launchActivity: 'default' },
        pressAction: { id: 'default', launchActivity: 'default' },
        autoCancel: false,
        ongoing: true,
      },
    },
    trigger
  );

  return timestamp;
}

// Cancela la alarma programada y su notificación (si estuviera visible).
export async function cancelAlarm(id) {
  await notifee.cancelTriggerNotification(`alarma-${id}`);
  await notifee.cancelNotification(`alarma-${id}`);
}

// Reprograma todas las alarmas activas (se llama al abrir la app para no perder ninguna).
export async function rescheduleActivas(alarmas) {
  for (const a of alarmas) {
    if (a.activa) await scheduleAlarm(a);
    else await cancelAlarm(a.id);
  }
}
