export interface Tarea {
id: string;
titulo: string;
descripcion: string | null;
completada: boolean;
fechaLimite: Date | null;
usuarioId: string;
}