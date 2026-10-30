import { AdminUsuario, TareaAdmin } from '../models/AdminUsuario';
import { Estadisticas } from '../models/Estadisticas';

/**
 * PUERTO de salida de administración.
 * La presentación depende de esta interfaz, nunca de `fetch` ni de la URL real.
 *
 * El token NO viaja como parámetro: lo guarda `infrastructure/auth/sesion.ts`
 * cuando el usuario inicia sesión, y el adaptador HTTP lo adjunta en cada
 * petición. Así la firma del puerto no se contamina con detalles de transporte.
 */
export interface RepositorioAdmin {
  obtenerEstadisticas(): Promise<Estadisticas>;

  listarUsuarios(busqueda?: string): Promise<AdminUsuario[]>;

  obtenerDetalleUsuario(id: string): Promise<AdminUsuario>;

  cambiarEstadoUsuario(id: string, activo: boolean): Promise<void>;

  eliminarUsuario(id: string): Promise<void>;

  listarTareasDeUsuario(id: string): Promise<TareaAdmin[]>;

  eliminarTareaAdmin(id: string): Promise<void>;
}
