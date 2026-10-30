import { AdminUsuario, TareaAdmin } from '../../domain/models/AdminUsuario';
import { Estadisticas } from '../../domain/models/Estadisticas';
import { ErrorSesion } from '../../domain/errors/ErrorSesion';
import { RepositorioAdmin } from '../../domain/repositories/RepositorioAdmin';
import { ADMIN_URL } from '../config/api';
import { cerrarSesion, obtenerToken } from '../auth/sesion';
import {
  extraerLista,
  normalizarEstadisticas,
  normalizarTareaAdmin,
  normalizarUsuarioAdmin,
} from '../mappers/adminMappers';

type MetodoHttp = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface OpcionesPeticion {
  metodo?: MetodoHttp;
  cuerpo?: unknown;
}

/**
 * ADAPTADOR de infraestructura: implementa el puerto `RepositorioAdmin`
 * hablando HTTP contra `/admin`.
 */
export class HttpAdminRepository implements RepositorioAdmin {
  // ---------------------------------------------------------------------
  // Núcleo HTTP: agrega el token, traduce errores y tolera respuestas 204.
  // ---------------------------------------------------------------------
  private async solicitar<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T | null> {
    const token = obtenerToken();
    if (!token) {
      throw new ErrorSesion('Tu sesión no está activa. Vuelve a iniciar sesión.');
    }

    let respuesta: Response;
    try {
      respuesta = await fetch(`${ADMIN_URL}${ruta}`, {
        method: opciones.metodo ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      });
    } catch {
      throw new Error(
        'No pudimos conectar con el servidor. Verifica que el backend esté corriendo.',
      );
    }

    // DELETE responde 204 sin cuerpo.
    if (respuesta.status === 204) return null;

    const crudo = await respuesta.text();
    let datos: any = null;
    if (crudo) {
      try {
        datos = JSON.parse(crudo);
      } catch {
        datos = null; // respuesta no JSON (HTML de error, etc.)
      }
    }

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        cerrarSesion();
        throw new ErrorSesion('Tu sesión expiró. Inicia sesión de nuevo.');
      }
      if (respuesta.status === 403) {
        throw new Error('Esta cuenta no tiene permisos de administrador.');
      }
      if (respuesta.status === 404) {
        throw new Error('El recurso solicitado ya no existe. Actualiza la lista.');
      }
      throw new Error(this.mensajeDeError(datos, respuesta.status));
    }

    return (datos ?? null) as T | null;
  }

  private mensajeDeError(datos: any, estado: number): string {
    if (!datos) return `El servidor respondió con un error (${estado}).`;
    if (typeof datos === 'string') return datos;
    if (typeof datos.error === 'string') return datos.error;
    if (typeof datos.mensaje === 'string') return datos.mensaje;
    if (typeof datos.message === 'string') return datos.message;
    if (datos.error && typeof datos.error.message === 'string') return datos.error.message;

    if (Array.isArray(datos.errors) && datos.errors.length > 0) {
      const primero = datos.errors[0];
      if (typeof primero === 'string') return primero;
      if (primero && typeof primero.message === 'string') return primero.message;
    }

    return `El servidor respondió con un error (${estado}).`;
  }

  // ---------------------------------------------------------------------
  // Puerto RepositorioAdmin
  // ---------------------------------------------------------------------
  async obtenerEstadisticas(): Promise<Estadisticas> {
    const datos = await this.solicitar<unknown>('/estadisticas');
    return normalizarEstadisticas(datos ?? {});
  }

  async listarUsuarios(busqueda?: string): Promise<AdminUsuario[]> {
    const termino = (busqueda ?? '').trim();
    const ruta = termino ? `/usuarios?buscar=${encodeURIComponent(termino)}` : '/usuarios';

    const datos = await this.solicitar<unknown>(ruta);
    return extraerLista(datos, ['usuarios', 'data', 'items', 'resultados']).map(
      normalizarUsuarioAdmin,
    );
  }

  async obtenerDetalleUsuario(id: string): Promise<AdminUsuario> {
    const datos = await this.solicitar<any>(`/usuarios/${encodeURIComponent(id)}`);
    const usuario = datos?.usuario ?? datos?.data ?? datos;
    return normalizarUsuarioAdmin(usuario ?? {});
  }

  async cambiarEstadoUsuario(id: string, activo: boolean): Promise<void> {
    await this.solicitar(`/usuarios/${encodeURIComponent(id)}/estado`, {
      metodo: 'PATCH',
      // Confirmado contra el backend: espera `{ activo }` (no "active").
      cuerpo: { activo },
    });
  }

  async eliminarUsuario(id: string): Promise<void> {
    await this.solicitar(`/usuarios/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
  }

  async listarTareasDeUsuario(id: string): Promise<TareaAdmin[]> {
    const datos = await this.solicitar<unknown>(`/usuarios/${encodeURIComponent(id)}/tareas`);
    return extraerLista(datos, ['tareas', 'data', 'items', 'resultados']).map(
      normalizarTareaAdmin,
    );
  }

  async eliminarTareaAdmin(id: string): Promise<void> {
    await this.solicitar(`/tareas/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
  }
}
