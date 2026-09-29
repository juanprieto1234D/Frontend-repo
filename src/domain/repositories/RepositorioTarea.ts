import { Tarea } from '../models/Tarea';

export interface RepositorioTarea {
  obtenerTareas(): Promise<Tarea[]>;
}