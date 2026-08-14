import type { APIRoute } from 'astro';
import { query } from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const result = await query(
      "SELECT id, nombre, telefono, rol FROM usuarios WHERE rol = 'Chofer' ORDER BY nombre ASC"
    );

    return new Response(JSON.stringify({
      success: true,
      data: result.rows
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[API /api/choferes Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener la lista de choferes',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
