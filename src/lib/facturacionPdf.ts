import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ENVIAS_LOGO_BASE64 } from './logoBase64';

export interface FacturacionItem {
  destinatario: string;
  ciudad: string;
  guias: string;
  piezas: number;
  pies_cubicos: number;
  estado: string;
}

export interface FacturacionCourierGroup {
  courierName: string;
  totalGuias: number;
  totalPiezas: number;
  totalVolumen: number;
  items: FacturacionItem[];
}

export interface FacturacionPdfParams {
  loteLabel: string;
  courierLabel: string;
  fecha: string;
  totalGuias: number;
  totalPiezas: number;
  totalVolumen: number;
  totalCouriers: number;
  courierGroups: FacturacionCourierGroup[];
}

/**
 * Genera y descarga un documento PDF oficial de Facturación y Liquidación
 */
export function downloadFacturacionPdf(params: FacturacionPdfParams, filename: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // ----------------------------------------------------
  // 1. HEADER (LOGO OFICIAL + IDENTIFICACIÓN)
  // ----------------------------------------------------
  try {
    const logoW = 34;
    const logoH = 14;
    doc.addImage(ENVIAS_LOGO_BASE64, 'PNG', margin, currentY - 1, logoW, logoH, undefined, 'FAST');
  } catch (e) {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, currentY, 13, 13, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('EN', margin + 6.5, currentY + 9, { align: 'center' });
  }

  const textX = margin + 37;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ENVÍAS C.A.', textX, currentY + 3.5);

  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('REPORTE OFICIAL DE FACTURACIÓN Y LIQUIDACIÓN', textX, currentY + 7.5);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Hub Central Barquisimeto • Transporte y Encomiendas Nacionales', textX, currentY + 11.5);

  // Cuadro de Metadatos a la derecha
  const metaW = 68;
  const metaH = 16;
  const metaX = pageWidth - margin - metaW;
  const metaY = currentY - 1;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(metaX, metaY, metaW, metaH, 1.5, 1.5, 'FD');

  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', metaX + 2.5, metaY + 4);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(params.fecha || '', metaX + metaW - 2.5, metaY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('LOTE:', metaX + 2.5, metaY + 8.5);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(params.loteLabel || 'Todos', metaX + metaW - 2.5, metaY + 8.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('COURIER:', metaX + 2.5, metaY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(params.courierLabel || 'Todos', metaX + metaW - 2.5, metaY + 13, { align: 'right' });

  currentY += 19;

  // ----------------------------------------------------
  // 2. BANNER DE TOTALES GENERALES
  // ----------------------------------------------------
  const bannerH = 11;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, bannerH, 1.5, 1.5, 'FD');

  const colW = contentWidth / 4;

  // Col 1: Total Guías
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL GUÍAS', margin + colW * 0.5, currentY + 3.5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(String(params.totalGuias), margin + colW * 0.5, currentY + 8.5, { align: 'center' });

  // Col 2: Total Piezas
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PIEZAS', margin + colW * 1.5, currentY + 3.5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(String(params.totalPiezas), margin + colW * 1.5, currentY + 8.5, { align: 'center' });

  // Col 3: Pies Cúbicos
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('VOLUMEN TOTAL', margin + colW * 2.5, currentY + 3.5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(79, 70, 229);
  doc.text(`${params.totalVolumen.toFixed(2)} ft³`, margin + colW * 2.5, currentY + 8.5, { align: 'center' });

  // Col 4: Couriers
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('COURIERS / EMPRESAS', margin + colW * 3.5, currentY + 3.5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(String(params.totalCouriers), margin + colW * 3.5, currentY + 8.5, { align: 'center' });

  currentY += bannerH + 5;

  // ----------------------------------------------------
  // 3. TABLAS POR COURIER
  // ----------------------------------------------------
  params.courierGroups.forEach((group) => {
    // Si queda poco espacio para la cabecera + tabla mínima (~30mm), nueva página
    if (currentY > pageHeight - margin - 35) {
      doc.addPage('letter', 'portrait');
      currentY = margin;
    }

    // Encabezado del Courier
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.roundedRect(margin, currentY, contentWidth, 6.5, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`COURIER: ${group.courierName.toUpperCase()}`, margin + 3, currentY + 4.5);

    const groupMeta = `${group.totalGuias} guía${group.totalGuias !== 1 ? 's' : ''}  |  ${group.totalPiezas} piezas  |  ${group.totalVolumen.toFixed(2)} ft³`;
    doc.setFontSize(7.5);
    doc.text(groupMeta, pageWidth - margin - 3, currentY + 4.5, { align: 'right' });

    currentY += 7.5;

    // Cuerpo de la tabla para este courier
    const tableHead = [['Destinatario / Cliente', 'Ciudad', 'N° Guía(s)', 'Piezas', 'Pies Cúbicos', 'Estado']];
    const tableBody = group.items.map(item => [
      item.destinatario,
      item.ciudad || '—',
      item.guias,
      String(item.piezas),
      `${item.pies_cubicos.toFixed(2)} ft³`,
      item.estado
    ]);

    // Fila de subtotal
    tableBody.push([
      `Subtotal ${group.courierName}`,
      '',
      `${group.totalGuias} guías`,
      String(group.totalPiezas),
      `${group.totalVolumen.toFixed(2)} ft³`,
      ''
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: 'bold',
        fontSize: 6.8,
        lineWidth: 0.2,
        lineColor: [203, 213, 225]
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 32 },
        2: { cellWidth: 40, font: 'courier', fontStyle: 'bold' },
        3: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 23, halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229] },
        5: { cellWidth: 29.9, halign: 'center' }
      },
      didParseCell: (data) => {
        // Fila de subtotal (última fila)
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fillColor = [245, 243, 255]; // Indigo light
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [67, 56, 202];
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  });

  // ----------------------------------------------------
  // 4. RESUMEN FINAL Y FIRMAS
  // ----------------------------------------------------
  const sigH = 26;
  if (currentY > pageHeight - margin - sigH) {
    doc.addPage('letter', 'portrait');
    currentY = margin + 5;
  }

  currentY += 2;

  // Cuadro de Resumen General
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('GRAN TOTAL FACTURACIÓN:', margin + 4, currentY + 4.8);

  const grandTotalStr = `${params.totalGuias} Guías  |  ${params.totalPiezas} Piezas  |  ${params.totalVolumen.toFixed(2)} Pies Cúbicos (ft³)  |  ${params.totalCouriers} Couriers`;
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text(grandTotalStr, pageWidth - margin - 4, currentY + 4.8, { align: 'right' });

  currentY += 16;

  // Firmas de Aprobación
  const sigW = 65;
  const leftSigX = margin + 20;
  const rightSigX = pageWidth - margin - 20 - sigW;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.35);
  doc.line(leftSigX, currentY, leftSigX + sigW, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Administración / Facturación', leftSigX + sigW / 2, currentY + 3.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Envías C.A. • Sello Oficial', leftSigX + sigW / 2, currentY + 7, { align: 'center' });

  doc.line(rightSigX, currentY, rightSigX + sigW, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Representante Courier / Cliente', rightSigX + sigW / 2, currentY + 3.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Conforme con guías, piezas y volumen', rightSigX + sigW / 2, currentY + 7, { align: 'center' });

  // ----------------------------------------------------
  // 5. PIE DE PÁGINA EN TODAS LAS HOJAS
  // ----------------------------------------------------
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - margin - 2, pageWidth - margin, pageHeight - margin - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Envías C.A. • Reporte Oficial de Facturación y Liquidación • Pág. ${i} de ${totalPages}`, margin, pageHeight - margin + 2);
    doc.text('Documento Oficial de Liquidación y Auditoría Logística', pageWidth - margin, pageHeight - margin + 2, { align: 'right' });
  }

  doc.save(filename);
}
