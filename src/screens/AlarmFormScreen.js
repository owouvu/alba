import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Text, Button, Chip, Card, useTheme,
} from 'react-native-paper';

import { crearAlarma, actualizarAlarma, getAlarma } from '../db/database';
import { scheduleAlarm, cancelAlarm } from '../alarm/alarm';
import { RETOS, retoAleatorio, FONTS } from '../theme';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function AlarmFormScreen({ navigation, route }) {
  const theme = useTheme();
  const editId = route.params?.id ?? null;

  const [hora, setHora] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [showPicker, setShowPicker] = useState(false);
  const [dias, setDias] = useState([]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const a = await getAlarma(editId);
      if (!a) return;
      const [h, m] = a.hora.split(':').map(Number);
      setHora(new Date(new Date().setHours(h, m, 0, 0)));
      setDias(a.dias ? a.dias.split(',') : []);
      navigation.setOptions({ title: 'Editar alarma' });
    })();
  }, [editId]);

  const toggleDia = (d) =>
    setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const guardar = async () => {
    const hh = String(hora.getHours()).padStart(2, '0');
    const mm = String(hora.getMinutes()).padStart(2, '0');
    const base = {
      hora: `${hh}:${mm}`,
      dias: DIAS.filter((d) => dias.includes(d)).join(','),
    };

    let id = editId;
    if (editId) {
      // Al editar conservamos el reto ya asignado.
      const prev = await getAlarma(editId);
      await actualizarAlarma(editId, {
        ...base, tipo_reto: prev.tipo_reto, meta: prev.meta,
      });
    } else {
      // Al crear, se sortea el reto y su meta por defecto.
      const reto = retoAleatorio();
      id = await crearAlarma({ ...base, tipo_reto: reto, meta: RETOS[reto].metaDefault });
    }

    const alarma = await getAlarma(id);
    if (alarma?.activa) await scheduleAlarm(alarma);
    else await cancelAlarm(id);

    navigation.goBack();
  };

  const horaTexto =
    String(hora.getHours()).padStart(2, '0') + ':' +
    String(hora.getMinutes()).padStart(2, '0');

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Hora en grande, tipo reloj */}
      <Card mode="contained" style={styles.horaCard}>
        <Card.Content style={styles.horaContent}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            SUENA A LAS
          </Text>
          <Button
            mode="text"
            onPress={() => setShowPicker(true)}
            labelStyle={styles.horaLabel}
            style={styles.horaBtn}
          >
            {horaTexto}
          </Button>
          <Button
            mode="contained-tonal"
            icon="clock-edit-outline"
            onPress={() => setShowPicker(true)}
          >
            Cambiar hora
          </Button>
        </Card.Content>
      </Card>

      {showPicker && (
        <DateTimePicker
          value={hora}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(e, sel) => {
            setShowPicker(false);
            if (sel) setHora(sel);
          }}
        />
      )}

      <Text variant="titleMedium" style={styles.seccion}>Repetir</Text>
      <View style={styles.dias}>
        {DIAS.map((d) => (
          <Chip
            key={d}
            selected={dias.includes(d)}
            showSelectedOverlay
            onPress={() => toggleDia(d)}
            style={styles.diaChip}
          >
            {d}
          </Chip>
        ))}
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
        Sin días seleccionados = suena una sola vez.
      </Text>

      <Button
        mode="contained"
        icon="check"
        onPress={guardar}
        style={styles.guardar}
        contentStyle={{ paddingVertical: 6 }}
      >
        {editId ? 'Guardar cambios' : 'Crear alarma'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  horaCard: { borderRadius: 28, marginBottom: 8 },
  horaContent: { alignItems: 'center', paddingVertical: 8 },
  horaBtn: { marginVertical: -4 },
  horaLabel: { fontSize: 60, lineHeight: 72, fontFamily: FONTS.bold },
  seccion: { marginTop: 24, marginBottom: 12, fontFamily: FONTS.semibold },
  dias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaChip: { minWidth: 46, justifyContent: 'center' },
  guardar: { marginTop: 40, borderRadius: 20 },
});
