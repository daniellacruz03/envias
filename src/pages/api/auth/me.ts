import type { APIRoute } from 'astro';
import { getUserFromCookies } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const user = getUserFromCookies(cookies);

  if (!user) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'No autenticado'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    user
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
