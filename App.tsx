import React, { useState } from 'react';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { RegisterScreen } from './src/presentation/screens/RegisterScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';

export default function App() {
  const [usuario, setUsuario] = useState<any>(null);
  const [pantallaActual, setPantallaActual] = useState<'login' | 'registro'>('login');

  if (usuario) {
    return <HomeScreen />;
  }

  if (pantallaActual === 'registro') {
    return (
      <RegisterScreen
        onRegisterSuccess={() => setPantallaActual('login')}
        onNavigateToLogin={() => setPantallaActual('login')}
      />
    );
  }

  return (
    <LoginScreen
      onLoginSuccess={(user) => setUsuario(user)}
      onNavigateToRegister={() => setPantallaActual('registro')}
    />
  );
}