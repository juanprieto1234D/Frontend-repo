import { Materia } from '../models/Materia';

/** PUERTO de salida para las materias del usuario. */
export interface RepositorioMateria {
  listar(usuarioId: string): Promise<Materia[]>;

  crear(usuarioId: string, nombre: string, color: string, icono: string): Promise<Materia>;

  actualizar(
    id: string,
    datos: { nombre?: string; color?: string; icono?: string }
  ): Promise<Materia>;

  eliminar(id: string): Promise<void>;
}
