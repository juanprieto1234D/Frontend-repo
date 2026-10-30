import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEstilos } from '../theme/tema';
import { HttpAuthRepository } from '../../infrastructure/adapters/HttpAuthRepository';
import { DialogoConfirmacion } from '../components/DialogoConfirmacion';

interface Props {
  onRegisterSuccess?: () => void;
  onNavigateToLogin?: () => void;
  navigation?: any;
}

const authRepo = new HttpAuthRepository();

export const RegisterScreen: React.FC<Props> = ({ onRegisterSuccess, onNavigateToLogin, navigation }) => {
  const estilos = useEstilos(styles);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !correo || !contrasena) {
      setError('Por favor llena todos los campos');
      return;
    }

    setError(null);
    setCargando(true);
    try {
      await authRepo.registrar(nombre, correo, contrasena);
      setCargando(false);
      setExito(true);
    } catch (error: any) {
      setCargando(false);
      setError(error.message || 'No se pudo completar el registro');
    }
  };

  const handleGoToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else if (navigation) {
      navigation.navigate('Login');
    }
  };

  return (
    <LinearGradient
      colors={['#4C49ED', '#6B3CE9', '#2E1C73']}
      style={estilos.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.container}
      >
        <ScrollView contentContainerStyle={estilos.scrollContent}>
          <View style={estilos.card}>
            <View style={estilos.logoBadge}>
              <Text style={estilos.logoIcon}>✓</Text>
            </View>

            <Text style={estilos.tagline}>EMPIEZA HOY</Text>
            <Text style={estilos.title}>Crea tu cuenta</Text>
            {error && (
              <View style={estilos.errorBanner}>
                <Text style={estilos.errorTexto}>{error}</Text>
              </View>
            )}            <Text style={estilos.subtitle}>
              Únete a TaskUp para gestionar tus tareas eficientemente.
            </Text>

            <View style={estilos.inputContainer}>
              <Text style={estilos.label}>Nombre completo</Text>
              <TextInput
                style={estilos.input}
                placeholder="Tu nombre"
                placeholderTextColor="#A0AEC0"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={estilos.inputContainer}>
              <Text style={estilos.label}>Correo electrónico</Text>
              <TextInput
                style={estilos.input}
                placeholder="admin@test.com"
                placeholderTextColor="#A0AEC0"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={estilos.inputContainer}>
              <Text style={estilos.label}>Contraseña</Text>
              <TextInput
                style={estilos.input}
                placeholder="••••••"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={contrasena}
                onChangeText={setContrasena}
              />
            </View>

            <TouchableOpacity 
              style={estilos.button} 
              onPress={handleRegister}
              disabled={cargando}
            >
              <LinearGradient
                colors={['#5D5FEF', '#4C49ED']}
                style={estilos.buttonGradient}
              >
                {cargando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={estilos.buttonText}>Registrarse</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={estilos.footer}>
              <Text style={estilos.footerText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={handleGoToLogin}>
                <Text style={estilos.linkText}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DialogoConfirmacion
        visible={exito}
        datos={{
          titulo: '¡Cuenta creada!',
          mensaje: 'Tu usuario se ha registrado con éxito. Ya puedes iniciar sesión.',
          textoConfirmar: 'OK',
          soloAceptar: true,
        }}
        onConfirmar={() => {
          setExito(false);
          if (onRegisterSuccess) onRegisterSuccess();
        }}
        onCancelar={() => setExito(false)}
      />    </LinearGradient>
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
  logoIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5D5FEF',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1E1B4B', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  errorBanner: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    marginTop: -8,
  },
  errorTexto: { fontSize: 12, color: '#B91C1C', textAlign: 'center' },
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
  button: { width: '100%', height: 50, borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  buttonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 13, color: '#6B7280' },
  linkText: { fontSize: 13, fontWeight: '700', color: '#5D5FEF' },
});