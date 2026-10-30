import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { RepositorioAuth } from '../../domain/repositories/RepositorioAuth';
import { HttpAuthRepository } from '../../infrastructure/adapters/HttpAuthRepository';
import { useEstilos } from '../theme/tema';

const authRepo: RepositorioAuth = new HttpAuthRepository();

interface Props {
  token: string;
  onFinalizado: () => void;
  onVolver: () => void;
}

export const RestablecerScreen: React.FC<Props> = ({ token, onFinalizado, onVolver }) => {
  const estilos = useEstilos(styles);

  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (contrasena !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      await authRepo.restablecerContrasena(token, contrasena);
      setListo(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LinearGradient colors={['#4C49ED', '#6B3CE9', '#2E1C73']} style={estilos.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.container}
      >
        <ScrollView contentContainerStyle={estilos.scrollContent}>
          <View style={estilos.card}>
            <View style={estilos.logoBadge}>
              <Ionicons
                name={listo ? 'checkmark-circle-outline' : 'key-outline'}
                size={22}
                color="#FFFFFF"
              />
            </View>

            <Text style={estilos.tagline}>NUEVA CONTRASEÑA</Text>
            <Text style={estilos.title}>
              {listo ? '¡Contraseña actualizada!' : 'Crea una contraseña nueva'}
            </Text>

            {listo ? (
              <>
                <Text style={estilos.subtitle}>
                  Ya puedes entrar a TaskUp con tu nueva contraseña.
                </Text>

                <TouchableOpacity style={estilos.button} onPress={onFinalizado}>
                  <LinearGradient colors={['#5D5FEF', '#4C49ED']} style={estilos.buttonGradient}>
                    <Text style={estilos.buttonText}>Ir a iniciar sesión</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={estilos.subtitle}>
                  Elige una contraseña de al menos 6 caracteres.
                </Text>

                {error && (
                  <View style={estilos.errorBanner}>
                    <Text style={estilos.errorTexto}>{error}</Text>
                  </View>
                )}

                <View style={estilos.inputContainer}>
                  <Text style={estilos.label}>Contraseña nueva</Text>
                  <TextInput
                    style={estilos.input}
                    placeholder="••••••"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry
                    value={contrasena}
                    onChangeText={setContrasena}
                  />
                </View>

                <View style={estilos.inputContainer}>
                  <Text style={estilos.label}>Repite la contraseña</Text>
                  <TextInput
                    style={estilos.input}
                    placeholder="••••••"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry
                    value={confirmar}
                    onChangeText={setConfirmar}
                  />
                </View>

                <TouchableOpacity style={estilos.button} onPress={guardar} disabled={enviando}>
                  <LinearGradient colors={['#5D5FEF', '#4C49ED']} style={estilos.buttonGradient}>
                    {enviando ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={estilos.buttonText}>Guardar contraseña</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={estilos.footer}>
                  <TouchableOpacity onPress={onVolver}>
                    <Text style={estilos.linkText}>Pedir otro enlace</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#5D5FEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5D5FEF',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1E1B4B', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  inputContainer: { width: '100%', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorBanner: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  errorTexto: { fontSize: 12, color: '#B91C1C', textAlign: 'center' },
  button: { width: '100%', height: 50, borderRadius: 14, overflow: 'hidden', marginTop: 6 },
  buttonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footer: { marginTop: 22 },
  linkText: { fontSize: 13, fontWeight: '700', color: '#5D5FEF' },
});
