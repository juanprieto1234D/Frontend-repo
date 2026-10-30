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
import { BotonGoogle } from '../components/BotonGoogle';
import { GOOGLE_HABILITADO } from '../../infrastructure/config/google';
import { HttpAuthRepository } from '../../infrastructure/adapters/HttpAuthRepository';

interface Props {
  onLoginSuccess?: (user: any) => void;
  onNavigateToRegister?: () => void;
  onNavigateToRecuperar?: () => void;
  navigation?: any;
}

const authRepo = new HttpAuthRepository();

export const LoginScreen: React.FC<Props> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToRecuperar,
  navigation,
}) => {
  const estilos = useEstilos(styles);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setError(null);
    setCargando(true);
    try {
      const respuesta = await authRepo.iniciarSesion(correo, contrasena);
      setCargando(false);

      console.log('Respuesta del Login backend:', respuesta);

      if (onLoginSuccess) {
        const usuarioObtenido = respuesta.usuario;

        if (!usuarioObtenido.id) {
          // Si esto llega a pasar, es porque el JWT no trae "userId" o no se
          // pudo decodificar — mejor avisar con un error claro que disfrazar
          // el id con el correo, porque eso rompe el listado/creación de tareas.
          throw new Error('No se pudo obtener el ID de usuario desde el servidor');
        }

        onLoginSuccess(usuarioObtenido);
      }
    } catch (error: any) {
      setCargando(false);
      setError(error.message || 'No se pudo conectar con el servidor');
    }
  };

  const handleGoogle = async (idToken: string) => {
    setError(null);
    setCargando(true);
    try {
      const respuesta = await authRepo.iniciarSesionConGoogle(idToken);
      if (onLoginSuccess) onLoginSuccess(respuesta.usuario);
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setCargando(false);
    }
  };
  const handleGoToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (navigation) {
      navigation.navigate('Register');
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
            
            <Text style={estilos.tagline}>BIENVENIDO DE NUEVO</Text>
            <Text style={estilos.title}>Inicia sesión</Text>
            {error && (
              <View style={estilos.errorBanner}>
                <Text style={estilos.errorTexto}>{error}</Text>
              </View>
            )}            <Text style={estilos.subtitle}>
              Organiza tu día y convierte tus planes en logros.
            </Text>

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
              <View style={estilos.labelRow}>
                <Text style={estilos.label}>Contraseña</Text>
                <TouchableOpacity onPress={onNavigateToRecuperar}>
                  <Text style={estilos.forgotPassword}>¿La olvidaste?</Text>
                </TouchableOpacity>
              </View>
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
              onPress={handleLogin}
              disabled={cargando}
            >
              <LinearGradient
                colors={['#5D5FEF', '#4C49ED']}
                style={estilos.buttonGradient}
              >
                {cargando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={estilos.buttonText}>Iniciar Sesión</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {GOOGLE_HABILITADO && (
              <>
                <View style={estilos.divisor}>
                  <View style={estilos.divisorLinea} />
                  <Text style={estilos.divisorTexto}>o</Text>
                  <View style={estilos.divisorLinea} />
                </View>
                <BotonGoogle onCredential={handleGoogle} />
              </>
            )}
            <View style={estilos.footer}>
              <Text style={estilos.footerText}>¿Aún no tienes una cuenta? </Text>
              <TouchableOpacity onPress={handleGoToRegister}>
                <Text style={estilos.linkText}>Regístrate</Text>
              </TouchableOpacity>
            </View>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  forgotPassword: { fontSize: 12, color: '#5D5FEF', fontWeight: '600' },
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
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
    gap: 10,
  },
  divisorLinea: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  divisorTexto: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 13, color: '#6B7280' },
  linkText: { fontSize: 13, fontWeight: '700', color: '#5D5FEF' },
});