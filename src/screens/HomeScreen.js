import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card, Text, Switch, FAB, IconButton, useTheme, Icon, Avatar,
} from 'react-native-paper';

import { getAlarmas, toggleAlarma, eliminarAlarma } from '../db/database';
import { scheduleAlarm, cancelAlarm } from '../alarm/alarm';
import { FONTS } from '../theme';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const [alarmas, setAlarmas] = useState([]);

  const cargar = useCallback(async () => {
    setAlarmas(await getAlarmas());
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onToggle = async (item) => {
    const activa = !item.activa;
    await toggleAlarma(item.id, activa);
    if (activa) await scheduleAlarm({ ...item, activa: 1 });
    else await cancelAlarm(item.id);
    cargar();
  };

  const onBorrar = async (item) => {
    await cancelAlarm(item.id);
    await eliminarAlarma(item.id);
    cargar();
  };

  const renderItem = ({ item }) => {
    const activa = !!item.activa;
    const textoColor = activa ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant;
    return (
      <Card
        style={[
          styles.card,
          { backgroundColor: activa ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
        ]}
        onPress={() => navigation.navigate('AlarmForm', { id: item.id })}
      >
        <Card.Content>
          <View style={styles.row}>
            <View style={styles.left}>
              <Text variant="displayMedium" style={{ color: textoColor, fontFamily: FONTS.bold }}>
                {item.hora}
              </Text>
              <Text variant="labelLarge" style={{ color: textoColor, opacity: 0.7 }}>
                {item.dias ? item.dias : 'Una sola vez'}
              </Text>
            </View>
            <Switch value={activa} onValueChange={() => onToggle(item)} />
          </View>

          <View style={styles.retoRow}>
            <Avatar.Icon
              size={40}
              icon="help"
              style={{ backgroundColor: activa ? theme.colors.primary : theme.colors.outline }}
              color="#fff"
            />
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Reto
              </Text>
              <Text variant="titleMedium" style={{ color: textoColor }}>
                Sorpresa
              </Text>
            </View>
            <IconButton
              icon="delete-outline"
              size={22}
              iconColor={textoColor}
              onPress={() => onBorrar(item)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={alarmas}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          alarmas.length > 0 ? (
            <Text variant="titleLarge" style={styles.header}>
              Tus alarmas ({alarmas.length})
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon source="alarm-plus" size={72} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Empieza tu día activo
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Crea una alarma y complétala con un reto físico sorpresa para apagarla.
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        label="Nueva alarma"
        style={styles.fab}
        onPress={() => navigation.navigate('AlarmForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 12, marginTop: 4, fontFamily: FONTS.semibold },
  card: { marginBottom: 14, borderRadius: 28 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flex: 1 },
  retoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  fab: { position: 'absolute', right: 16, bottom: 24, borderRadius: 20 },
  empty: { alignItems: 'center', marginTop: 100, gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: FONTS.semibold },
});
