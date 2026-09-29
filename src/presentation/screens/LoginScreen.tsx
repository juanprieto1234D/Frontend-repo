import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HttpAuthRepository } from '../../infrastructure/adapters/HttpAuthRepository';
import { IniciarSesionUseCase } from '../../application/use-cases/IniciarSesionUseCase';

const authRepo = new HttpAuthRepository();
const iniciarSesionUseCase = new IniciarSesionUseCase(authRepo);

interface LoginScreenProps {
  onLoginSuccess: (usuario: any) => void;
  onNavigateToRegister?: () => void;
}

export const LoginScreen = ({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await iniciarSesionUseCase.ejecutar(email, contrasena);
      onLoginSuccess(res.usuario);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header con el Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
            </View>
            <Text style={styles.logoText}>TaskUp</Text>
          </View>

          {/* Textos de Bienvenida */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.tagline}>BIENVENIDO DE NUEVO</Text>
            <Text style={styles.title}>Inicia sesión</Text>
            <Text style={styles.subtitle}>
              Organiza tu día y convierte tus planes en logros.
            </Text>
          </View>

          {/* Campo Correo Electrónico */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="nombre@correo.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Campo Contraseña */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Contraseña</Text>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>¿La olvidaste?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#9CA3AF"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!mostrarContrasena}
              />
              <TouchableOpacity
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón Iniciar Sesión */}
          <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          {/* Footer Registrarse */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Aún no tienes una cuenta? </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.registerText}>Regístrate</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 38,
    height: 38,
    backgroundColor: '#5243FA',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#5243FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5243FA',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5243FA',
  },
  button: {
    backgroundColor: '#5243FA',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#5243FA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  registerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5243FA',
  },
});