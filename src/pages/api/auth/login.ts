import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { setUserSessionCookie, type UserSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const identifier = (body.email || body.usuario || '').trim();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Debes ingresar tu correo o usuario y tu contraseña'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar en PostgreSQL por email, alias/prefijo, teléfono o nombre
    const result = await query(`
      SELECT id, nombre, telefono, rol, email, password
      FROM usuarios
      WHERE LOWER(email) = LOWER($1) 
         OR telefono = $1 
         OR LOWER(nombre) = LOWER($1)
         OR LOWER(SPLIT_PART(email, '@', 1)) = LOWER($1)
      LIMIT 1
    `, [identifier]);

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Credenciales inválidas. Usuario no encontrado.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = result.rows[0];

    // Verificación de contraseña
    if (user.password !== password) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Credenciales inválidas. Contraseña incorrecta.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear sesión de usuario
    const sessionData: UserSession = {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      email: user.email,
      telefono: user.telefono
    };

    setUserSessionCookie(cookies, sessionData);

    return new Response(JSON.stringify({
      ok: true,
      message: 'Inicio de sesión exitoso',
      user: sessionData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/auth/login Error]:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: 'Error interno del servidor al procesar el inicio de sesión'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
