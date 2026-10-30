import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { RegisterScreen } from './src/presentation/screens/RegisterScreen';
import { RecuperarScreen } from './src/presentation/screens/RecuperarScreen';
import { RestablecerScreen } from './src/presentation/screens/RestablecerScreen';
import HomeScreen from './src/presentation/screens/HomeScreen';
import { MateriasScreen } from './src/presentation/screens/MateriasScreen';
import { CalendarioScreen } from './src/presentation/screens/CalendarioScreen';
import { AdminDashboardScreen } from './src/presentation/screens/AdminDashboardScreen';
import { TabBar } from './src/presentation/components/TabBar';
import { Transicion } from './src/presentation/components/Transicion';
import { TemaProvider, useTema } from './src/presentation/theme/tema';

import { esAdministrador, Usuario } from './src/domain/models/Usuario';
import { cerrarSesion } from './src/infrastructure/auth/sesion';
import { leerResetToken, limpiarResetTokenDeUrl } from './src/infrastructure/utils/url';

type Vista = 'admin' | 'tareas' | 'materias' | 'calendario';
type Pantalla = 'login' | 'registro' | 'recuperar';

function ContenidoApp() {
  const { modo } = useTema();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pantallaActual, setPantallaActual] = useState<Pantalla>('login');
  const [tokenReset, setTokenReset] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>('tareas');

  // Si el enlace del correo trae ?resetToken=..., se abre la pantalla de reset.
  useEffect(() => {
    setTokenReset(leerResetToken());
  }, []);

  // Si la sesión se cierra desde cualquier pantalla, también borramos el token
  // en memoria para no quedar con una sesión "fantasma".
  useEffect(() => {
    if (!usuario) cerrarSesion();
  }, [usuario]);

  const handleLoginSuccess = (user: Usuario) => {
    console.log('Usuario recibido en Login:', user);
    setUsuario(user);
    // Si es admin arranca en el panel; si no, directo a sus tareas.
    setVista(esAdministrador(user) ? 'admin' : 'tareas');
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
    setUsuario(null);
    setVista('tareas');
    setPantallaActual('login');
  };

  if (usuario) {
    if (esAdministrador(usuario) && vista === 'admin') {
      return (
        <Transicion key="admin">
          <AdminDashboardScreen
            usuario={usuario}
            onVerMisTareas={() => setVista('tareas')}
            onCerrarSesion={handleCerrarSesion}
          />
        </Transicion>
      );
    }

    return (
      <View style={[styles.contenedor, modo === 'oscuro' && styles.contenedorOscuro]}>
        <Transicion key={`v-${vista}`}>
          {vista === 'materias' ? (
            <MateriasScreen usuario={usuario} onVolver={() => setVista('tareas')} />
          ) : vista === 'calendario' ? (
            <CalendarioScreen usuario={usuario} onVolver={() => setVista('tareas')} />
          ) : (
            <HomeScreen
              usuario={usuario}
              setUsuario={setUsuario}
              onCerrarSesion={handleCerrarSesion}
              onAbrirMaterias={() => setVista('materias')}
              onAbrirCalendario={() => setVista('calendario')}
              onAbrirPanelAdmin={esAdministrador(usuario) ? () => setVista('admin') : undefined}
            />
          )}
        </Transicion>

        <TabBar activa={vista === 'admin' ? 'tareas' : vista} onCambiar={setVista} />
      </View>
    );
  }

  if (tokenReset) {
    return (
      <Transicion key="reset">
        <RestablecerScreen
          token={tokenReset}
          onFinalizado={() => {
            limpiarResetTokenDeUrl();
            setTokenReset(null);
            setPantallaActual('login');
          }}
          onVolver={() => {
            limpiarResetTokenDeUrl();
            setTokenReset(null);
            setPantallaActual('recuperar');
          }}
        />
      </Transicion>
    );
  }

  if (pantallaActual === 'recuperar') {
    return (
      <Transicion key="recuperar">
        <RecuperarScreen onVolver={() => setPantallaActual('login')} />
      </Transicion>
    );
  }

  if (pantallaActual === 'registro') {
    return (
      <Transicion key="registro">
        <RegisterScreen
          onRegisterSuccess={() => setPantallaActual('login')}
          onNavigateToLogin={() => setPantallaActual('login')}
        />
      </Transicion>
    );
  }

  return (
    <Transicion key="login">
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setPantallaActual('registro')}
        onNavigateToRecuperar={() => setPantallaActual('recuperar')}
      />
    </Transicion>
  );
}

export default function App() {
  return (
    <TemaProvider>
      <ContenidoApp />
    </TemaProvider>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#FFFFFF' },
  contenedorOscuro: { backgroundColor: '#0F172A' },
});
