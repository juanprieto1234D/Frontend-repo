import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { colorFondo, colorTexto, ModoTema, transformarEstilos } from './paleta';

export type { ModoTema } from './paleta';

/**
 * Tema claro/oscuro por ADAPTACIÓN DE PALETA.
 *
 * Los estilos se escriben una sola vez con la paleta clara y, en modo oscuro,
 * se transforman recorriendo sus propiedades (ver `paleta.ts`). Evita duplicar
 * cada StyleSheet y mantiene una sola fuente de verdad para los colores.
 */

interface ValorTema {
  modo: ModoTema;
  alternar: () => void;
  /** Para colores dinámicos usados fuera de un StyleSheet (fondo). */
  fondo: (hex: string) => string;
  /** Para colores dinámicos usados fuera de un StyleSheet (texto/icono). */
  texto: (hex: string) => string;
}

const TemaContexto = createContext<ValorTema | null>(null);

export const TemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modo, setModo] = useState<ModoTema>('claro');

  const alternar = useCallback(() => {
    setModo((actual) => (actual === 'claro' ? 'oscuro' : 'claro'));
  }, []);

  const valor = useMemo<ValorTema>(
    () => ({
      modo,
      alternar,
      fondo: (hex: string) => colorFondo(hex, modo),
      texto: (hex: string) => colorTexto(hex, modo),
    }),
    [modo, alternar],
  );

  return <TemaContexto.Provider value={valor}>{children}</TemaContexto.Provider>;
};

const VALOR_POR_DEFECTO: ValorTema = {
  modo: 'claro',
  alternar: () => {},
  fondo: (hex) => hex,
  texto: (hex) => hex,
};

export function useTema(): ValorTema {
  return useContext(TemaContexto) ?? VALOR_POR_DEFECTO;
}

/** Devuelve los estilos ya adaptados al modo actual. */
export function useEstilos<T extends Record<string, any>>(estilos: T): T {
  const { modo } = useTema();
  return modo === 'oscuro' ? transformarEstilos(estilos) : estilos;
}
