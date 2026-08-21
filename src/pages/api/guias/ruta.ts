import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Validar autenticación
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

    if (user.rol === 'Chofer') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Acceso denegado: solo personal de logística puede planificar rutas.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      chofer_id,
      ruta_origen = 'Sede Principal Barquisimeto',
      ruta_destino = 'Retorno a Sede Principal Barquisimeto',
      paradas, // Array de { id_guia: string, orden: number }
      despachar_en_ruta = false
    } = body;

    if (!chofer_id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Debes especificar el chofer_id.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!Array.isArray(paradas) || paradas.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Debes incluir al menos una parada en la ruta.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const choferIdParsed = parseInt(chofer_id, 10);

    // 2. Actualizar cada parada con su orden secuencial
    for (const parada of paradas) {
      const cleanId = (parada.id_guia || '').toString().trim().toUpperCase();
      const orden = parseInt(parada.orden, 10) || 1;

      if (despachar_en_ruta) {
        await query(`
          UPDATE guias
          SET 
            chofer_asignado_id = $1,
            orden_ruta = $2,
            ruta_origen = $3,
            ruta_destino = $4,
            estado = CASE WHEN estado = 'Entregado' THEN estado ELSE 'En ruta' END
          WHERE id_guia = $5
        `, [choferIdParsed, orden, ruta_origen.trim(), ruta_destino.trim(), cleanId]);
      } else {
        await query(`
          UPDATE guias
          SET 
            chofer_asignado_id = $1,
            orden_ruta = $2,
            ruta_origen = $3,
            ruta_destino = $4
          WHERE id_guia = $5
        `, [choferIdParsed, orden, ruta_origen.trim(), ruta_destino.trim(), cleanId]);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Ruta de ${paradas.length} paradas planificada y despachada con éxito.`,
      count: paradas.length,
      ruta_origen,
      ruta_destino
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/guias/ruta POST Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al planificar la ruta',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
