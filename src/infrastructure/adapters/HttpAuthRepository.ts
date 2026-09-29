import { RepositorioAuth } from '../../domain/repositories/RepositorioAuth';
import { Usuario } from '../../domain/models/Usuario';

export class HttpAuthRepository implements RepositorioAuth {
  async iniciarSesion(email: string, contrasena: string): Promise<{ usuario: Usuario; token?: string }> {
    const response = await fetch('http://localhost:3000/iniciar-sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contrasena }),
    });

    if (!response.ok) {
      throw new Error('Credenciales incorrectas');
    }

    return response.json();
  }
}