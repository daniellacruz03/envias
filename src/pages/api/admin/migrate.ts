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

    // Crear tabla rutas_archivadas si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS rutas_archivadas (
        id SERIAL PRIMARY KEY,
        codigo_ruta TEXT UNIQUE NOT NULL,
        chofer_id INTEGER REFERENCES usuarios(id),
        chofer_nombre TEXT NOT NULL,
        ruta_origen TEXT DEFAULT 'Sede Principal Barquisimeto',
        ruta_destino TEXT DEFAULT 'Retorno a Sede Principal Barquisimeto',
        total_guias INTEGER DEFAULT 0,
        total_piezas INTEGER DEFAULT 0,
        total_entregadas INTEGER DEFAULT 0,
        total_no_entregadas INTEGER DEFAULT 0,
        total_pendientes INTEGER DEFAULT 0,
        porcentaje_efectividad INTEGER DEFAULT 0,
        finalizada_por TEXT NOT NULL,
        fecha_finalizacion TIMESTAMP DEFAULT NOW(),
        guias_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_rutas_archivadas_chofer ON rutas_archivadas(chofer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_rutas_archivadas_fecha ON rutas_archivadas(fecha_finalizacion DESC)`);

    // Columnas de archivo en guias
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS archivada BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS ruta_archivada_id INTEGER REFERENCES rutas_archivadas(id)`);
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS pies_cubicos NUMERIC(10,2) DEFAULT NULL`);
    await query(`CREATE INDEX IF NOT EXISTS idx_guias_archivada ON guias(archivada)`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Migración completada: tablas guias_escaneos y rutas_archivadas creadas con índices y columnas añadidas.'
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};