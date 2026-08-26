import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import { ensureRutasArchivadasSchema } from '../../../lib/rutas_db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No autenticado.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureRutasArchivadasSchema();

    const body = await request.json();
    const { ruta_id, id_guia, estado } = body;

    if (!ruta_id || !id_guia || !estado) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Faltan parámetros requeridos: ruta_id, id_guia, estado.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validEstados = ['Por contactar', 'Contactado', 'En ruta', 'Entregado', 'No entregado'];
    if (!validEstados.includes(estado)) {
      return new Response(JSON.stringify({
        success: false,
        message: `Estado inválido: "${estado}". Estados permitidos: ${validEstados.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Actualizar estado en la tabla principal de guias
    await query(`UPDATE guias SET estado = $1 WHERE id_guia = $2`, [estado, id_guia]);

    // 2. Obtener la ruta archivada
    const routeRes = await query(`SELECT * FROM rutas_archivadas WHERE id = $1`, [ruta_id]);
    if (routeRes.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Ruta archivada no encontrada.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const route = routeRes.rows[0];
    let snapshot = Array.isArray(route.guias_snapshot) ? route.guias_snapshot : [];

    // 3. Modificar la guía específica dentro del snapshot
    snapshot = snapshot.map((g: any) => {
      if (String(g.id_guia) === String(id_guia)) {
        return { ...g, estado };
      }
      return g;
    });

    // 4. Recalcular métricas de la ruta
    const totalGuias = snapshot.length;
    const totalEntregadas = snapshot.filter((g: any) => g.estado === 'Entregado').length;
    const totalNoEntregadas = snapshot.filter((g: any) => g.estado === 'No entregado').length;
    const totalPendientes = snapshot.filter((g: any) => g.estado !== 'Entregado' && g.estado !== 'No entregado').length;
    const efectividad = totalGuias > 0 ? Math.round((totalEntregadas / totalGuias) * 100) : 0;

    // 5. Actualizar en rutas_archivadas
    const updateRes = await query(`
      UPDATE rutas_archivadas
      SET 
        guias_snapshot = $1::jsonb,
        total_entregadas = $2,
        total_no_entregadas = $3,
        total_pendientes = $4,
        porcentaje_efectividad = $5
      WHERE id = $6
      RETURNING *
    `, [JSON.stringify(snapshot), totalEntregadas, totalNoEntregadas, totalPendientes, efectividad, ruta_id]);

    return new Response(JSON.stringify({
      success: true,
      message: `Guía #${id_guia} actualizada a "${estado}" exitosamente.`,
      data: updateRes.rows[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/rutas/estado POST Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al actualizar el estado de la guía en el historial.',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
