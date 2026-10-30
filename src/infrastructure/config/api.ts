import { Platform } from 'react-native';

/**
 * ÚNICO lugar donde vive la URL del backend.
 *
 * CONTRATO REAL (rama `desarrollo`, commit del panel admin):
 *   POST /auth/registro        POST /auth/login
 *   GET  /tareas/:usuarioId    POST /tareas   PATCH /tareas/:id/completar   DELETE /tareas/:id
 *   GET  /admin/estadisticas   GET /admin/usuarios?buscar=
 *   GET  /admin/usuarios/:id   PATCH /admin/usuarios/:id/estado   { activo }
 *   DELETE /admin/usuarios/:id GET /admin/usuarios/:id/tareas     DELETE /admin/tareas/:id
 *
 * ⚠️ NO lleva prefijo `/api`: `main.ts` monta `app.use("/admin", ...)`,
 * `app.use("/auth", ...)` y `app.use("/tareas", ...)`.
 *
 * - Web / iOS simulator: http://localhost:3000
 * - Emulador Android:    http://10.0.2.2:3000  (el localhost del emulador es el móvil)
 * - Celular físico:      http://IP_DE_TU_PC:3000
 */
const HOST_MANUAL: string | null = null; // ej: 'http://192.168.1.25:3000'

const HOST_POR_PLATAFORMA =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const HOST_API = HOST_MANUAL ?? HOST_POR_PLATAFORMA;

/** Base de la API, sin `/api`. */
export const API_URL = HOST_API;

/** El panel cuelga directamente de `/admin`. */
export const ADMIN_URL = `${HOST_API}/admin`;
