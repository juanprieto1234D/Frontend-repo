import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEstilos } from '../theme/tema';

export type VistaTab = 'tareas' | 'materias' | 'calendario';

interface Props {
  activa: VistaTab;
  onCambiar: (vista: VistaTab) => void;
}

type NombreIcono = React.ComponentProps<typeof Ionicons>['name'];

const ITEMS: {
  clave: VistaTab;
  etiqueta: string;
  icono: NombreIcono;
  iconoActivo: NombreIcono;
}[] = [
  { clave: 'tareas', etiqueta: 'Inicio', icono: 'home-outline', iconoActivo: 'home' },
  { clave: 'calendario', etiqueta: 'Calendario', icono: 'calendar-outline', iconoActivo: 'calendar' },
  { clave: 'materias', etiqueta: 'Materias', icono: 'book-outline', iconoActivo: 'book' },
];

/**
 * Barra de navegación inferior (solo móvil/tablet).
 * En escritorio se oculta: allí se navega con los botones del encabezado.
 */
export const TabBar: React.FC<Props> = ({ activa, onCambiar }) => {
  const { width } = useWindowDimensions();
  const estilos = useEstilos(styles);
  if (width >= 900) return null;

  return (
    <View style={estilos.barra}>
      {ITEMS.map((item) => {
        const activo = item.clave === activa;
        return (
          <TouchableOpacity
            key={item.clave}
            style={estilos.item}
            onPress={() => onCambiar(item.clave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={item.etiqueta}
          >
            <Ionicons
              name={activo ? item.iconoActivo : item.icono}
              size={22}
              color={activo ? '#4C49ED' : '#94A3B8'}
            />
            <Text style={[estilos.etiqueta, activo && estilos.etiquetaActiva]}>{item.etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
  etiqueta: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  etiquetaActiva: { color: '#4C49ED' },
});
