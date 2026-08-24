import type { APIRoute } from 'astro';
import { query } from '../../../../lib/db';
import { getUserFromCookies } from '../../../../lib/auth';
import fs from 'fs';
import path from 'path';

// DELETE /api/guias/[id]/foto - Elimina la foto / comprobante de una guía
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID de guía requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanId = id.trim().toUpperCase();

    // 1. Obtener la guía para saber la URL de la foto
    const guiaRes = await query('SELECT id_guia, comprobante_url FROM guias WHERE id_guia = $1', [cleanId]);
    if (guiaRes.rows.length === 0) {
      return new Response(JSON.stringify({ success: false, message: `Guía #${cleanId} no encontrada` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const currentUrl = guiaRes.rows[0].comprobante_url;

    // 2. Si hay archivo en disco, intentar eliminarlo
    if (currentUrl && currentUrl.startsWith('/uploads/')) {
      const relPath = currentUrl.replace(/^\/uploads\//, '');
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'uploads', relPath),
        path.join(process.cwd(), 'dist', 'client', 'uploads', relPath),
        path.join(process.cwd(), 'uploads', relPath)
      ];

      for (const p of possiblePaths) {
        try {
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
          }
        } catch (e) {
          console.warn('[DELETE Foto Warning]: No se pudo borrar archivo físico:', p, e);
        }
      }
    }

    // 3. Limpiar los campos en la base de datos PostgreSQL
    await query(`
      UPDATE guias
      SET comprobante_url = NULL,
          comprobante_base64 = NULL,
          recibido_por = NULL
      WHERE id_guia = $1
    `, [cleanId]);

    return new Response(JSON.stringify({
      success: true,
      message: `Foto de la guía #${cleanId} eliminada exitosamente.`,
      data: { id_guia: cleanId }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API DELETE /api/guias/[id]/foto Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al eliminar la foto de la guía',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
