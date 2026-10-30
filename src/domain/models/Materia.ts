export interface Materia {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  creadaEn?: string;
  usuarioId: string;
}

/** Paleta para el selector de color al crear una materia. */
export const COLORES_MATERIA = [
  '#6366F1',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

/** Iconos disponibles para una materia (y por herencia, para sus tareas). */
export const ICONOS_MATERIA = [
  'book-outline',
  'calculator-outline',
  'laptop-outline',
  'flask-outline',
  'language-outline',
  'cash-outline',
  'color-palette-outline',
  'musical-notes-outline',
] as const;

export type IconoMateria = (typeof ICONOS_MATERIA)[number];

/** Cualquier valor desconocido del backend cae al icono por defecto. */
export function normalizarIcono(valor?: string | null): IconoMateria {
  const encontrado = ICONOS_MATERIA.find((icono) => icono === valor);
  return encontrado ?? 'book-outline';
}
