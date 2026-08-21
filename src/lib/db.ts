import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB WARNING]: La variable DATABASE_URL no está definida en el entorno.');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Manejar errores de clientes inactivos en el pool para evitar caídas del proceso
pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning]: Error en cliente inactivo de base de datos:', err.message);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
