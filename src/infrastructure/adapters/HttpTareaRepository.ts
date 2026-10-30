import { RepositorioTarea } from '../../domain/repositories/RepositorioTarea';
import { Tarea } from '../../domain/models/Tarea';
import { API_URL } from '../config/api';

/**
 * ADAPTADOR HTTP del puerto `RepositorioTarea`.
 * Contrato: GET /tareas/:usuarioId -> Tarea[]
 */
export class HttpTareaRepository implements RepositorioTarea {
  async listarPorUsuario(usuarioId: string): Promise<Tarea[]> {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${API_URL}/tareas/${encodeURIComponent(usuarioId)}`);
    } catch {
      throw new Error('No pudimos conectar con el servidor. Verifica que el backend esté corriendo.');
    }

    if (!respuesta.ok) {
      throw new Error(`No se pudieron cargar las tareas (${respuesta.status}).`);
    }

    const datos = await respuesta.json();
    if (!Array.isArray(datos)) return [];

    return datos.map((t: any) => this.normalizar(t));
  }

  /** El JSON trae las fechas como ISO string; el dominio trabaja con Date. */
  private normalizar(t: any): Tarea {
    const fechaCruda = t.fechaLimite ?? t.dueDate ?? null;
    const fechaLimite = fechaCruda ? new Date(fechaCruda) : null;

    return {
      id: String(t.id),
      titulo: t.titulo ?? t.title ?? 'Sin título',
      descripcion: t.descripcion ?? t.description ?? null,
      completada: Boolean(t.completada ?? t.completed ?? false),
      fechaLimite: fechaLimite && !Number.isNaN(fechaLimite.getTime()) ? fechaLimite : null,
      usuarioId: String(t.usuarioId ?? t.userId ?? ''),
      materiaId: t.materiaId ?? null,
    };
  }
}
