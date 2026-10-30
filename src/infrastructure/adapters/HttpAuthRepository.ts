import { RepositorioAuth } from '../../domain/repositories/RepositorioAuth';
import { normalizarRol, Usuario } from '../../domain/models/Usuario';
import { decodificarJwt } from '../utils/decodificarJwt';
import { API_URL } from '../config/api';
import { guardarToken } from '../auth/sesion';

export class HttpAuthRepository implements RepositorioAuth {
  async registrar(nombre: string, email: string, contrasena: string): Promise<Usuario> {
    // El backend expone /auth/registro (en español), no /auth/register.
    const response = await fetch(`${API_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, contrasena, nombre }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al registrar usuario');
    }

    const usuario: Usuario = { id: data.id, nombre: data.nombre, email: data.correo };
    return usuario;
  }

  async iniciarSesion(
    email: string,
    contrasena: string,
  ): Promise<{ usuario: Usuario; token?: string }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, contrasena }),
    });

    const data = await response.json().catch(() => ({} as any));

    if (!response.ok) {
      throw new Error(data.error || 'Credenciales inválidas');
    }

    if (!data?.token) {
      throw new Error('El servidor no devolvió un token de sesión');
    }

    // El login devuelve { token, usuario: { id, correo, nombre, rol } } y el
    // JWT firma { userId, rol }. Usamos el body como fuente principal y el
    // token como respaldo.
    const usuarioRespuesta = data?.usuario ?? null;
    const payload: any = decodificarJwt(data.token);

    const id = usuarioRespuesta?.id ?? payload?.userId ?? payload?.id ?? payload?.sub;

    if (!id) {
      throw new Error('No se pudo obtener el ID de usuario desde el servidor');
    }

    // Guardamos el token para que los repositorios (admin, tareas) puedan
    // autenticar sus peticiones sin pasarlo por props.
    guardarToken(data.token);

    const rolBody = normalizarRol(usuarioRespuesta?.rol ?? usuarioRespuesta?.role);
    const rolToken = normalizarRol(payload?.rol ?? payload?.role);

    const usuario: Usuario = {
      id: String(id),
      email,
      nombre: usuarioRespuesta?.nombre ?? payload?.nombre ?? payload?.name ?? undefined,
      rol: rolBody ?? rolToken,
    };

    return { usuario, token: data.token };
  }

  async solicitarReset(correo: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/solicitar-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo }),
    });

    const data = await response.json().catch(() => ({} as any));
    if (!response.ok) {
      throw new Error(data.error || 'No se pudo enviar la solicitud');
    }
  }

  async restablecerContrasena(token: string, contrasena: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/restablecer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, contrasena }),
    });

    const data = await response.json().catch(() => ({} as any));
    if (!response.ok) {
      throw new Error(data.error || 'No se pudo cambiar la contraseña');
    }
  }

  async iniciarSesionConGoogle(
    idToken: string,
  ): Promise<{ usuario: Usuario; token?: string }> {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json().catch(() => ({} as any));

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo iniciar sesión con Google');
    }

    guardarToken(data.token);

    const usuario: Usuario = {
      id: String(data.usuario?.id ?? ''),
      email: data.usuario?.correo ?? '',
      nombre: data.usuario?.nombre,
      rol: normalizarRol(data.usuario?.rol),
    };

    return { usuario, token: data.token };
  }
}
