import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';

// POST /api/guias/desarchivar - Desarchiva guías devolviéndolas a la lista activa
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.rol === 'Chofer') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Acceso restringido: Solo el personal de Logística puede desarchivar guías.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const { ids, id_guia } = body;

    let targetIds: string[] = [];
    if (Array.isArray(ids) && ids.length > 0) {
      targetIds = ids.map(id => id.toString().trim().toUpperCase()).filter(Boolean);
    } else if (id_guia) {
      targetIds = [id_guia.toString().trim().toUpperCase()];
    }

    if (targetIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Debes especificar al menos un ID de guía para desarchivar.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateRes = await query(`
      UPDATE guias
      SET 
        archivada = false,
        ruta_archivada_id = NULL
      WHERE id_guia = ANY($1::text[])
      RETURNING id_guia
    `, [targetIds]);

    return new Response(JSON.stringify({
      success: true,
      message: `${updateRes.rowCount} guía(s) restaurada(s) a la lista activa exitosamente.`,
      data: {
        restauradas_count: updateRes.rowCount,
        ids: targetIds
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/guias/desarchivar Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al desarchivar guías',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
