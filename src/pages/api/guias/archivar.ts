import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import { ensureRutasArchivadasSchema } from '../../../lib/rutas_db';

// POST /api/guias/archivar - Archiva guías individuales o en lote hacia el histórico
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
        message: 'Acceso restringido: Solo el personal de Logística puede archivar guías.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureRutasArchivadasSchema();

    const body = await request.json().catch(() => ({}));
    const { ids, all_entregadas, lote_despacho, motivo } = body;

    let targetIds: string[] = [];

    if (all_entregadas) {
      // Buscar todas las guías activas entregadas
      let whereClause = `WHERE (archivada = false OR archivada IS NULL) AND estado = 'Entregado'`;
      const queryParams: any[] = [];
      if (lote_despacho && lote_despacho !== 'ALL') {
        whereClause += ` AND lote_despacho = $1`;
        queryParams.push(lote_despacho);
      }
      const entregadasRes = await query(`SELECT id_guia FROM guias ${whereClause}`, queryParams);
      targetIds = entregadasRes.rows.map(r => r.id_guia);
    } else if (Array.isArray(ids) && ids.length > 0) {
      targetIds = ids.map(id => id.toString().trim().toUpperCase()).filter(Boolean);
    } else if (body.id_guia) {
      targetIds = [body.id_guia.toString().trim().toUpperCase()];
    }

    if (targetIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No se encontraron guías para archivar.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Obtener datos completos de las guías a archivar
    const guiasRes = await query(`
      SELECT 
        g.*,
        u.nombre AS chofer_nombre
      FROM guias g
      LEFT JOIN usuarios u ON g.chofer_asignado_id = u.id
      WHERE g.id_guia = ANY($1::text[])
    `, [targetIds]);

    const guiasToArchive = guiasRes.rows;
    if (guiasToArchive.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Las guías especificadas no existen.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Generar código de lote de archivo histórico
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const codigoManifiesto = `HIST-${dateStr}-ARCH-${randomSuffix}`;

    const totalGuias = guiasToArchive.length;
    const totalPiezas = guiasToArchive.reduce((acc, g) => acc + (parseInt(g.piezas, 10) || 1), 0);
    const totalEntregadas = guiasToArchive.filter(g => g.estado === 'Entregado').length;
    const totalNoEntregadas = guiasToArchive.filter(g => g.estado === 'No entregado').length;
    const totalPendientes = guiasToArchive.filter(g => g.estado !== 'Entregado' && g.estado !== 'No entregado').length;
    const porcentajeEfectividad = totalGuias > 0 ? Math.round((totalEntregadas / totalGuias) * 100) : 0;

    const choferNombre = guiasToArchive[0]?.chofer_nombre || 'Despacho Central';
    const choferId = guiasToArchive[0]?.chofer_asignado_id || null;
    const finalizadaPor = `Logística (${user.nombre})${motivo ? ` - ${motivo}` : ''}`;

    // 3. Crear registro en rutas_archivadas para trazabilidad completa
    const insertHistoryRes = await query(`
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
      codigoManifiesto,
      choferId,
      choferNombre,
      'Cierre Parcial / Despacho Entregado',
      'Histórico de Envíos',
      totalGuias,
      totalPiezas,
      totalEntregadas,
      totalNoEntregadas,
      totalPendientes,
      porcentajeEfectividad,
      finalizadaPor,
      JSON.stringify(guiasToArchive)
    ]);

    const historiaRow = insertHistoryRes.rows[0];

    // 4. Marcar guías como archivadas
    await query(`
      UPDATE guias
      SET 
        archivada = true,
        ruta_archivada_id = $1
      WHERE id_guia = ANY($2::text[])
    `, [historiaRow.id, targetIds]);

    return new Response(JSON.stringify({
      success: true,
      message: `${totalGuias} guía(s) archivada(s) exitosamente hacia el histórico (${codigoManifiesto}).`,
      data: {
        archivadas_count: totalGuias,
        ids: targetIds,
        manifiesto_id: historiaRow.id,
        codigo_manifiesto: codigoManifiesto
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/guias/archivar Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al archivar guías',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
