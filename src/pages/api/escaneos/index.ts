import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import fs from 'fs/promises';
import path from 'path';

// GET /api/escaneos — Lista escaneos agrupados por lote (solo Logistica)
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (user.rol === 'Chofer') {
      return new Response(JSON.stringify({ success: false, message: 'Acceso denegado.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await query(`
      SELECT 
        ge.id,
        ge.lote_id,
        ge.chofer_id,
        ge.foto_url,
        ge.estado,
        ge.created_at,
        u.nombre AS chofer_nombre,
        u.telefono AS chofer_telefono
      FROM guias_escaneos ge
      LEFT JOIN usuarios u ON ge.chofer_id = u.id
      ORDER BY ge.created_at DESC
    `);

    const lotesMap: Record<string, any> = {};
    for (const row of result.rows) {
      if (!lotesMap[row.lote_id]) {
        lotesMap[row.lote_id] = {
          lote_id: row.lote_id,
          chofer_id: row.chofer_id,
          chofer_nombre: row.chofer_nombre,
          chofer_telefono: row.chofer_telefono,
          created_at: row.created_at,
          fotos: [],
          total: 0,
          pendientes: 0,
          procesadas: 0,
          rechazadas: 0
        };
      }
      const lote = lotesMap[row.lote_id];
      const fotoUrl = row.foto_url || `/uploads/escaneo_${row.id}.jpg`;
      lote.fotos.push({ id: row.id, foto_url: fotoUrl, estado: row.estado, created_at: row.created_at });
      lote.total++;
      if (row.estado === 'pendiente') lote.pendientes++;
      else if (row.estado === 'procesado') lote.procesadas++;
      else if (row.estado === 'rechazado') lote.rechazadas++;
    }

    const lotes = Object.values(lotesMap);
    const totalPendientes = result.rows.filter((r: any) => r.estado === 'pendiente').length;

    return new Response(JSON.stringify({ success: true, data: lotes, totalPendientes }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API GET /api/escaneos Error]:', error);
    return new Response(JSON.stringify({ success: false, message: 'Error al consultar escaneos', error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/escaneos — Recibe foto del chofer o logística
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado. Por favor inicia sesión.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    let foto_base64 = '';
    let lote_id = `lote_${Date.now()}`;
    let publicUrl = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      foto_base64 = (body.foto_base64 || '').toString().trim();
      if (body.lote_id) lote_id = body.lote_id.toString().trim();
    } else {
      const formData = await request.formData().catch(() => new FormData());
      const foto = formData.get('foto') as File | null;
      foto_base64 = (formData.get('foto_base64') || '').toString().trim();
      if (formData.get('lote_id')) {
        lote_id = (formData.get('lote_id') || '').toString().trim();
      }

      if (foto && foto instanceof File && foto.size > 0) {
        const extension = foto.type.includes('png') ? 'png' : (foto.type.includes('webp') ? 'webp' : 'jpg');
        const fileName = `escaneo_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
        publicUrl = `/uploads/escaneos/${fileName}`;

        const arrayBuffer = await foto.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (!foto_base64) {
          const mimeType = extension === 'png' ? 'image/png' : (extension === 'webp' ? 'image/webp' : 'image/jpeg');
          foto_base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
        }

        // Guardado local opcional
        try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'escaneos');
          await fs.mkdir(uploadDir, { recursive: true });
          await fs.writeFile(path.join(uploadDir, fileName), buffer);
        } catch (fsErr) {
          console.warn('[FS Warning]: Usando base64 en PostgreSQL.', fsErr);
        }
      }
    }

    if (!foto_base64) {
      return new Response(JSON.stringify({ success: false, message: 'No se recibió ninguna imagen válida.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!publicUrl) {
      publicUrl = foto_base64;
    }

    const insertResult = await query(`
      INSERT INTO guias_escaneos (lote_id, chofer_id, foto_url, foto_base64, estado, created_at)
      VALUES ($1, $2, $3, $4, 'pendiente', NOW())
      RETURNING id, lote_id, chofer_id, foto_url, estado, created_at
    `, [lote_id, user.id, publicUrl, foto_base64]);

    const escaneo = insertResult.rows[0];
    console.log('[ESCANEO GUARDADO OK]:', { id: escaneo.id, chofer: user.nombre, lote_id });

    return new Response(JSON.stringify({ success: true, message: 'Foto de guía guardada correctamente.', data: escaneo }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API POST /api/escaneos Error]:', error);
    return new Response(JSON.stringify({ success: false, message: 'Error al guardar el escaneo.', error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/escaneos — Elimina escaneos por lote_id
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (user.rol === 'Chofer') {
      return new Response(JSON.stringify({ success: false, message: 'Acceso denegado.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const loteId = url.searchParams.get('lote_id');

    if (!loteId) {
      return new Response(JSON.stringify({ success: false, message: 'Parámetro lote_id requerido.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const escaneos = await query(`SELECT foto_url FROM guias_escaneos WHERE lote_id = $1`, [loteId]);
    for (const row of escaneos.rows) {
      if (row.foto_url && row.foto_url.startsWith('/uploads/')) {
        const relPath = row.foto_url.replace(/^\/uploads\//, '');
        const p = path.join(process.cwd(), 'public', 'uploads', relPath);
        try { await fs.unlink(p); } catch(e) {}
      }
    }

    await query(`DELETE FROM guias_escaneos WHERE lote_id = $1`, [loteId]);

    return new Response(JSON.stringify({ success: true, message: `Lote ${loteId} eliminado correctamente.` }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API DELETE /api/escaneos Error]:', error);
    return new Response(JSON.stringify({ success: false, message: 'Error al eliminar lote.', error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};