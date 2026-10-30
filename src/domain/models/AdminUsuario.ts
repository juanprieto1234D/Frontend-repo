import { RolUsuario } from './Usuario';

/**
 * Fila del listado GET /admin/usuarios.
 * Los nombres coinciden EXACTAMENTE con el JSON del backend:
 * { id, correo, nombre, rol, activo, creadoEn, cantidadTareas }.
 */
export interface AdminUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  creadoEn?: string;
  /** `cantidadTareas` en el backend; se normaliza al mapear. */
  totalTareas: number;
  tareasCompletadas?: number;
}

/**
 * Tarea vista desde el panel de moderación (GET /admin/usuarios/:id/tareas).
 * Backend: { id, titulo, descripcion, completada, fechaLimite, creadaEn, usuarioId }.
 */
export interface TareaAdmin {
  id: string;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  fechaLimite?: string;
  fechaCreacion?: string;
}
