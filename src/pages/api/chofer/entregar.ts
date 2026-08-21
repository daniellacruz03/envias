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
    const id_guia = (formData.get('id_guia') || '').toString().trim().toUpperCase();
    const recibido_por = (formData.get('recibido_por') || '').toString().trim();
    const foto = formData.get('foto') as File | null;

    if (!id_guia) {
      return new Response(JSON.stringify({
        success: false,
        message: 'El número de guía es obligatorio.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!foto || !(foto instanceof File) || foto.size === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'La foto del comprobante de entrega es obligatoria sin excepción.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Crear directorio de almacenamiento si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');
    await fs.mkdir(uploadDir, { recursive: true });

    // 4. Generar nombre de archivo único y guardar
    const extension = foto.type.includes('png') ? 'png' : (foto.type.includes('webp') ? 'webp' : 'jpg');
    const cleanId = id_guia.replace(/[^A-Z0-9_-]/gi, '');
    const fileName = `comprobante_${cleanId}_${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    const arrayBuffer = await foto.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/comprobantes/${fileName}`;

    // 5. Actualizar en PostgreSQL
    const updateResult = await query(`
      UPDATE guias
      SET 
        estado = 'Entregado',
        comprobante_url = $1,
        recibido_por = $2
      WHERE id_guia = $3
      RETURNING *
    `, [publicUrl, recibido_por || null, id_guia]);

    if (updateResult.rowCount === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: `Guía #${id_guia} no encontrada en la base de datos.`
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const guiaActualizada = updateResult.rows[0];

    console.log('[ENTREGA CONFIRMADA]:', {
      id_guia,
      chofer_id: user.id,
      comprobante_url: publicUrl,
      peso_bytes: buffer.length
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Entrega confirmada y comprobante guardado con éxito.',
      data: guiaActualizada
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
