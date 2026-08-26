import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { getUserFromCookies } from '../../../lib/auth';
import fs from 'fs/promises';
import path from 'path';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Validar autenticación estricta de chofer
    const user = getUserFromCookies(cookies);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No autenticado. Inicia sesión.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.rol !== 'Chofer') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Acceso denegado: solo choferes pueden confirmar entregas.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Procesar FormData
    const formData = await request.formData();
    const rawIdGuia = (formData.get('id_guia') || '').toString().trim().toUpperCase();
    const tipo_resultado = (formData.get('tipo_resultado') || 'entregado').toString().trim(); // 'entregado' | 'no_entregado'
    const motivo_no_entrega = (formData.get('motivo_no_entrega') || '').toString().trim();
    const recibido_por = (formData.get('recibido_por') || '').toString().trim();
    const nota_adicional = (formData.get('nota_adicional') || '').toString().trim();
    const foto = formData.get('foto') as File | null;

    if (!rawIdGuia) {
      return new Response(JSON.stringify({
        success: false,
        message: 'El número de guía es obligatorio.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Permitir entregar múltiples guías del mismo cliente separadas por coma
    const idGuiasArray = rawIdGuia
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    const primaryIdGuia = idGuiasArray[0];

    let publicUrl: string | null = null;
    let comprobanteBase64: string | null = null;

    // Procesar foto si fue adjuntada
    if (foto && foto instanceof File && foto.size > 0) {
      const extension = foto.type.includes('png') ? 'png' : (foto.type.includes('webp') ? 'webp' : 'jpg');
      const cleanId = primaryIdGuia.replace(/[^A-Z0-9_-]/gi, '');
      const fileName = `comprobante_${cleanId}_${Date.now()}.${extension}`;
      publicUrl = `/uploads/comprobantes/${fileName}`;

      const arrayBuffer = await foto.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = extension === 'png' ? 'image/png' : (extension === 'webp' ? 'image/webp' : 'image/jpeg');
      comprobanteBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        const distUploadDir = path.join(process.cwd(), 'dist', 'client', 'uploads', 'comprobantes');
        await fs.mkdir(distUploadDir, { recursive: true });
        await fs.writeFile(path.join(distUploadDir, fileName), buffer);
      } catch (fsErr) {
        console.warn('[FS Warning]: Usando base64 en PostgreSQL para comprobante.', fsErr);
      }
    }

    let nuevoEstado = 'Entregado';
    let campoRecibido: string | null = null;

    if (tipo_resultado === 'no_entregado') {
      nuevoEstado = 'No entregado';
      const motivoFinal = motivo_no_entrega || 'Cliente ausente / No contesta';
      campoRecibido = `[No entregado]: ${motivoFinal}${nota_adicional ? ` (${nota_adicional})` : ''}`;
    } else {
      // Para entrega exitosa, la foto es obligatoria
      if (!publicUrl) {
        return new Response(JSON.stringify({
          success: false,
          message: 'La foto del comprobante de entrega es obligatoria para confirmar la entrega.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      nuevoEstado = 'Entregado';
      campoRecibido = recibido_por || null;
    }

    // 5. Actualizar en PostgreSQL (todas las guías agrupadas para este cliente)
    const updateResult = await query(`
      UPDATE guias
      SET 
        estado = $1,
        comprobante_url = COALESCE($2, comprobante_url),
        comprobante_base64 = COALESCE($3, comprobante_base64),
        recibido_por = $4
      WHERE id_guia = ANY($5::text[])
      RETURNING *
    `, [nuevoEstado, publicUrl, comprobanteBase64, campoRecibido, idGuiasArray]);

    if (updateResult.rowCount === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: `Ninguna de las guías (${idGuiasArray.join(', ')}) fue encontrada en la base de datos.`
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const guiasActualizadas = updateResult.rows;

    console.log('[PROCESO DE ENTREGA]:', {
      id_guias: idGuiasArray,
      total_actualizadas: guiasActualizadas.length,
      estado: nuevoEstado,
      chofer_id: user.id,
      comprobante_url: publicUrl,
      detalle: campoRecibido
    });

    const msg = guiasActualizadas.length > 1
      ? `¡Entrega confirmada con éxito para ${guiasActualizadas.length} guías del cliente (#${idGuiasArray.join(', #')})!`
      : (nuevoEstado === 'Entregado' ? 'Entrega confirmada y comprobante guardado con éxito.' : 'Incidencia registrada: guía marcada como No entregado.');

    return new Response(JSON.stringify({
      success: true,
      message: msg,
      data: guiasActualizadas[0],
      guias_actualizadas: guiasActualizadas
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[API /api/chofer/entregar Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al procesar la entrega con comprobante',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
