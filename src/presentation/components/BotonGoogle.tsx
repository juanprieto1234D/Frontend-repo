import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { GOOGLE_CLIENT_ID, GOOGLE_HABILITADO } from '../../infrastructure/config/google';

interface Props {
  /** Recibe el ID token de Google listo para enviarse al backend. */
  onCredential: (idToken: string) => void;
}

/**
 * Botón oficial de Google (Google Identity Services).
 *
 * GSI necesita un contenedor DOM real, así que se monta dentro de un View
 * (que en react-native-web es un <div>) y se carga su script una sola vez.
 * En móvil nativo no se muestra: allí haría falta otro flujo.
 */
export const BotonGoogle: React.FC<Props> = ({ onCredential }) => {
  const contenedor = useRef<any>(null);
  const alRecibir = useRef(onCredential);
  alRecibir.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_HABILITADO) return;

    const g = globalThis as any;
    let activo = true;

    const montar = () => {
      if (!activo || !g.google?.accounts?.id || !contenedor.current) return;

      g.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (respuesta: any) => {
          if (respuesta?.credential) {
            alRecibir.current(respuesta.credential);
          }
        },
      });

      contenedor.current.innerHTML = '';
      g.google.accounts.id.renderButton(contenedor.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'es',
        width: 300,
      });
    };

    if (g.google?.accounts?.id) {
      montar();
      return;
    }

    const previo = g.document?.getElementById('google-gsi');
    if (previo) {
      previo.addEventListener('load', montar);
      return () => previo.removeEventListener('load', montar);
    }

    const script = g.document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = 'google-gsi';
    script.addEventListener('load', montar);
    g.document.head.appendChild(script);

    return () => {
      activo = false;
    };
  }, []);

  if (!GOOGLE_HABILITADO) return null;

  return <View ref={contenedor} style={estilos.caja} />;
};

const estilos = StyleSheet.create({
  caja: {
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
