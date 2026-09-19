import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Text, Button, ProgressBar, useTheme, Icon } from 'react-native-paper';

import { registrarHistorial, getAlarma, actualizarAlarma } from '../db/database';
import { cancelAlarm, scheduleAlarm } from '../alarm/alarm';
import { RETOS, retoAleatorio, FONTS } from '../theme';

// Parámetros de detección y anti-trampa por reto.
const CONFIG = {
  pasos:      { umbral: 1.25, minIntervalMs: 300 },   // pico de aceleración al caminar
  saltos:     { umbral: 1.8,  minIntervalMs: 600 },   // impacto fuerte al saltar
  lagartijas: { minIntervalMs: 1500 },                // toque con la nariz (anti-trampa)
};

const ANIMOS = ['¡Vamos!', '¡Así se hace!', '¡No pares!', '¡Casi!', '¡Eso es!'];

export default function ChallengeScreen({ navigation, route }) {
  const theme = useTheme();
  const { id_alarma = null, tipo_reto = 'pasos', meta = 20 } = route.params ?? {};
  const reto = RETOS[tipo_reto];

  const [conteo, setConteo] = useState(0);
  const [listo, setListo] = useState(false);
  const [aviso, setAviso] = useState('');       // "más lento" al hacer trampa
  const [animo, setAnimo] = useState('');

  const player = useAudioPlayer(require('../../assets/alarm.wav'));

  const inicio = useRef(Date.now());
  const ultimo = useRef(0);
  const conteoRef = useRef(0);
  const terminado = useRef(false);

  // Animaciones: rebote del número y latido del botón.
  const escalaNum = useRef(new Animated.Value(1)).current;
  const latido = useRef(new Animated.Value(1)).current;

  // Sonido de alarma en bucle.
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        player.loop = true;
        player.volume = 1.0;
        player.play();
      } catch (e) { console.warn('Audio:', e); }
    })();
    return () => { try { player.pause(); } catch {} };
  }, []);

  // Latido continuo del botón de lagartijas.
  useEffect(() => {
    if (tipo_reto !== 'lagartijas') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(latido, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(latido, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tipo_reto]);

  const rebote = () => {
    escalaNum.setValue(1);
    Animated.sequence([
      Animated.spring(escalaNum, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
      Animated.spring(escalaNum, { toValue: 1.0, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const sumarUno = () => {
    if (terminado.current) return;
    const ahora = Date.now();
    if (ahora - ultimo.current < CONFIG[tipo_reto].minIntervalMs) {
      // Anti-trampa: demasiado rápido, no cuenta.
      setAviso('¡Más despacio! No hagas trampa 😉');
      setTimeout(() => setAviso(''), 900);
      return;
    }
    ultimo.current = ahora;
    conteoRef.current += 1;
    setConteo(conteoRef.current);
    setAnimo(ANIMOS[Math.floor(Math.random() * ANIMOS.length)]);
    rebote();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (conteoRef.current >= meta) completar();
  };

  const completar = async () => {
    terminado.current = true;
    try { player.pause(); } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const segundos = Math.round((Date.now() - inicio.current) / 1000);
    await registrarHistorial({ id_alarma, reto: tipo_reto, meta, completado: true, segundos });

    // Apaga la alarma y, si se repite, sortea un nuevo reto para la próxima vez.
    if (id_alarma) {
      await cancelAlarm(id_alarma);
      const a = await getAlarma(id_alarma);
      if (a && a.activa && a.dias) {
        const nuevo = retoAleatorio();
        await actualizarAlarma(id_alarma, {
          hora: a.hora, dias: a.dias, tipo_reto: nuevo, meta: RETOS[nuevo].metaDefault,
        });
        await scheduleAlarm({ ...a, tipo_reto: nuevo, meta: RETOS[nuevo].metaDefault });
      }
    }
    setListo(true);
  };

  // Acelerómetro para pasos y saltos.
  useEffect(() => {
    if (tipo_reto !== 'pasos' && tipo_reto !== 'saltos') return;
    Accelerometer.setUpdateInterval(100);
    let bajo = true;
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const mag = Math.sqrt(x * x + y * y + z * z);
      const { umbral } = CONFIG[tipo_reto];
      if (mag > umbral && bajo) { bajo = false; sumarUno(); }
      else if (mag < 1.05) { bajo = true; }
    });
    return () => sub.remove();
  }, [tipo_reto]);

  const progreso = Math.min(conteo / meta, 1);
  const restante = Math.max(meta - conteo, 0);

  // Pantalla de éxito.
  if (listo) {
    return (
      <View style={[styles.container, { backgroundColor: reto.container }]}>
        <Icon source="check-circle" size={96} color={reto.color} />
        <Text variant="displaySmall" style={[styles.exitoTitulo, { color: reto.onContainer }]}>
          ¡Listo!
        </Text>
        <Text variant="titleMedium" style={{ color: reto.onContainer, textAlign: 'center' }}>
          Completaste {meta} {reto.unidad}. ¡Buen despertar!
        </Text>
        <Button
          mode="contained"
          icon="alarm-off"
          buttonColor={reto.color}
          style={styles.botonExito}
          contentStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
          onPress={() => navigation.navigate('Home')}
        >
          Alarma apagada
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: reto.container }]}>
      <Text variant="displaySmall" style={[styles.titulo, { color: reto.onContainer }]}>
        {reto.label}
      </Text>

      <Animated.Text
        style={[styles.numero, { color: reto.color, transform: [{ scale: escalaNum }] }]}
      >
        {restante}
      </Animated.Text>
      <Text variant="titleMedium" style={{ color: reto.onContainer }}>
        restantes
      </Text>

      <View style={styles.barraWrap}>
        <ProgressBar progress={progreso} color={reto.color} style={styles.barra} />
        <Text variant="labelLarge" style={{ color: reto.onContainer, marginTop: 6 }}>
          {conteo} / {meta}
        </Text>
      </View>

      <Text variant="titleLarge" style={[styles.animo, { color: reto.color }]}>
        {aviso || animo || ' '}
      </Text>

      {tipo_reto === 'lagartijas' ? (
        <Animated.View style={{ transform: [{ scale: latido }] }}>
          <Pressable
            onPress={sumarUno}
            style={({ pressed }) => [
              styles.boton,
              { backgroundColor: reto.color, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Icon source="gesture-tap-button" size={40} color="#fff" />
            <Text variant="titleMedium" style={styles.botonTexto}>
              Toca con la nariz
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Text variant="bodyLarge" style={[styles.hint, { color: reto.onContainer }]}>
          {tipo_reto === 'pasos'
            ? 'Camina con el teléfono en la mano'
            : 'Salta con el teléfono en la mano'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  titulo: { marginTop: 8, fontFamily: FONTS.semibold },
  numero: { fontSize: 120, lineHeight: 138, fontFamily: FONTS.bold },
  barraWrap: { width: '80%', alignItems: 'center', marginTop: 16 },
  barra: { width: '100%', height: 10, borderRadius: 5 },
  animo: { marginTop: 20, height: 32, fontFamily: FONTS.semibold },
  hint: { textAlign: 'center', marginTop: 12 },
  boton: {
    marginTop: 12, width: 220, height: 220, borderRadius: 110,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    elevation: 6,
  },
  botonTexto: { color: '#fff', fontFamily: FONTS.semibold, textAlign: 'center' },
  exitoTitulo: { marginTop: 12, fontFamily: FONTS.bold },
  botonExito: { marginTop: 32, borderRadius: 24 },
});
