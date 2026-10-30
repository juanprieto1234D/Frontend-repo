import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEstilos, useTema } from '../theme/tema';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  textoCancelar?: string;
  /** Pinta el botón de rojo para acciones destructivas. */
  peligro?: boolean;
  /** Aviso informativo: oculta "Cancelar" y deja un solo botón. */
  soloAceptar?: boolean;
}

interface Props {
  visible: boolean;
  datos: DatosConfirmacion | null;
  procesando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmación propio (Modal de React Native).
 *
 * ¿Por qué no `Alert.alert`? Porque en React Native Web (Expo web) `Alert`
 * ignora los botones y nunca ejecuta sus callbacks: los botones se ven pero
 * no hacen nada. Este componente funciona igual en web, Android e iOS.
 */
export const DialogoConfirmacion: React.FC<Props> = ({
  visible,
  datos,
  procesando = false,
  onConfirmar,
  onCancelar,
}) => {
  const estilos = useEstilos(styles);
  const { texto } = useTema();
  if (!datos) return null;

  const peligro = datos.peligro ?? false;
  const soloAceptar = datos.soloAceptar ?? false;
  const cancelar = datos.textoCancelar ?? 'Cancelar';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!procesando) onCancelar();
      }}
    >
      <View style={estilos.fondo}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!procesando) onCancelar();
          }}
        />

        <View style={estilos.tarjeta} accessibilityRole="alert">
          <View style={[estilos.icono, peligro ? estilos.iconoPeligro : estilos.iconoInfo]}>
            <Ionicons
              name={peligro ? 'warning-outline' : 'help-circle-outline'}
              size={22}
              color={texto(peligro ? '#DC2626' : '#4C49ED')}
            />
          </View>

          <Text style={estilos.titulo}>{datos.titulo}</Text>
          <Text style={estilos.mensaje}>{datos.mensaje}</Text>

          <View style={estilos.botones}>
            {!soloAceptar && (
              <TouchableOpacity
                style={[estilos.boton, estilos.botonCancelar]}
                onPress={onCancelar}
                disabled={procesando}
                accessibilityRole="button"
              >
                <Text style={estilos.botonCancelarTexto}>{cancelar}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[estilos.boton, peligro ? estilos.botonPeligro : estilos.botonAceptar]}
              onPress={onConfirmar}
              disabled={procesando}
              accessibilityRole="button"
            >
              {procesando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={estilos.botonAceptarTexto}>{datos.textoConfirmar}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconoPeligro: { backgroundColor: '#FEE2E2' },
  iconoInfo: { backgroundColor: '#E0E7FF' },
  titulo: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
    textAlign: 'center',
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  botones: { flexDirection: 'row', width: '100%', gap: 10 },
  boton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonCancelar: { backgroundColor: '#F3F4F6' },
  botonCancelarTexto: { fontSize: 14, fontWeight: '700', color: '#374151' },
  botonAceptar: { backgroundColor: '#4C49ED' },
  botonPeligro: { backgroundColor: '#DC2626' },
  botonAceptarTexto: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
