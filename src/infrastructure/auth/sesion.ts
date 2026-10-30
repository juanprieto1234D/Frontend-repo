/**
 * Sesión en memoria: guarda el JWT que devuelve el login para que los
 * repositorios HTTP lo adjunten en cada petición.
 *
 * No usa AsyncStorage a propósito: esa librería NO está instalada y no hace
 * falta añadirla. Consecuencia: al recargar la página en web (F5) hay que
 * volver a iniciar sesión.
 */
let tokenActual: string | null = null;

export function guardarToken(token: string): void {
  tokenActual = token;
}

export function obtenerToken(): string | null {
  return tokenActual;
}

export function haySesionActiva(): boolean {
  return tokenActual !== null;
}

export function cerrarSesion(): void {
  tokenActual = null;
}
