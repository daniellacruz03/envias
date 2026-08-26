import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import { ensureRutasArchivadasSchema } from '../../../lib/rutas_db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Validar autenticación y permisos de Logística
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No autenticado. Inicia sesión.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.rol === 'Chofer') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Acceso restringido. Solo el personal de Logística Central puede finalizar y archivar rutas.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureRutasArchivadasSchema();

    const body = await request.json().catch(() => ({}));
    const targetChoferId = parseInt(body.chofer_id, 10);

    if (!targetChoferId || isNaN(targetChoferId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Debes especificar el chofer_id para finalizar la ruta.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Obtener datos del chofer
    const userRes = await query('SELECT id, nombre, telefono FROM usuarios WHERE id = $1', [targetChoferId]);
    if (userRes.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'El chofer especificado no existe.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const choferNombre = userRes.rows[0].nombre;

    // 3. Obtener guías activas no archivadas asignadas a este chofer
    const guiasRes = await query(`
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
        g.recibido_por,
        g.orden_ruta,
        g.ruta_origen,
        g.ruta_destino,
        g.estado,
        g.gps_latitud,
        g.gps_longitud,
        g.gps_confirmado,
        g.empresa,
        g.chofer_asignado_id,
        g.created_at
      FROM guias g
      WHERE g.chofer_asignado_id = $1 
        AND (g.archivada = false OR g.archivada IS NULL)
      ORDER BY 
        CASE WHEN g.orden_ruta IS NOT NULL AND g.orden_ruta > 0 THEN g.orden_ruta ELSE 999999 END ASC,
        g.created_at ASC
    `, [targetChoferId]);

    const guias = guiasRes.rows;
    if (guias.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: `El chofer ${choferNombre} no tiene guías activas para finalizar en este momento.`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Calcular métricas y generar código de ruta
    const totalGuias = guias.length;
    const totalPiezas = guias.reduce((acc, g) => acc + (parseInt(g.piezas, 10) || 1), 0);
    const totalEntregadas = guias.filter(g => g.estado === 'Entregado').length;
    const totalNoEntregadas = guias.filter(g => g.estado === 'No entregado').length;
    const totalPendientes = guias.filter(g => g.estado !== 'Entregado' && g.estado !== 'No entregado').length;
    const porcentajeEfectividad = totalGuias > 0 ? Math.round((totalEntregadas / totalGuias) * 100) : 0;

    const rutaOrigen = guias.find(g => g.ruta_origen)?.ruta_origen || body.ruta_origen || 'Sede Principal Barquisimeto';
    const rutaDestino = guias.find(g => g.ruta_destino)?.ruta_destino || body.ruta_destino || 'Retorno a Sede Principal Barquisimeto';

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const cleanChoferSlug = choferNombre.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const codigoRuta = `RT-${dateStr}-${cleanChoferSlug}-${randomSuffix}`;

    const finalizadaPor = user.rol === 'Logistica' 
      ? `Logística (${user.nombre})`
      : `Chofer (${user.nombre})`;

    // Snapshot limpio de las guías
    const guiasSnapshot = guias.map(g => ({
      id_guia: g.id_guia,
      destinatario: g.destinatario,
      telefono_principal: g.telefono_principal,
      telefono_secundario: g.telefono_secundario,
      ciudad_destino: g.ciudad_destino,
      piezas: parseInt(g.piezas, 10) || 1,
      pies_cubicos: g.pies_cubicos ? Number(g.pies_cubicos) : null,
      direccion_referencia: g.direccion_referencia,
      hora_disponible: g.hora_disponible,
      comprobante_url: g.comprobante_url,
      recibido_por: g.recibido_por,
      orden_ruta: g.orden_ruta,
      ruta_origen: g.ruta_origen,
      ruta_destino: g.ruta_destino,
      estado: g.estado,
      gps_latitud: g.gps_latitud,
      gps_longitud: g.gps_longitud,
      gps_confirmado: g.gps_confirmado,
      empresa: g.empresa,
      chofer_asignado_id: g.chofer_asignado_id,
      created_at: g.created_at
    }));

    // 5. Insertar en rutas_archivadas
    const insertResult = await query(`
      INSERT INTO rutas_archivadas (
        codigo_ruta,
        chofer_id,
        chofer_nombre,
        ruta_origen,
        ruta_destino,
        total_guias,
        total_piezas,
        total_entregadas,
        total_no_entregadas,
        total_pendientes,
        porcentaje_efectividad,
        finalizada_por,
        fecha_finalizacion,
        guias_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
      RETURNING *
    `, [
      codigoRuta,
      targetChoferId,
      choferNombre,
      rutaOrigen,
      rutaDestino,
      totalGuias,
      totalPiezas,
      totalEntregadas,
      totalNoEntregadas,
      totalPendientes,
      porcentajeEfectividad,
      finalizadaPor,
      JSON.stringify(guiasSnapshot)
    ]);

    const rutaArchivada = insertResult.rows[0];

    // 6. Actualizar las guías en la tabla `guias` como archivadas
    const guiaIds = guias.map(g => g.id_guia);
    await query(`
      UPDATE guias
      SET 
        archivada = true,
        ruta_archivada_id = $1
      WHERE id_guia = ANY($2::text[])
    `, [rutaArchivada.id, guiaIds]);

    return new Response(JSON.stringify({
      success: true,
      message: `Ruta ${codigoRuta} finalizada y archivada exitosamente (${totalEntregadas}/${totalGuias} entregadas).`,
      data: rutaArchivada
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/rutas/finalizar POST Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al finalizar y archivar la ruta.',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
