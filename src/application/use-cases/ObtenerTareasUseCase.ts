import { RepositorioTarea } from '../../domain/repositories/RepositorioTarea';

export class ObtenerTareasUseCase {
  constructor(private repositorio: RepositorioTarea) {}

  async ejecutar(usuarioId: string) {
    return this.repositorio.listarPorUsuario(usuarioId);
  }
}
