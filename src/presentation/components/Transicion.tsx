import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';

/**
 * Fundido de entrada para los cambios de pantalla.
 * Se usa con `key` distinta por vista: al cambiar la key, se remonta y anima.
 */
export const Transicion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const opacidad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacidad, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [opacidad]);

  return <Animated.View style={[estilos.caja, { opacity: opacidad }]}>{children}</Animated.View>;
};

const estilos = StyleSheet.create({
  caja: { flex: 1 },
});
