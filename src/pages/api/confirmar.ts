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

    // Actualizar en PostgreSQL marcando gps_confirmado = true
    const updateResult = await query(`
      UPDATE guias
      SET 
        gps_latitud = COALESCE($1, gps_latitud),
        gps_longitud = COALESCE($2, gps_longitud),
        gps_confirmado = true,
        direccion_referencia = COALESCE($3, direccion_referencia),
        hora_disponible = COALESCE($5, hora_disponible)
      WHERE id_guia = $4
      RETURNING *
    `, [latitud, longitud, direccion_referencia, id_guia, hora_disponible]);

    if (updateResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ success: false, message: `Guía #${id_guia} no encontrada en el sistema` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[LOGÍSTICA - Confirmación Recibida]:', {
      id_guia,
      latitud,
      longitud,
      referencias: direccion_referencia,
      hora_disponible,
      recibidoEn: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ubicación y dirección confirmadas exitosamente en el sistema.',
        data: updateResult.rows[0]
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
