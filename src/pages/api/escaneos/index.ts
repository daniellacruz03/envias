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
    if (user.rol !== 'Logistica') {
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
      lote.fotos.push({ id: row.id, foto_url: row.foto_url, estado: row.estado, created_at: row.created_at });
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

// POST /api/escaneos — Recibe foto del chofer
// FormData: { foto: File, lote_id: string }
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (user.rol !== 'Chofer') {
      return new Response(JSON.stringify({ success: false, message: 'Solo los choferes pueden subir guias.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const foto = formData.get('foto') as File | null;
    const lote_id = (formData.get('lote_id') || '').toString().trim();

    if (!foto || !(foto instanceof File) || foto.size === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No se recibio ninguna foto.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!lote_id) {
      return new Response(JSON.stringify({ success: false, message: 'El identificador de lote es obligatorio.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'escaneos');
    await fs.mkdir(uploadDir, { recursive: true });

    const extension = foto.type.includes('png') ? 'png' : (foto.type.includes('webp') ? 'webp' : 'jpg');
    const fileName = `escaneo_${user.id}_${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    const arrayBuffer = await foto.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/escaneos/${fileName}`;

    const insertResult = await query(`
      INSERT INTO guias_escaneos (lote_id, chofer_id, foto_url, estado, created_at)
      VALUES ($1, $2, $3, 'pendiente', NOW())
      RETURNING id, lote_id, chofer_id, foto_url, estado, created_at
    `, [lote_id, user.id, publicUrl]);

    const escaneo = insertResult.rows[0];
    console.log('[ESCANEO SUBIDO]:', { id: escaneo.id, chofer: user.nombre, lote_id, fileName });

    return new Response(JSON.stringify({ success: true, message: 'Foto de guia recibida correctamente.', data: escaneo }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API POST /api/escaneos Error]:', error);
    return new Response(JSON.stringify({ success: false, message: 'Error al guardar el escaneo.', error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};