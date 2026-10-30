import { Platform } from 'react-native';

/**
 * ID público del cliente OAuth de Google. No es un secreto: viaja en el
 * frontend y el backend lo usa como `audience` al verificar el token.
 */
export const GOOGLE_CLIENT_ID =
  '901996950529-55ef4c9jpef9v34dcobu0gtgf78bnuuh.apps.googleusercontent.com';

/**
 * El botón de Google usa Google Identity Services, que inyecta un iframe en el
 * DOM: solo funciona en web. En móvil habría que usar expo-auth-session.
 */
export const GOOGLE_HABILITADO = Platform.OS === 'web' && GOOGLE_CLIENT_ID.length > 0;
