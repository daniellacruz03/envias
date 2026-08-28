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

    // 3. Procesar Fotos (Soporte individual y múltiple)
    const uploadedFiles: File[] = [];
    const rawFotos = formData.getAll('fotos');
    if (rawFotos && rawFotos.length > 0) {
      for (const item of rawFotos) {
        if (item instanceof File && item.size > 0) {
          uploadedFiles.push(item);
        }
      }
    }
    if (uploadedFiles.length === 0) {
      const singleFoto = formData.get('foto');
      if (singleFoto && singleFoto instanceof File && singleFoto.size > 0) {
        uploadedFiles.push(singleFoto);
      }
    }

    const publicUrls: string[] = [];
    const base64List: string[] = [];

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');
    const distUploadDir = path.join(process.cwd(), 'dist', 'client', 'uploads', 'comprobantes');

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.mkdir(distUploadDir, { recursive: true });
    } catch {}

    const cleanId = primaryIdGuia.replace(/[^A-Z0-9_-]/gi, '');
    const now = Date.now();

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const extension = file.type.includes('png') ? 'png' : (file.type.includes('webp') ? 'webp' : 'jpg');
      const fileName = `comprobante_${cleanId}_${i}_${now}.${extension}`;
      const pubUrl = `/uploads/comprobantes/${fileName}`;
      publicUrls.push(pubUrl);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = extension === 'png' ? 'image/png' : (extension === 'webp' ? 'image/webp' : 'image/jpeg');
      const b64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
      base64List.push(b64);

      try {
        await fs.writeFile(path.join(uploadDir, fileName), buffer);
        await fs.writeFile(path.join(distUploadDir, fileName), buffer);
      } catch (fsErr) {
        console.warn('[FS Warning]: Usando base64 en PostgreSQL para comprobante.', fsErr);
      }
    }

    let publicUrl: string | null = publicUrls.length > 0 ? publicUrls.join(',') : null;
    let comprobanteBase64: string | null = base64List.length > 1 
      ? JSON.stringify(base64List) 
      : (base64List.length === 1 ? base64List[0] : null);

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
