import type { AstroCookies } from 'astro';

export interface UserSession {
  id: number;
  nombre: string;
  rol: string;
  email: string | null;
  telefono: string | null;
}

const COOKIE_NAME = 'user_session';

export function getUserFromCookies(cookies: AstroCookies): UserSession | null {
  try {
    const sessionCookie = cookies.get(COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) return null;

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(decoded) as UserSession;
  } catch (error) {
    return null;
  }
}

export function setUserSessionCookie(cookies: AstroCookies, user: UserSession): void {
  const encoded = Buffer.from(JSON.stringify(user)).toString('base64');
  cookies.set(COOKIE_NAME, encoded, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // Permitir localhost / http en desarrollo
    maxAge: 60 * 60 * 24 * 7 // 7 días
  });
}

export function clearUserSessionCookie(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, {
    path: '/'
  });
}
