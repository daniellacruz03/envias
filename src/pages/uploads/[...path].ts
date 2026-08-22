import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { query } from '../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  try {
    const rawPath = params.path || '';
    if (!rawPath || rawPath.includes('..')) {
      return new Response('Ruta no permitida', { status: 400 });
    }

    // 1. Determinar Content-Type
    const ext = path.extname(rawPath).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    // 2. Buscar archivo en disco
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'uploads', rawPath),
      path.join(process.cwd(), 'dist', 'client', 'uploads', rawPath),
      path.join(process.cwd(), 'uploads', rawPath)
    ];

    for (const p of possiblePaths) {
      try {
        const fileBuffer = await fs.readFile(p);
        if (fileBuffer && fileBuffer.length > 0) {
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        }
      } catch {
        // Continuar buscando
      }
    }

    // 3. Fallback a base de datos PostgreSQL si el disco fue reiniciado en Railway
    const searchUrl = `/uploads/${rawPath}`;
    const filenameOnly = path.basename(rawPath);

    // A. Buscar en guias_escaneos
    const escaneoRes = await query(`
      SELECT foto_base64 
      FROM guias_escaneos 
      WHERE (foto_url = $1 OR foto_url LIKE $2) 
        AND foto_base64 IS NOT NULL 
      LIMIT 1
    `, [searchUrl, `%${filenameOnly}%`]);

    if (escaneoRes.rows.length > 0 && escaneoRes.rows[0].foto_base64) {
      const rawBase64 = escaneoRes.rows[0].foto_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(rawBase64, 'base64');

      // Intentar guardar en disco para próximas peticiones rápidas
      try {
        const cachePath = path.join(process.cwd(), 'public', 'uploads', rawPath);
        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        await fs.writeFile(cachePath, buffer);
      } catch {}

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    // B. Buscar en guias (comprobantes de entrega)
    const guiaRes = await query(`
      SELECT comprobante_base64 
      FROM guias 
      WHERE (comprobante_url = $1 OR comprobante_url LIKE $2) 
        AND comprobante_base64 IS NOT NULL 
      LIMIT 1
    `, [searchUrl, `%${filenameOnly}%`]);

    if (guiaRes.rows.length > 0 && guiaRes.rows[0].comprobante_base64) {
      const rawBase64 = guiaRes.rows[0].comprobante_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(rawBase64, 'base64');

      try {
        const cachePath = path.join(process.cwd(), 'public', 'uploads', rawPath);
        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        await fs.writeFile(cachePath, buffer);
      } catch {}

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    return new Response('Imagen no encontrada', { status: 404 });

  } catch (error: any) {
    console.error('[Uploads Dynamic Handler Error]:', error);
    return new Response('Error al cargar la imagen', { status: 500 });
  }
};