import type { APIRoute } from 'astro';
import { query } from '../../lib/db';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      status: 'online',
      service: 'Envías Delivery Confirmation API',
      version: '1.0.0'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const id_guia = (data.id_guia || data.guia || '').toString().trim().toUpperCase();
    const latitud = data.latitud !== undefined && data.latitud !== null ? Number(data.latitud) : (data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null);
    const longitud = data.longitud !== undefined && data.longitud !== null ? Number(data.longitud) : (data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null);
    const rawRef = data.direccion_referencia !== undefined ? data.direccion_referencia : data.referencias;
    const direccion_referencia = rawRef && typeof rawRef === 'string' ? rawRef.trim() : null;
    const hora_disponible = data.hora_disponible && typeof data.hora_disponible === 'string' ? data.hora_disponible.trim() : null;
    const recibido_por = data.recibido_por && typeof data.recibido_por === 'string' ? data.recibido_por.trim() : null;

    if (!id_guia) {
      return new Response(
        JSON.stringify({ success: false, message: 'Número de guía requerido (id_guia)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (latitud === null && longitud === null) {
      return new Response(
        JSON.stringify({ success: false, message: 'Debes proporcionar tu ubicación satelital GPS o pegar tus coordenadas' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Actualizar la guía principal en PostgreSQL marcando gps_confirmado = true
    const updateResult = await query(`
      UPDATE guias
      SET 
        gps_latitud = COALESCE($1, gps_latitud),
        gps_longitud = COALESCE($2, gps_longitud),
        gps_confirmado = true,
        direccion_referencia = COALESCE($3, direccion_referencia),
        hora_disponible = COALESCE($5, hora_disponible),
        recibido_por = COALESCE($6, recibido_por)
      WHERE id_guia = $4
      RETURNING *
    `, [latitud, longitud, direccion_referencia, id_guia, hora_disponible, recibido_por]);

    if (updateResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ success: false, message: `Guía #${id_guia} no encontrada en el sistema` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const guiaPrincipal = updateResult.rows[0];

    // 2. Propagar automáticamente la misma ubicación GPS a todas las demás guías pendientes del mismo cliente
    let guiasAsociadasActualizadas: string[] = [];
    if (guiaPrincipal.destinatario && guiaPrincipal.ciudad_destino) {
      try {
        const propResult = await query(`
          UPDATE guias
          SET 
            gps_latitud = COALESCE($1, gps_latitud),
            gps_longitud = COALESCE($2, gps_longitud),
            gps_confirmado = true,
            direccion_referencia = COALESCE($3, direccion_referencia),
            hora_disponible = COALESCE($4, hora_disponible),
            recibido_por = COALESCE($9, recibido_por)
          WHERE (
            (LOWER(TRIM(destinatario)) = LOWER(TRIM($5)) AND LOWER(TRIM(ciudad_destino)) = LOWER(TRIM($6)))
            OR (telefono_principal = $7 AND LENGTH($7) >= 7)
          )
          AND id_guia != $8
          AND estado != 'Entregado'
          RETURNING id_guia
        `, [
          latitud,
          longitud,
          direccion_referencia,
          hora_disponible,
          guiaPrincipal.destinatario,
          guiaPrincipal.ciudad_destino,
          guiaPrincipal.telefono_principal || '',
          id_guia,
          recibido_por
        ]);

        guiasAsociadasActualizadas = (propResult.rows || []).map((r: any) => r.id_guia);
      } catch (propErr) {
        console.warn('[Propagate GPS Warning]:', propErr);
      }
    }

    console.log('[LOGÍSTICA - Confirmación Recibida]:', {
      id_guia,
      destinatario: guiaPrincipal.destinatario,
      latitud,
      longitud,
      referencias: direccion_referencia,
      hora_disponible,
      recibido_por,
      guiasAsociadasActualizadas,
      recibidoEn: new Date().toISOString()
    });

    const msg = guiasAsociadasActualizadas.length > 0
      ? `Ubicación confirmada exitosamente para la guía #${id_guia} y ${guiasAsociadasActualizadas.length} guía(s) adicional(es) asociada(s): ${guiasAsociadasActualizadas.map(g => '#' + g).join(', ')}.`
      : 'Ubicación y dirección confirmadas exitosamente en el sistema.';

    return new Response(
      JSON.stringify({
        success: true,
        message: msg,
        data: guiaPrincipal,
        guias_asociadas: guiasAsociadasActualizadas
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[API /api/confirmar Error]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al procesar la solicitud',
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
