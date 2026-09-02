import { query } from './db';

/**
 * Garantiza que la tabla 'rutas_archivadas' y las columnas de archivo en 'guias'
 * existan en PostgreSQL en Railway.
 */
let isSchemaInitialized = false;

export async function ensureRutasArchivadasSchema() {
  if (isSchemaInitialized) return;

  try {
    // 1. Crear tabla rutas_archivadas si no existe
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

    // 2. Crear índices para rendimiento
    await query(`CREATE INDEX IF NOT EXISTS idx_rutas_archivadas_chofer ON rutas_archivadas(chofer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_rutas_archivadas_fecha ON rutas_archivadas(fecha_finalizacion DESC)`);

    // 3. Añadir columnas a tabla guias si no existen
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS archivada BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS ruta_archivada_id INTEGER REFERENCES rutas_archivadas(id)`);
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS pies_cubicos NUMERIC(10,2) DEFAULT NULL`);
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS lote_despacho VARCHAR(64) DEFAULT NULL`);
    await query(`ALTER TABLE guias ADD COLUMN IF NOT EXISTS nota_cobro TEXT DEFAULT NULL`);
    await query(`CREATE INDEX IF NOT EXISTS idx_guias_archivada ON guias(archivada)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_guias_lote_despacho ON guias(lote_despacho)`);

    isSchemaInitialized = true;
  } catch (error: any) {
    console.error('[DB Schema Rutas Error]:', error);
  }
}
