export type ModoTema = 'claro' | 'oscuro';

/**
 * Paleta oscura: mapas de equivalencia desde los colores claros.
 *
 * La transformación distingue el ROL de la propiedad, que es lo que evita los
 * choques típicos: `#FFFFFF` como fondo (tarjeta) pasa a gris oscuro, pero como
 * `color` (texto sobre un botón) se queda blanco.
 */

const TEXTO: Record<string, string> = {
  '#0F172A': '#F1F5F9',
  '#1E293B': '#E2E8F0',
  '#1E1B4B': '#E0E7FF',
  '#1F2937': '#E2E8F0',
  '#334155': '#E2E8F0',
  '#374151': '#E5E7EB',
  '#475569': '#C6D1DF',
  '#4B5563': '#C6D1DF',
  '#64748B': '#B4C1D3',
  '#6B7280': '#A9B6C9',
  '#9CA3AF': '#A9B6C9',
  '#A0AEC0': '#A9B6C9',
  '#94A3B8': '#A9B6C9',
  '#CBD5E1': '#6B7A90',
  '#D1D5DB': '#6B7A90',
  '#6366F1': '#818CF8',
  '#4C49ED': '#818CF8',
  '#4F46E5': '#A5B4FC',
  '#5D5FEF': '#818CF8',
  '#4338CA': '#A5B4FC',
  '#7C3AED': '#A78BFA',
  '#8B5CF6': '#A78BFA',
  '#0EA5E9': '#38BDF8',
  '#DC2626': '#F87171',
  '#B91C1C': '#FCA5A5',
  '#EF4444': '#F87171',
  '#047857': '#34D399',
  '#16A34A': '#4ADE80',
  '#10B981': '#34D399',
  '#B45309': '#FBBF24',
  '#D97706': '#FBBF24',
  '#F59E0B': '#FBBF24',
};

const FONDO: Record<string, string> = {
  '#FFFFFF': '#1E293B',
  '#F8FAFC': '#0F172A',
  '#F5F6FA': '#0F172A',
  '#F3F4F6': '#2C3849',
  '#F1F5F9': '#2C3849',
  '#E5E7EB': '#334155',
  '#E2E8F0': '#334155',
  // Tintes: en oscuro se usan versiones muy apagadas para no competir con el
  // contenido. Los colores de los badges sí pueden ser más intensos.
  '#EEF2FF': '#1C2236',
  '#E0E7FF': '#232A45',
  '#F5F3FF': '#201830',
  '#FEF2F2': '#2A1616',
  '#FEE2E2': '#7F1D1D',
  '#FEF3C7': '#78350F',
  '#DCFCE7': '#064E3B',
  '#D1FAE5': '#064E3B',
  '#1E1B4B': '#312E81',
  '#0F172A': '#4C49ED',
};

const BORDE: Record<string, string> = {
  '#F1F5F9': '#334155',
  '#E2E8F0': '#334155',
  '#E5E7EB': '#334155',
  '#FFFFFF': '#334155',
  '#E0E7FF': '#3730A3',
  '#6366F1': '#818CF8',
  '#0F172A': '#F1F5F9',
};

const PROPS_BORDE = new Set([
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'textDecorationColor',
]);

export function colorTexto(hex: string, modo: ModoTema): string {
  if (modo === 'claro') return hex;
  return TEXTO[hex.toUpperCase()] ?? hex;
}

export function colorFondo(hex: string, modo: ModoTema): string {
  if (modo === 'claro') return hex;
  return FONDO[hex.toUpperCase()] ?? hex;
}

function mapear(propiedad: string, valor: string): string {
  const hex = valor.toUpperCase();
  if (propiedad === 'color') return TEXTO[hex] ?? valor;
  if (propiedad === 'backgroundColor') return FONDO[hex] ?? valor;
  if (PROPS_BORDE.has(propiedad)) return BORDE[hex] ?? valor;
  return valor;
}

function transformarEstilo(estilo: any): any {
  if (Array.isArray(estilo)) return estilo.map(transformarEstilo);
  if (!estilo || typeof estilo !== 'object') return estilo;

  const salida: any = {};
  Object.keys(estilo).forEach((propiedad) => {
    const valor = estilo[propiedad];
    if (typeof valor === 'string' && valor.startsWith('#')) {
      salida[propiedad] = mapear(propiedad, valor);
    } else if (valor && typeof valor === 'object') {
      salida[propiedad] = transformarEstilo(valor);
    } else {
      salida[propiedad] = valor;
    }
  });
  return salida;
}

const cache = new WeakMap<object, any>();

/** Convierte un StyleSheet completo a su versión oscura (cacheado). */
export function transformarEstilos<T extends Record<string, any>>(estilos: T): T {
  const guardado = cache.get(estilos);
  if (guardado) return guardado as T;

  const salida: any = {};
  Object.keys(estilos).forEach((clave) => {
    salida[clave] = transformarEstilo(estilos[clave]);
  });

  cache.set(estilos, salida);
  return salida as T;
}
