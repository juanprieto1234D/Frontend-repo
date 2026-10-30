import { Materia, normalizarIcono } from '../../domain/models/Materia';
import { RepositorioMateria } from '../../domain/repositories/RepositorioMateria';
import { API_URL } from '../config/api';

/**
 * ADAPTADOR HTTP del puerto `RepositorioMateria`.
 * Contrato: POST /materias, GET /materias/:usuarioId, PUT /materias/:id,
 * DELETE /materias/:id.
 */
export class HttpMateriaRepository implements RepositorioMateria {
  private async solicitar<T>(ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<T | null> {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${API_URL}${ruta}`, {
        method: opciones.metodo ?? 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      });
    } catch {
      throw new Error('No pudimos conectar con el servidor. Verifica que el backend esté corriendo.');
    }

    if (respuesta.status === 204) return null;

    const crudo = await respuesta.text();
    let datos: any = null;
    if (crudo) {
      try {
        datos = JSON.parse(crudo);
      } catch {
        datos = null;
      }
    }

    if (!respuesta.ok) {
      const mensaje =
        (datos && (typeof datos.error === 'string' ? datos.error : datos.message)) ||
        `El servidor respondió con un error (${respuesta.status}).`;
      throw new Error(mensaje);
    }

    return (datos ?? null) as T | null;
  }

  private normalizar(materia: any): Materia {
    return {
      id: materia.id,
      nombre: materia.nombre,
      color: materia.color,
      icono: normalizarIcono(materia.icono),
      creadaEn: materia.creadaEn,
      usuarioId: materia.usuarioId,
    };
  }

  async listar(usuarioId: string): Promise<Materia[]> {
    const datos = await this.solicitar<any[]>(`/materias/${encodeURIComponent(usuarioId)}`);
    if (!Array.isArray(datos)) return [];
    return datos.map((m) => this.normalizar(m));
  }

  async crear(usuarioId: string, nombre: string, color: string, icono: string): Promise<Materia> {
    const datos = await this.solicitar<any>('/materias', {
      metodo: 'POST',
      cuerpo: { usuarioId, nombre, color, icono },
    });
    if (!datos) throw new Error('El servidor no devolvió la materia creada');
    return this.normalizar(datos);
  }

  async actualizar(
    id: string,
    datos: { nombre?: string; color?: string; icono?: string },
  ): Promise<Materia> {
    const respuesta = await this.solicitar<any>(`/materias/${encodeURIComponent(id)}`, {
      metodo: 'PUT',
      cuerpo: datos,
    });
    if (!respuesta) throw new Error('El servidor no devolvió la materia actualizada');
    return this.normalizar(respuesta);
  }

  async eliminar(id: string): Promise<void> {
    await this.solicitar(`/materias/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
  }
}
