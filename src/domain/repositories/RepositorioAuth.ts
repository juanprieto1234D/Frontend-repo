import { Usuario } from '../models/Usuario';

export interface RepositorioAuth {
  iniciarSesion(email: string, contrasena: string): Promise<{ usuario: Usuario; token?: string }>;

  /** Login con Google: recibe el ID token y devuelve la sesión. */
  iniciarSesionConGoogle(idToken: string): Promise<{ usuario: Usuario; token?: string }>;

  /** Envía el enlace de recuperación (la respuesta es siempre genérica). */
  solicitarReset(correo: string): Promise<void>;

  /** Cambia la contraseña usando el token recibido por correo. */
  restablecerContrasena(token: string, contrasena: string): Promise<void>;
}
