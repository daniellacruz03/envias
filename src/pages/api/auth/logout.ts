import type { APIRoute } from 'astro';
import { clearUserSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  clearUserSessionCookie(cookies);
  return new Response(JSON.stringify({
    ok: true,
    message: 'Sesión cerrada con éxito'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  clearUserSessionCookie(cookies);
  return redirect('/login', 302);
};
