import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

// PATCH /api/escaneos/[id] — Logistica aprueba o rechaza un escaneo
// Body JSON: { accion: 'procesar' | 'rechazar', datos_guia?: { id_guia, destinatario, telefono_principal, ciudad_destino, piezas, direccion_referencia } }
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (user.rol !== 'Logistica' && user.rol !== 'Admin') {
      return new Response(JSON.stringify({ success: false, message: 'Solo Logística y Administradores pueden aprobar o rechazar escaneos.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    const escaneoId = parseInt(params.id || '0', 10);
    if (!escaneoId) {
      return new Response(JSON.stringify({ success: false, message: 'ID de escaneo invalido.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { accion, datos_guia } = body;

    if (accion === 'rechazar') {
      await query(`UPDATE guias_escaneos SET estado = 'rechazado' WHERE id = $1`, [escaneoId]);
      return new Response(JSON.stringify({ success: true, message: 'Escaneo rechazado.' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (accion === 'procesar') {
      if (!datos_guia || !datos_guia.id_guia || !datos_guia.destinatario || !datos_guia.telefono_principal || !datos_guia.ciudad_destino) {
        return new Response(JSON.stringify({ success: false, message: 'Faltan datos obligatorios de la guia (id_guia, destinatario, telefono_principal, ciudad_destino).' }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verificar que el escaneo existe y obtener chofer_id
      const escaneoResult = await query(`SELECT * FROM guias_escaneos WHERE id = $1`, [escaneoId]);
      if (escaneoResult.rows.length === 0) {
        return new Response(JSON.stringify({ success: false, message: 'Escaneo no encontrado.' }), {
          status: 404, headers: { 'Content-Type': 'application/json' }
        });
      }
      const escaneo = escaneoResult.rows[0];
      const cleanGuia = datos_guia.id_guia.trim().toUpperCase();

      // Verificar duplicado
      const exists = await query('SELECT id_guia FROM guias WHERE id_guia = $1', [cleanGuia]);
      if (exists.rows.length > 0) {
        return new Response(JSON.stringify({ success: false, message: `La guia #${cleanGuia} ya esta registrada en el sistema.` }), {
          status: 409, headers: { 'Content-Type': 'application/json' }
        });
      }

      const parsedPies = (datos_guia.pies_cubicos !== undefined && datos_guia.pies_cubicos !== null && datos_guia.pies_cubicos !== '')
        ? parseFloat(datos_guia.pies_cubicos) || null
        : null;

      // Crear la guia en la tabla guias
      const insertResult = await query(`
        INSERT INTO guias (
          id_guia, destinatario, telefono_principal, telefono_secundario,
          ciudad_destino, piezas, pies_cubicos, direccion_referencia, empresa,
          estado, gps_confirmado, chofer_asignado_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Por contactar', false, $10, NOW())
        RETURNING *
      `, [
        cleanGuia,
        datos_guia.destinatario.trim(),
        datos_guia.telefono_principal.trim(),
        datos_guia.telefono_secundario ? datos_guia.telefono_secundario.trim() : null,
        datos_guia.ciudad_destino.trim(),
        parseInt(datos_guia.piezas, 10) || 1,
        parsedPies,
        datos_guia.direccion_referencia ? datos_guia.direccion_referencia.trim() : null,
        datos_guia.empresa ? datos_guia.empresa.trim() : null,
        escaneo.chofer_id
      ]);

      // Marcar escaneo como procesado
      await query(`UPDATE guias_escaneos SET estado = 'procesado' WHERE id = $1`, [escaneoId]);

      return new Response(JSON.stringify({
        success: true,
        message: `Guia #${cleanGuia} creada y asignada al chofer.`,
        data: insertResult.rows[0]
      }), {
        status: 201, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, message: 'Accion no reconocida. Usa "procesar" o "rechazar".' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API PATCH /api/escaneos/[id] Error]:', error);
    return new Response(JSON.stringify({ success: false, message: 'Error al procesar el escaneo.', error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/escaneos/[id] — Eliminar permanentemente un escaneo y su foto
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const escaneoId = parseInt(params.id || '0', 10);
    if (!escaneoId) {
      return new Response(JSON.stringify({ success: false, message: 'ID de escaneo inválido.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const escaneoRes = await query(`SELECT id, foto_url FROM guias_escaneos WHERE id = $1`, [escaneoId]);
    if (escaneoRes.rows.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Escaneo no encontrado.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    const currentUrl = escaneoRes.rows[0].foto_url;
    if (currentUrl && currentUrl.startsWith('/uploads/')) {
      const relPath = currentUrl.replace(/^\/uploads\//, '');
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'uploads', relPath),
        path.join(process.cwd(), 'dist', 'client', 'uploads', relPath),
        path.join(process.cwd(), 'uploads', relPath)
      ];

      for (const p of possiblePaths) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (e) {
          console.warn('[DELETE Escaneo Warning]: No se pudo borrar archivo físico:', p, e);
        }
      }
    }

    await query(`DELETE FROM guias_escaneos WHERE id = $1`, [escaneoId]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Foto de escaneo eliminada permanentemente.',
      data: { id: escaneoId }
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API DELETE /api/escaneos/[id] Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al eliminar el escaneo.',
      error: error.message
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};