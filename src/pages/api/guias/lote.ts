import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      ciudad_destino,
      chofer_id,
      cambiar_estado,
      ids_guias
    } = body;

    const choferIdParsed = chofer_id !== undefined && chofer_id !== null && chofer_id !== '' 
      ? parseInt(chofer_id, 10) 
      : null;

    let updateQuery = '';
    let queryParams: any[] = [];

    // Si se enviaron IDs específicos
    if (Array.isArray(ids_guias) && ids_guias.length > 0) {
      const cleanIds = ids_guias.map((id: string) => id.toString().trim().toUpperCase());
      
      if (cambiar_estado) {
        updateQuery = `
          UPDATE guias
          SET 
            chofer_asignado_id = $1,
            estado = $2
          WHERE id_guia = ANY($3)
          RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
        `;
        queryParams = [choferIdParsed, cambiar_estado, cleanIds];
      } else {
        updateQuery = `
          UPDATE guias
          SET chofer_asignado_id = $1
          WHERE id_guia = ANY($2)
          RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
        `;
        queryParams = [choferIdParsed, cleanIds];
      }
    } 
    // Si se agrupa por ciudad
    else if (ciudad_destino && typeof ciudad_destino === 'string') {
      const cleanCiudad = ciudad_destino.trim();
      
      if (cambiar_estado) {
        updateQuery = `
          UPDATE guias
          SET 
            chofer_asignado_id = $1,
            estado = $2
          WHERE TRIM(LOWER(ciudad_destino)) = TRIM(LOWER($3))
          RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
        `;
        queryParams = [choferIdParsed, cambiar_estado, cleanCiudad];
      } else {
        updateQuery = `
          UPDATE guias
          SET chofer_asignado_id = $1
          WHERE TRIM(LOWER(ciudad_destino)) = TRIM(LOWER($2))
          RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
        `;
        queryParams = [choferIdParsed, cleanCiudad];
      }
    } 
    // Si se despachan todas las guías de un chofer
    else if (choferIdParsed !== null) {
      if (cambiar_estado) {
        updateQuery = `
          UPDATE guias
          SET estado = $1
          WHERE chofer_asignado_id = $2 AND estado != 'Entregado'
          RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
        `;
        queryParams = [cambiar_estado, choferIdParsed];
      } else {
        updateQuery = `
          UPDATE guias
          SET chofer_asignado_id = $1
          WHERE chofer_asignado_id = $1
          RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
        `;
        queryParams = [choferIdParsed];
      }
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Debes proporcionar una ciudad_destino, una lista de ids_guias o un chofer_id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await query(updateQuery, queryParams);

    // Obtener las guías actualizadas con datos del chofer
    const updatedIds = result.rows.map((r: any) => r.id_guia);
    
    let fullGuiasResult = { rows: [] };
    if (updatedIds.length > 0) {
      fullGuiasResult = await query(`
        SELECT 
          g.id_guia,
          g.destinatario,
          g.telefono_principal,
          g.telefono_secundario,
          g.ciudad_destino,
          g.piezas,
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
        WHERE g.id_guia = ANY($1)
        ORDER BY g.created_at DESC
      `, [updatedIds]);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Se actualizaron ${result.rowCount} guías exitosamente.`,
      count: result.rowCount,
      data: fullGuiasResult.rows
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/guias/lote POST Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al procesar asignación por lote',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
