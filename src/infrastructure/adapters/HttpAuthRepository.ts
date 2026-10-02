import { RepositorioAuth } from "../../domain/repositories/RepositorioAuth";
import { Usuario } from "../../domain/models/Usuario";
import { decodificarJwt } from "../utils/decodificarJwt";

const API_URL = "http://localhost:3000/api";

export class HttpAuthRepository implements RepositorioAuth {
  async registrar(nombre: string, email: string, contrasena: string): Promise<Usuario> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: email, contrasena, nombre }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al registrar usuario");
    }

    const usuario: Usuario = { id: data.id, nombre: data.nombre, email: data.correo };
    return usuario;
  }

  async iniciarSesion(email: string, contrasena: string): Promise<{ usuario: Usuario; token?: string }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: email, contrasena }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Credenciales inválidas");
    }

    // El backend solo devuelve { token }. El id real del usuario va dentro
    // del JWT como { userId } (confirmado en aplicacion/CasosDeUso/iniciarSesion.ts
    // del backend), así que lo extraemos decodificando el token.
    const payload = decodificarJwt(data.token);
    const usuario: Usuario = { id: payload.userId, email };

    return { usuario, token: data.token };
  }
}