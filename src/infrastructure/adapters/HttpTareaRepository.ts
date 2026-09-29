import { RepositorioTarea } from '../../domain/repositories/RepositorioTarea';
import { Tarea } from '../../domain/models/Tarea';

export class HttpTareaRepository implements RepositorioTarea {
  async obtenerTareas(): Promise<Tarea[]> {
    const response = await fetch('http://localhost:3000/tareas');
    if (!response.ok) throw new Error('Error al conectar con la API');
    return response.json();
  }
}