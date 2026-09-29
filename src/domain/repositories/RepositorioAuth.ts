import { Usuario } from '../models/Usuario';

export interface RepositorioAuth {
  iniciarSesion(email: string, contrasena: string): Promise<{ usuario: Usuario; token?: string }>;
}