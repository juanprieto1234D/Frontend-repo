import { AdminUsuario, TareaAdmin } from '../../domain/models/AdminUsuario';
import { Estadisticas } from '../../domain/models/Estadisticas';
import { normalizarRol } from '../../domain/models/Usuario';

/**
 * Adaptadores de datos: convierten el JSON del backend en modelos de dominio.
 * Se toleran varios nombres de campo (rol/role, activo/active,
 * cantidadTareas/totalTareas...) para que un cambio menor del backend no
 * rompa la pantalla.
 */

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor.trim() : '');

const numero = (valor: unknown): number => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const booleano = (valor: unknown, porDefecto = false): boolean => {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const v = valor.trim().toLowerCase();
    if (['true', '1', 'activo', 'active', 'si', 'sí'].includes(v)) return true;
    if (['false', '0', 'inactivo', 'bloqueado', 'inactive'].includes(v)) return false;
  }
  return porDefecto;
};

export function extraerLista(datos: unknown, claves: string[]): any[] {
  if (Array.isArray(datos)) return datos;
  if (!datos || typeof datos !== 'object') return [];

  const objeto = datos as Record<string, unknown>;
  for (const clave of claves) {
    const valor = objeto[clave];
    if (Array.isArray(valor)) return valor;
  }
  return [];
}

export function normalizarEstadisticas(crudo: unknown): Estadisticas {
  const raiz = (crudo ?? {}) as Record<string, any>;
  const datos = raiz.estadisticas ?? raiz.stats ?? raiz;

  return {
    totalUsuarios: numero(datos.totalUsuarios ?? datos.usuarios ?? datos.totalUsers),
    totalTareas: numero(datos.totalTareas ?? datos.tareas ?? datos.totalTasks),
    completadas: numero(datos.completadas ?? datos.tareasCompletadas ?? datos.completed),
    pendientes: numero(datos.pendientes ?? datos.tareasPendientes ?? datos.pending),
    usuariosUltimos7Dias: numero(
      datos.usuariosUltimos7Dias ??
        datos.nuevosUsuarios ??
        datos.usuariosNuevos ??
        datos.usuariosNuevosUltimaSemana ??
        datos.newUsersLast7Days,
    ),
  };
}

export function normalizarUsuarioAdmin(crudo: any): AdminUsuario {
  const contador = crudo?._count ?? crudo?.count ?? crudo?.conteo ?? {};
  const tareasBrutas = crudo?.tareas;

  // Si el backend devuelve el arreglo de tareas en vez de un conteo, usamos su longitud.
  const totalTareas = Array.isArray(tareasBrutas)
    ? tareasBrutas.length
    : numero(
        crudo?.totalTareas ??
          crudo?.cantidadTareas ??
          tareasBrutas ??
          contador?.tareas ??
          contador?.Tareas ??
          contador?.Tarea ??
          contador?.tasks,
      );

  const completadasBrutas =
    crudo?.tareasCompletadas ?? crudo?.completadas ?? contador?.tareasCompletadas ?? contador?.completadas;

  return {
    id: texto(crudo?.id ?? crudo?.usuarioId ?? crudo?._id),
    nombre: texto(
      crudo?.nombre ?? crudo?.name ?? crudo?.nombreCompleto ?? crudo?.correo ?? crudo?.email,
    ),
    correo: texto(crudo?.correo ?? crudo?.email),
    rol: normalizarRol(crudo?.role ?? crudo?.rol) ?? 'USUARIO',
    activo: booleano(crudo?.active ?? crudo?.activo, true),
    totalTareas,
    tareasCompletadas:
      completadasBrutas === undefined || completadasBrutas === null
        ? undefined
        : numero(completadasBrutas),
    creadoEn: texto(crudo?.creadoEn ?? crudo?.createdAt ?? crudo?.fechaRegistro) || undefined,
  };
}

export function normalizarTareaAdmin(crudo: any): TareaAdmin {
  const estado = texto(crudo?.estado ?? crudo?.status).toUpperCase();

  return {
    id: texto(crudo?.id ?? crudo?._id),
    titulo: texto(crudo?.titulo ?? crudo?.title ?? crudo?.nombre) || 'Tarea sin título',
    descripcion: texto(crudo?.descripcion ?? crudo?.description ?? crudo?.detalle) || undefined,
    completada: booleano(
      crudo?.completada ??
        crudo?.completed ??
        crudo?.estaCompletada ??
        (estado === 'COMPLETADA' || estado === 'COMPLETED' || estado === 'DONE'),
      false,
    ),
    // El backend devuelve `fechaLimite` (dueDate) y `creadaEn` (createdAt).
    fechaLimite: texto(crudo?.fechaLimite ?? crudo?.dueDate) || undefined,
    fechaCreacion:
      texto(crudo?.creadaEn ?? crudo?.fechaCreacion ?? crudo?.createdAt ?? crudo?.fecha) || undefined,
  };
}
