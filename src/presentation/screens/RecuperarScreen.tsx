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
  onVolver: () => void;
  correoInicial?: string;
}

export const RecuperarScreen: React.FC<Props> = ({ onVolver, correoInicial = '' }) => {
  const estilos = useEstilos(styles);

  const [correo, setCorreo] = useState(correoInicial);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!correo.trim()) {
      setError('Escribe tu correo electrónico');
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      await authRepo.solicitarReset(correo.trim());
      setEnviado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud');
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
              <Ionicons name={enviado ? 'mail-open-outline' : 'lock-closed-outline'} size={22} color="#FFFFFF" />
            </View>

            <Text style={estilos.tagline}>RECUPERAR ACCESO</Text>
            <Text style={estilos.title}>
              {enviado ? 'Revisa tu correo' : '¿Olvidaste tu contraseña?'}
            </Text>

            {enviado ? (
              <>
                <Text style={estilos.subtitle}>
                  Si <Text style={estilos.negrita}>{correo.trim()}</Text> está registrado, te enviamos un
                  enlace para crear una contraseña nueva. Revisa también la carpeta de spam.
                </Text>
                <Text style={estilos.nota}>El enlace vence en 30 minutos y solo sirve una vez.</Text>

                <TouchableOpacity style={estilos.button} onPress={onVolver}>
                  <LinearGradient colors={['#5D5FEF', '#4C49ED']} style={estilos.buttonGradient}>
                    <Text style={estilos.buttonText}>Volver a iniciar sesión</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={estilos.subtitle}>
                  Escribe el correo con el que te registraste y te enviaremos un enlace.
                </Text>

                {error && (
                  <View style={estilos.errorBanner}>
                    <Text style={estilos.errorTexto}>{error}</Text>
                  </View>
                )}

                <View style={estilos.inputContainer}>
                  <Text style={estilos.label}>Correo electrónico</Text>
                  <TextInput
                    style={estilos.input}
                    placeholder="tucorreo@ejemplo.com"
                    placeholderTextColor="#A0AEC0"
                    value={correo}
                    onChangeText={setCorreo}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity style={estilos.button} onPress={enviar} disabled={enviando}>
                  <LinearGradient colors={['#5D5FEF', '#4C49ED']} style={estilos.buttonGradient}>
                    {enviando ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={estilos.buttonText}>Enviar enlace</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={estilos.footer}>
                  <TouchableOpacity onPress={onVolver}>
                    <Text style={estilos.linkText}>← Volver al inicio de sesión</Text>
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
  negrita: { fontWeight: '800', color: '#374151' },
  nota: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 18 },
  inputContainer: { width: '100%', marginBottom: 16 },
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
  button: { width: '100%', height: 50, borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  buttonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footer: { marginTop: 22 },
  linkText: { fontSize: 13, fontWeight: '700', color: '#5D5FEF' },
});
