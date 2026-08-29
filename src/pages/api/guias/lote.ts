import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import { ensureRutasArchivadasSchema } from '../../../lib/rutas_db';

// POST /api/guias/lote - Creación manual/edición de lotes de despacho y asignación masiva de chofer/estado
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
        message: 'Acceso restringido: Solo el personal de Logística o Admin puede gestionar lotes o asignaciones.'
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
      guia_ids,
      ids_guias,
      ciudad_destino,
      chofer_id,
      cambiar_estado
    } = body;

    // 1. ACCIÓN: Asignar lote de despacho y opcionalmente fecha a una lista de guías
    if ((action === 'assign' || action === 'create' || action === 'assign_lote' || action === 'create_lote') && (lote_despacho || new_lote)) {
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

      const ids = Array.isArray(guia_ids || ids_guias)
        ? (guia_ids || ids_guias).map((id: any) => id.toString().trim().toUpperCase()).filter(Boolean)
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
      const ids = Array.isArray(guia_ids || ids_guias)
        ? (guia_ids || ids_guias).map((id: any) => id.toString().trim().toUpperCase()).filter(Boolean)
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

    // 4. ACCIÓN: Asignación Masiva / Operación en Lote (por Ciudad, Chofer o IDs de Guías)
    const hasChoferParam = chofer_id !== undefined;
    const choferIdParsed = (chofer_id !== undefined && chofer_id !== null && chofer_id !== '')
      ? parseInt(chofer_id.toString(), 10)
      : null;

    const ids = Array.isArray(ids_guias || guia_ids)
      ? (ids_guias || guia_ids).map((id: any) => id.toString().trim().toUpperCase()).filter(Boolean)
      : [];

    const isBulkOperation =
      action === 'bulk_assign' ||
      action === 'bulk' ||
      action === 'batch' ||
      action === 'assign_driver' ||
      action === 'assign_chofer' ||
      action === 'assign' ||
      ciudad_destino !== undefined ||
      (hasChoferParam && !lote_despacho && !old_lote) ||
      (ids.length > 0 && (hasChoferParam || cambiar_estado));

    if (isBulkOperation) {
      let updateQuery = '';
      let queryParams: any[] = [];

      // A. Masivo por lista explícita de IDs
      if (ids.length > 0) {
        if (hasChoferParam && cambiar_estado) {
          updateQuery = `
            UPDATE guias
            SET 
              chofer_asignado_id = $1,
              estado = $2
            WHERE id_guia = ANY($3)
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [choferIdParsed, cambiar_estado, ids];
        } else if (hasChoferParam) {
          updateQuery = `
            UPDATE guias
            SET chofer_asignado_id = $1
            WHERE id_guia = ANY($2)
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [choferIdParsed, ids];
        } else if (cambiar_estado) {
          updateQuery = `
            UPDATE guias
            SET estado = $1
            WHERE id_guia = ANY($2)
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [cambiar_estado, ids];
        }
      }
      // B. Masivo por Ciudad de Destino
      else if (ciudad_destino && typeof ciudad_destino === 'string') {
        const cleanCiudad = ciudad_destino.trim();
        if (hasChoferParam && cambiar_estado) {
          updateQuery = `
            UPDATE guias
            SET 
              chofer_asignado_id = $1,
              estado = CASE WHEN estado != 'Entregado' THEN $2 ELSE estado END
            WHERE TRIM(LOWER(ciudad_destino)) = TRIM(LOWER($3))
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [choferIdParsed, cambiar_estado, cleanCiudad];
        } else if (hasChoferParam) {
          updateQuery = `
            UPDATE guias
            SET chofer_asignado_id = $1
            WHERE TRIM(LOWER(ciudad_destino)) = TRIM(LOWER($2))
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [choferIdParsed, cleanCiudad];
        } else if (cambiar_estado) {
          updateQuery = `
            UPDATE guias
            SET estado = CASE WHEN estado != 'Entregado' THEN $1 ELSE estado END
            WHERE TRIM(LOWER(ciudad_destino)) = TRIM(LOWER($2))
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [cambiar_estado, cleanCiudad];
        }
      }
      // C. Masivo por Chofer (ej. despachar todas sus guías activas a 'En ruta')
      else if (choferIdParsed !== null) {
        if (cambiar_estado) {
          updateQuery = `
            UPDATE guias
            SET estado = $1
            WHERE chofer_asignado_id = $2 AND estado != 'Entregado'
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [cambiar_estado, choferIdParsed];
        } else {
          updateQuery = `
            UPDATE guias
            SET chofer_asignado_id = $1
            WHERE chofer_asignado_id = $1
            RETURNING id_guia, destinatario, ciudad_destino, estado, chofer_asignado_id
          `;
          queryParams = [choferIdParsed];
        }
      }

      if (!updateQuery) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Debe especificar una ciudad de destino, una lista de guías o un chofer para la operación en lote.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await query(updateQuery, queryParams);
      const updatedCount = result.rowCount || result.rows.length;
      const updatedIds = result.rows.map((r: any) => r.id_guia);

      let fullGuiasResult: any = { rows: [] };
      if (updatedIds.length > 0) {
        fullGuiasResult = await query(`
          SELECT 
            g.id_guia,
            g.destinatario,
            g.telefono_principal,
            g.telefono_secundario,
            g.ciudad_destino,
            g.piezas,
            g.pies_cubicos,
            g.direccion_referencia,
            g.estado,
            g.gps_latitud,
            g.gps_longitud,
            g.gps_confirmado,
            g.chofer_asignado_id,
            g.created_at,
            g.lote_despacho,
            u.nombre AS chofer_nombre,
            u.telefono AS chofer_telefono
          FROM guias g
          LEFT JOIN usuarios u ON g.chofer_asignado_id = u.id
          WHERE g.id_guia = ANY($1)
          ORDER BY g.created_at DESC
        `, [updatedIds]);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Se actualizaron ${updatedCount} guía${updatedCount !== 1 ? 's' : ''} exitosamente.`,
        count: updatedCount,
        data: fullGuiasResult.rows
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Acción no reconocida. Acciones válidas: assign, create, edit_lote, rename, update_date o asignación masiva de chofer/ciudad.'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/guias/lote Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error en el servidor al procesar la operación de lote',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
