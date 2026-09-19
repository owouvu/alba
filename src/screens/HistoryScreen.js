import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { List, Text, useTheme, Icon } from 'react-native-paper';

import { getHistorial } from '../db/database';
import { RETOS } from '../theme';

export default function HistoryScreen() {
  const theme = useTheme();
  const [items, setItems] = useState([]);

  useFocusEffect(useCallback(() => {
    (async () => setItems(await getHistorial()))();
  }, []));

  const render = ({ item }) => {
    const reto = RETOS[item.reto];
    return (
      <List.Item
        title={`${reto?.label ?? item.reto} · ${item.meta} ${reto?.unidad ?? ''}`}
        description={`${item.fecha}  ·  ${item.segundos}s`}
        left={(props) => <List.Icon {...props} icon={reto?.icon ?? 'run'} />}
        right={(props) => (
          <Icon
            source={item.completado ? 'check-circle' : 'close-circle'}
            size={22}
            color={item.completado ? theme.colors.primary : theme.colors.error}
          />
        )}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={render}
        ListEmptyComponent={
          <Text
            variant="bodyMedium"
            style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}
          >
            Todavía no hay registros. Completa un reto y aparecerá aquí.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 80 },
});
