import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

// GET: Consultar una guía por su ID
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID de guía requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
        g.estado,
        g.gps_latitud,
        g.gps_longitud,
        g.gps_confirmado,
        g.empresa,
        g.chofer_asignado_id,
        g.comprobante_url,
        g.recibido_por,
        g.created_at,
        g.lote_despacho,
        g.archivada,
        g.ruta_archivada_id,
        u.nombre AS chofer_nombre,
        u.telefono AS chofer_telefono
      FROM guias g
      LEFT JOIN usuarios u ON g.chofer_asignado_id = u.id
      WHERE g.id_guia = $1
    `, [id.toUpperCase()]);

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ success: false, message: `Guía #${id} no encontrada` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.rows[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/guias/[id] GET Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al consultar la guía',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Actualización dinámica de campos de la guía
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID de guía requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const allowedFields = [
      'estado',
      'chofer_asignado_id',
      'gps_latitud',
      'gps_longitud',
      'gps_confirmado',
      'empresa',
      'destinatario',
      'ciudad_destino',
      'piezas',
      'pies_cubicos',
      'direccion_referencia',
      'hora_disponible',
      'orden_ruta',
      'telefono_principal',
      'telefono_secundario',
      'comprobante_url',
      'comprobante_base64',
      'recibido_por',
      'lote_despacho',
      'created_at',
      'archivada',
      'ruta_archivada_id'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No se enviaron campos válidos para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    values.push(id.toUpperCase());
    const queryText = `
      UPDATE guias
      SET ${updates.join(', ')}
      WHERE id_guia = $${paramIndex}
      RETURNING *
    `;

    const result = await query(queryText, values);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ success: false, message: `Guía #${id} no encontrada` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Consulta con JOIN para devolver el chofer actualizado
    const fullGuia = await query(`
      SELECT 
        g.id_guia,
        g.destinatario,
        g.telefono_principal,
        g.telefono_secundario,
        g.ciudad_destino,
        g.piezas,
        g.pies_cubicos,
        g.direccion_referencia,
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
      WHERE g.id_guia = $1
    `, [id.toUpperCase()]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Guía actualizada con éxito',
      data: fullGuia.rows[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/guias/[id] PATCH Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al actualizar la guía',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT: Alternativa a PATCH
export const PUT = PATCH;

// DELETE: Eliminar una guía por ID
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID de guía requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await query('DELETE FROM guias WHERE id_guia = $1 RETURNING id_guia', [id.toUpperCase()]);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ success: false, message: `Guía #${id} no encontrada` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Guía #${id} eliminada con éxito`,
      data: { id_guia: id }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/guias/[id] DELETE Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al eliminar la guía',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
