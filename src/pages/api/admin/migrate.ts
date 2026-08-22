import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';

// POST /api/admin/migrate — Ejecuta migraciones SQL necesarias
export const POST: APIRoute = async ({ cookies }) => {
  const user = getUserFromCookies(cookies);
  if (!user || user.rol !== 'Logistica') {
    return new Response(JSON.stringify({ success: false, message: 'Solo admins.' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Crear tabla guias_escaneos si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS guias_escaneos (
        id         SERIAL PRIMARY KEY,
        lote_id    TEXT NOT NULL,
        chofer_id  INTEGER NOT NULL REFERENCES usuarios(id),
        foto_url   TEXT NOT NULL,
        estado     TEXT DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indices para performance
    await query(`CREATE INDEX IF NOT EXISTS idx_escaneos_chofer ON guias_escaneos(chofer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_escaneos_estado ON guias_escaneos(estado)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_escaneos_lote ON guias_escaneos(lote_id)`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Migracion completada: tabla guias_escaneos creada con indices.'
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};