import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No autenticado'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.rol !== 'Chofer') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Acceso denegado: este recurso es exclusivo para choferes'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const targetChoferId = user.id;

    const result = await query(`
      SELECT 
        g.id_guia,
        g.destinatario,
        g.telefono_principal,
        g.telefono_secundario,
        g.ciudad_destino,
        g.piezas,
        g.pies_cubicos,
        g.direccion_referencia,
        g.hora_disponible,
        g.comprobante_url,
        g.comprobante_base64,
        g.recibido_por,
        g.orden_ruta,
        g.ruta_origen,
        g.ruta_destino,
        g.estado,
        g.gps_latitud,
        g.gps_longitud,
        g.gps_confirmado,
        g.chofer_asignado_id,
        g.created_at,
        u.nombre AS chofer_nombre,
        u.telefono AS chofer_telefono
      FROM guias g
      LEFT JOIN usuarios u ON g.chofer_asignado_id = u.id
      WHERE g.chofer_asignado_id = $1
        AND (g.archivada = false OR g.archivada IS NULL)
      ORDER BY 
        CASE 
          WHEN g.estado = 'En ruta' THEN 1
          WHEN g.estado = 'Contactado' THEN 2
          WHEN g.estado = 'Por contactar' THEN 3
          WHEN g.estado = 'Entregado' THEN 4
          ELSE 5
        END,
        NULLIF(g.orden_ruta, 0) ASC NULLS LAST,
        g.created_at DESC
    `, [targetChoferId]);

    const guias = result.rows;
    const pendientes = guias.filter((g: any) => g.estado !== 'Entregado').length;
    const entregados = guias.filter((g: any) => g.estado === 'Entregado').length;

    return new Response(JSON.stringify({
      success: true,
      data: guias,
      stats: {
        total: guias.length,
        pendientes,
        entregados,
        porcentaje: guias.length > 0 ? Math.round((entregados / guias.length) * 100) : 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/chofer/guias GET Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al consultar las guías del chofer',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
