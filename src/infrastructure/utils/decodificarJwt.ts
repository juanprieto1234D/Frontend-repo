export function decodificarJwt(token: string): { userId: string; iat?: number; exp?: number } {
  const partes = token.split(".");
  if (partes.length !== 3) throw new Error("Token con formato inválido");

  const payloadBase64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(payloadBase64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(json);
}