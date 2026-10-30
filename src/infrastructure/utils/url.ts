/**
 * Lee el token de recuperación de la URL en web (`?resetToken=...`).
 * En nativo haría falta un deep link (expo-linking); de momento devuelve null.
 */
export function leerResetToken(): string | null {
  const g = globalThis as any;
  const search: string | undefined = g?.location?.search;
  if (!search) return null;

  const partes = search.replace(/^\?/, '').split('&');
  const encontrado = partes.find((parte) => parte.startsWith('resetToken='));
  if (!encontrado) return null;

  const valor = encontrado.slice('resetToken='.length);
  return valor ? decodeURIComponent(valor) : null;
}

/** Quita el token de la barra de direcciones para que no quede visible. */
export function limpiarResetTokenDeUrl(): void {
  const g = globalThis as any;
  if (!g?.location || !g?.history?.replaceState) return;

  const search: string = g.location.search ?? '';
  const limpio = search
    .replace(/([?&])resetToken=[^&]*&?/, '$1')
    .replace(/[?&]$/, '');

  g.history.replaceState({}, '', `${g.location.pathname}${limpio}`);
}
