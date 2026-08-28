import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import { ensureRutasArchivadasSchema } from '../../../lib/rutas_db';

// POST /api/guias/lote - Creación manual, asignación y edición de lotes y fechas de despacho
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No autenticado.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.rol === 'Chofer') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Acceso restringido: Solo el personal de Logística o Admin puede gestionar lotes.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureRutasArchivadasSchema();

    const body = await request.json().catch(() => ({}));
    const {
      action,
      lote_despacho,
      old_lote,
      new_lote,
      fecha,
      guia_ids
    } = body;

    // 1. ACCIÓN: Asignar lote y opcionalmente fecha a una lista de guías
    if (action === 'assign' || action === 'create') {
      const targetLote = (lote_despacho || new_lote || '').trim();
      if (!targetLote) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Debe especificar el código del lote de despacho.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const ids = Array.isArray(guia_ids)
        ? guia_ids.map(id => id.toString().trim().toUpperCase()).filter(Boolean)
        : [];

      let updatedCount = 0;

      if (ids.length > 0) {
        if (fecha && fecha.trim()) {
          // Actualizar lote y created_at
          const parsedDate = new Date(fecha.trim());
          const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

          const updateRes = await query(`
            UPDATE guias 
            SET lote_despacho = $1, created_at = $2 
            WHERE id_guia = ANY($3)
            RETURNING id_guia
          `, [targetLote, isoDate, ids]);
          updatedCount = updateRes.rowCount || updateRes.rows.length;
        } else {
          // Solo actualizar lote
          const updateRes = await query(`
            UPDATE guias 
            SET lote_despacho = $1 
            WHERE id_guia = ANY($2)
            RETURNING id_guia
          `, [targetLote, ids]);
          updatedCount = updateRes.rowCount || updateRes.rows.length;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: ids.length > 0
          ? `Lote ${targetLote} asignado a ${updatedCount} guía${updatedCount !== 1 ? 's' : ''} exitosamente.`
          : `Lote ${targetLote} registrado correctamente.`,
        data: {
          lote_despacho: targetLote,
          updatedCount,
          guia_ids: ids
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. ACCIÓN: Editar o Renombrar un Lote Existente y/o Cambiar su Fecha
    if (action === 'edit_lote' || action === 'rename') {
      const sourceLote = (old_lote || lote_despacho || '').trim();
      const targetLote = (new_lote || lote_despacho || '').trim();

      if (!sourceLote) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Debe indicar el lote original que desea modificar.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const updates: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (targetLote && targetLote !== sourceLote) {
        updates.push(`lote_despacho = $${paramIdx++}`);
        params.push(targetLote);
      }

      if (fecha && fecha.trim()) {
        const parsedDate = new Date(fecha.trim());
        if (!isNaN(parsedDate.getTime())) {
          updates.push(`created_at = $${paramIdx++}`);
          params.push(parsedDate.toISOString());
        }
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          message: 'No se indicaron cambios para el lote (nuevo nombre o fecha).'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      params.push(sourceLote);
      const updateRes = await query(`
        UPDATE guias 
        SET ${updates.join(', ')} 
        WHERE lote_despacho = $${paramIdx}
        RETURNING id_guia
      `, params);

      const affected = updateRes.rowCount || updateRes.rows.length;

      return new Response(JSON.stringify({
        success: true,
        message: `Lote actualizado exitosamente en ${affected} guía${affected !== 1 ? 's' : ''}.`,
        data: {
          old_lote: sourceLote,
          new_lote: targetLote || sourceLote,
          affected
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. ACCIÓN: Actualizar fecha de una o varias guías específicas
    if (action === 'update_date') {
      const ids = Array.isArray(guia_ids)
        ? guia_ids.map(id => id.toString().trim().toUpperCase()).filter(Boolean)
        : [];

      if (ids.length === 0 || !fecha) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Debe especificar las guías y la nueva fecha.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const parsedDate = new Date(fecha.trim());
      const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

      const updateRes = await query(`
        UPDATE guias 
        SET created_at = $1 
        WHERE id_guia = ANY($2)
        RETURNING id_guia
      `, [isoDate, ids]);

      const affected = updateRes.rowCount || updateRes.rows.length;

      return new Response(JSON.stringify({
        success: true,
        message: `Fecha actualizada para ${affected} guía${affected !== 1 ? 's' : ''}.`,
        data: { affected, guia_ids: ids, fecha: isoDate }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Acción no reconocida. Acciones válidas: assign, create, edit_lote, rename, update_date.'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/guias/lote Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error en el servidor al gestionar lote',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
