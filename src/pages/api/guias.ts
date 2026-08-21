import type { APIRoute } from 'astro';
import { query } from '../../lib/db';

// GET: Consulta todas las guías con JOIN a usuarios (chofer)
export const GET: APIRoute = async () => {
  try {
    const result = await query(`
      SELECT 
        g.id_guia,
        g.destinatario,
        g.telefono_principal,
        g.telefono_secundario,
        g.ciudad_destino,
        g.piezas,
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
        g.chofer_asignado_id,
        g.created_at,
        u.nombre AS chofer_nombre,
        u.telefono AS chofer_telefono
      FROM guias g
      LEFT JOIN usuarios u ON g.chofer_asignado_id = u.id
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
      direccion_referencia
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

    const insertResult = await query(`
      INSERT INTO guias (
        id_guia,
        destinatario,
        telefono_principal,
        telefono_secundario,
        ciudad_destino,
        piezas,
        direccion_referencia,
        estado,
        gps_confirmado,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'Por contactar', false, NOW()
      )
      RETURNING *
    `, [
      cleanGuia,
      destinatario.trim(),
      telefono_principal.trim(),
      telefono_secundario ? telefono_secundario.trim() : null,
      ciudad_destino.trim(),
      parseInt(piezas, 10) || 1,
      direccion_referencia ? direccion_referencia.trim() : null
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
