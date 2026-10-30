export type RolUsuario = 'USUARIO' | 'ADMIN';

export interface Usuario {
  id: string;
  nombre?: string;
  email: string;
  /** Opcional: solo se rellena cuando el login informa el rol. */
  rol?: RolUsuario;
}

/**
 * Normaliza el rol que llega del backend ("ADMIN", "admin", "ADMINISTRADOR"...).
 */
export function normalizarRol(valor: unknown): RolUsuario | undefined {
  if (typeof valor !== 'string') return undefined;

  switch (valor.trim().toUpperCase()) {
    case 'ADMIN':
    case 'ADMINISTRADOR':
    case 'ADMINISTRATOR':
      return 'ADMIN';
    case 'USUARIO':
    case 'USER':
    case 'ESTUDIANTE':
    case 'STUDENT':
      return 'USUARIO';
    default:
      return undefined;
  }
}

export function esAdministrador(usuario: Pick<Usuario, 'rol'> | null | undefined): boolean {
  return usuario?.rol === 'ADMIN';
}
