import type { APIRoute } from 'astro';
import { query } from '../../lib/db';

// GET: Consulta todas las guías con JOIN a usuarios (chofer)
export const GET: APIRoute = async ({ url }) => {
  try {
    const incluirArchivadas = url.searchParams.get('incluir_archivadas') === 'true';
    const whereClause = incluirArchivadas ? '' : "WHERE (g.archivada = false OR g.archivada IS NULL OR g.estado = 'No entregado')";

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
        g.empresa,
        g.chofer_asignado_id,
        g.created_at,
        g.archivada,
        g.ruta_archivada_id,
        g.lote_despacho,
        u.nombre AS chofer_nombre,
        u.telefono AS chofer_telefono
      FROM guias g
      LEFT JOIN usuarios u ON g.chofer_asignado_id = u.id
      ${whereClause}
      ORDER BY g.created_at DESC
    `);

    return new Response(JSON.stringify({
      success: true,
      data: result.rows
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/guias GET Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al consultar las guías',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Registrar una nueva guía
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      id_guia,
      destinatario,
      telefono_principal,
      telefono_secundario,
      ciudad_destino,
      piezas,
      pies_cubicos,
      direccion_referencia,
      empresa,
      lote_despacho,
      created_at
    } = body;

    if (!id_guia || !destinatario || !telefono_principal || !ciudad_destino) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Faltan campos obligatorios (id_guia, destinatario, telefono_principal, ciudad_destino)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanGuia = id_guia.trim().toUpperCase();

    // Validar si la guía ya existe
    const exists = await query('SELECT id_guia FROM guias WHERE id_guia = $1', [cleanGuia]);
    if (exists.rows.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: `La guía #${cleanGuia} ya se encuentra registrada en el sistema.`
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parsedPiesCubicos = (pies_cubicos !== undefined && pies_cubicos !== null && pies_cubicos !== '')
      ? parseFloat(pies_cubicos) || null
      : null;

    let finalCreatedAt = new Date().toISOString();
    if (created_at && created_at.trim()) {
      const parsed = new Date(created_at.trim());
      if (!isNaN(parsed.getTime())) {
        finalCreatedAt = parsed.toISOString();
      }
    }

    // Calcular lote_despacho automático si no viene especificado
    let finalLote = lote_despacho ? lote_despacho.trim() : null;
    if (!finalLote) {
      const now = new Date(finalCreatedAt);
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const year = d.getUTCFullYear();
      const originSlug = 'BRM';
      finalLote = `REL-${year}-W${weekNo < 10 ? '0' + weekNo : weekNo}-${originSlug}`;
    }

    // Buscar si el cliente ya tenía GPS confirmado previamente
    let autoGpsConfirmado = false;
    let autoGpsLat: number | null = null;
    let autoGpsLon: number | null = null;
    let autoHora: string | null = null;

    try {
      const previousClientGps = await query(`
        SELECT gps_latitud, gps_longitud, hora_disponible 
        FROM guias 
        WHERE TRIM(LOWER(destinatario)) = TRIM(LOWER($1)) 
          AND gps_confirmado = true 
          AND gps_latitud IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [destinatario.trim()]);

      if (previousClientGps.rows.length > 0) {
        autoGpsConfirmado = true;
        autoGpsLat = previousClientGps.rows[0].gps_latitud;
        autoGpsLon = previousClientGps.rows[0].gps_longitud;
        autoHora = previousClientGps.rows[0].hora_disponible;
      }
    } catch (e) {
      console.warn('[Auto-GPS Warning]:', e);
    }

    const insertResult = await query(`
      INSERT INTO guias (
        id_guia,
        destinatario,
        telefono_principal,
        telefono_secundario,
        ciudad_destino,
        piezas,
        pies_cubicos,
        direccion_referencia,
        empresa,
        estado,
        gps_confirmado,
        gps_latitud,
        gps_longitud,
        hora_disponible,
        lote_despacho,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'Por contactar', $10, $11, $12, $13, $14, $15
      )
      RETURNING *
    `, [
      cleanGuia,
      destinatario.trim(),
      telefono_principal.trim(),
      telefono_secundario ? telefono_secundario.trim() : null,
      ciudad_destino.trim(),
      parseInt(piezas, 10) || 1,
      parsedPiesCubicos,
      direccion_referencia ? direccion_referencia.trim() : null,
      empresa ? empresa.trim() : null,
      autoGpsConfirmado,
      autoGpsLat,
      autoGpsLon,
      autoHora,
      finalLote,
      finalCreatedAt
    ]);

    const newGuia = insertResult.rows[0];

    return new Response(JSON.stringify({
      success: true,
      message: 'Guía registrada exitosamente en PostgreSQL',
      data: {
        ...newGuia,
        chofer_nombre: null
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/guias POST Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al insertar la guía en la base de datos',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
