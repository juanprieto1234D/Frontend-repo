import { Tarea } from '../models/Tarea';

export interface RepositorioTarea {
  listarPorUsuario(usuarioId: string): Promise<Tarea[]>;
}
