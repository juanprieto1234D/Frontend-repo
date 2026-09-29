import { RepositorioAuth } from '../../domain/repositories/RepositorioAuth';

export class IniciarSesionUseCase {
  constructor(private repositorio: RepositorioAuth) {}

  async ejecutar(email: string, contrasena: string) {
    if (!email.trim() || !contrasena.trim()) {
      throw new Error('Todos los campos son obligatorios');
    }
    return this.repositorio.iniciarSesion(email, contrasena);
  }
}