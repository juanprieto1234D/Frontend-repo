import { RepositorioTarea } from '../../domain/repositories/RepositorioTarea';

export class ObtenerTareasUseCase {
  constructor(private repositorio: RepositorioTarea) {}

  async ejecutar() {
    return this.repositorio.obtenerTareas();
  }
}