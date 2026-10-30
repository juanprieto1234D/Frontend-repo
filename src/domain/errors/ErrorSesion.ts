/**
 * Error de dominio para distinguir "la sesión ya no sirve" (401 / sin token)
 * de un error de negocio o de red. La presentación lo usa para volver al login
 * en lugar de mostrar un banner rojo.
 *
 * Se agrega la bandera `esSesionExpirada` además de `instanceof` porque al
 * compilar a ES5 (Babel) la herencia de Error se rompe con facilidad.
 */
export class ErrorSesion extends Error {
  readonly esSesionExpirada = true;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorSesion';
    Object.setPrototypeOf(this, ErrorSesion.prototype);
  }
}

export function esErrorSesion(error: unknown): boolean {
  return Boolean((error as { esSesionExpirada?: boolean } | null)?.esSesionExpirada);
}
