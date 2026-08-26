import type { APIRoute } from 'astro';
import { query } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const search = url.searchParams.get('q')?.trim() || '';
    const ciudad = url.searchParams.get('ciudad')?.trim() || '';

    // Consultamos todas las guías para consolidar el perfil de cada cliente
    const result = await query(`
      SELECT 
        id_guia,
        destinatario,
        telefono_principal,
        telefono_secundario,
        ciudad_destino,
        direccion_referencia,
        hora_disponible,
        gps_latitud,
        gps_longitud,
        gps_confirmado,
        empresa,
        piezas,
        pies_cubicos,
        estado,
        created_at
      FROM guias
      WHERE destinatario IS NOT NULL AND TRIM(destinatario) != ''
      ORDER BY created_at DESC
    `);

    // Mapa para agrupar por cliente normalizado (nombre + ciudad o nombre solo)
    const clientMap: Record<string, {
      destinatario: string;
      telefono_principal: string;
      telefono_secundario: string | null;
      ciudad_destino: string;
      direccion_referencia: string | null;
      hora_disponible: string | null;
      gps_latitud: number | null;
      gps_longitud: number | null;
      gps_confirmado: boolean;
      total_guias: number;
      total_piezas: number;
      total_pies_cubicos: number;
      ultimo_envio: string;
      guias_recientes: Array<{
        id_guia: string;
        estado: string;
        piezas: number;
        empresa: string | null;
        created_at: string;
      }>;
      empresas: string[];
    }> = {};

    function normalizeKey(str: string): string {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    }

    result.rows.forEach((row: any) => {
      const normName = normalizeKey(row.destinatario);
      const normCity = normalizeKey(row.ciudad_destino);
      const key = `${normName}|${normCity}`;

      if (!clientMap[key]) {
        clientMap[key] = {
          destinatario: row.destinatario.trim(),
          telefono_principal: row.telefono_principal ? row.telefono_principal.trim() : '',
          telefono_secundario: row.telefono_secundario ? row.telefono_secundario.trim() : null,
          ciudad_destino: row.ciudad_destino ? row.ciudad_destino.trim() : '',
          direccion_referencia: row.direccion_referencia ? row.direccion_referencia.trim() : null,
          hora_disponible: row.hora_disponible || null,
          gps_latitud: row.gps_latitud ? Number(row.gps_latitud) : null,
          gps_longitud: row.gps_longitud ? Number(row.gps_longitud) : null,
          gps_confirmado: Boolean(row.gps_confirmado),
          total_guias: 0,
          total_piezas: 0,
          total_pies_cubicos: 0,
          ultimo_envio: row.created_at,
          guias_recientes: [],
          empresas: []
        };
      }

      const client = clientMap[key];
      client.total_guias += 1;
      client.total_piezas += (row.piezas || 1);
      client.total_pies_cubicos += (Number(row.pies_cubicos) || 0);

      // Si este registro tiene GPS confirmado y el cliente no lo tenía aún, actualizarlo
      if (row.gps_confirmado && row.gps_latitud && row.gps_longitud) {
        client.gps_confirmado = true;
        client.gps_latitud = Number(row.gps_latitud);
        client.gps_longitud = Number(row.gps_longitud);
      }

      // Si tiene dirección más reciente o más completa
      if (row.direccion_referencia && !client.direccion_referencia) {
        client.direccion_referencia = row.direccion_referencia.trim();
      }

      // Teléfono secundario si no tenía
      if (row.telefono_secundario && !client.telefono_secundario) {
        client.telefono_secundario = row.telefono_secundario.trim();
      }

      // Horario disponible
      if (row.hora_disponible && !client.hora_disponible) {
        client.hora_disponible = row.hora_disponible;
      }

      // Registrar empresa
      if (row.empresa && !client.empresas.includes(row.empresa)) {
        client.empresas.push(row.empresa);
      }

      // Guardar últimas 5 guías
      if (client.guias_recientes.length < 5) {
        client.guias_recientes.push({
          id_guia: row.id_guia,
          estado: row.estado,
          piezas: row.piezas || 1,
          empresa: row.empresa || null,
          created_at: row.created_at
        });
      }
    });

    let clients = Object.values(clientMap);

    // Filtros opcionales
    if (search) {
      const sNorm = normalizeKey(search);
      clients = clients.filter(c => 
        normalizeKey(c.destinatario).includes(sNorm) ||
        (c.telefono_principal && c.telefono_principal.includes(search)) ||
        (c.telefono_secundario && c.telefono_secundario.includes(search)) ||
        normalizeKey(c.ciudad_destino).includes(sNorm) ||
        (c.direccion_referencia && normalizeKey(c.direccion_referencia).includes(sNorm))
      );
    }

    if (ciudad) {
      const cNorm = normalizeKey(ciudad);
      clients = clients.filter(c => normalizeKey(c.ciudad_destino).includes(cNorm));
    }

    // Ordenar por total de guías descendente (clientes más frecuentes primero)
    clients.sort((a, b) => b.total_guias - a.total_guias || new Date(b.ultimo_envio).getTime() - new Date(a.ultimo_envio).getTime());

    return new Response(JSON.stringify({
      success: true,
      total: clients.length,
      data: clients
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('[API /api/clientes GET Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al consultar el directorio de clientes',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
