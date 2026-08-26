import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import { ensureRutasArchivadasSchema } from '../../../lib/rutas_db';

export const GET: APIRoute = async ({ request, cookies, url }) => {
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

    const searchParams = url.searchParams;
    const fechaDesde = searchParams.get('fecha_desde'); // 'YYYY-MM-DD'
    const fechaHasta = searchParams.get('fecha_hasta'); // 'YYYY-MM-DD'
    const choferIdParam = searchParams.get('chofer_id');
    const searchTerm = searchParams.get('q')?.trim() || '';

    const conditions: string[] = [];
    const values: any[] = [];

    // Si es chofer, solo sus rutas
    if (user.rol === 'Chofer') {
      values.push(user.id);
      conditions.push(`r.chofer_id = $${values.length}`);
    } else if (choferIdParam && choferIdParam !== 'ALL') {
      const cId = parseInt(choferIdParam, 10);
      if (!isNaN(cId)) {
        values.push(cId);
        conditions.push(`r.chofer_id = $${values.length}`);
      }
    }

    // Filtros de fecha
    if (fechaDesde) {
      values.push(`${fechaDesde} 00:00:00`);
      conditions.push(`r.fecha_finalizacion >= $${values.length}`);
    }

    if (fechaHasta) {
      values.push(`${fechaHasta} 23:59:59`);
      conditions.push(`r.fecha_finalizacion <= $${values.length}`);
    }

    // Búsqueda de texto (código de ruta, nombre chofer, origen, destino, o dentro del snapshot)
    if (searchTerm) {
      values.push(`%${searchTerm}%`);
      const valIdx = values.length;
      conditions.push(`(
        r.codigo_ruta ILIKE $${valIdx} OR
        r.chofer_nombre ILIKE $${valIdx} OR
        r.ruta_origen ILIKE $${valIdx} OR
        r.ruta_destino ILIKE $${valIdx} OR
        r.guias_snapshot::text ILIKE $${valIdx}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        r.id,
        r.codigo_ruta,
        r.chofer_id,
        r.chofer_nombre,
        r.ruta_origen,
        r.ruta_destino,
        r.total_guias,
        r.total_piezas,
        r.total_entregadas,
        r.total_no_entregadas,
        r.total_pendientes,
        r.porcentaje_efectividad,
        r.finalizada_por,
        r.fecha_finalizacion,
        r.guias_snapshot
      FROM rutas_archivadas r
      ${whereClause}
      ORDER BY r.fecha_finalizacion DESC
    `;

    const result = await query(sql, values);

    return new Response(JSON.stringify({
      success: true,
      count: result.rows.length,
      data: result.rows
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/rutas/historial GET Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al consultar el historial de rutas.',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
