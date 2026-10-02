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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HttpAuthRepository } from '../../infrastructure/adapters/HttpAuthRepository';

interface Props {
  onLoginSuccess?: (user: any) => void;
  onNavigateToRegister?: () => void;
  navigation?: any;
}

const authRepo = new HttpAuthRepository();

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess, onNavigateToRegister, navigation }) => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

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
      Alert.alert('Error de inicio de sesión', error.message || 'No se pudo conectar con el servidor');
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
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>✓</Text>
            </View>
            
            <Text style={styles.tagline}>BIENVENIDO DE NUEVO</Text>
            <Text style={styles.title}>Inicia sesión</Text>
            <Text style={styles.subtitle}>
              Organiza tu día y convierte tus planes en logros.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@test.com"
                placeholderTextColor="#A0AEC0"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Contraseña</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>¿La olvidaste?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={contrasena}
                onChangeText={setContrasena}
              />
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={cargando}
            >
              <LinearGradient
                colors={['#5D5FEF', '#4C49ED']}
                style={styles.buttonGradient}
              >
                {cargando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Aún no tienes una cuenta? </Text>
              <TouchableOpacity onPress={handleGoToRegister}>
                <Text style={styles.linkText}>Regístrate</Text>
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
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 13, color: '#6B7280' },
  linkText: { fontSize: 13, fontWeight: '700', color: '#5D5FEF' },
});