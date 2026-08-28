import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ENVIAS_LOGO_BASE64 } from './logoBase64';

export interface ListinGuiaItem {
  id_guia: string;
  piezas: number;
  pies_cubicos?: number | string | null;
  ciudad_destino?: string | null;
  destinatario?: string | null;
  [key: string]: any;
}

export interface GenerateListinParams {
  cityName: string;
  zoneGuias: ListinGuiaItem[];
  driverName: string;
  placa: string;
  fecha: string;
  totalGuias?: number;
  totalPiezas?: number;
  totalVolumen?: number;
  totalZonas?: number;
}

/**
 * Agrega una hoja oficial de listín de despacho a un documento jsPDF
 */
export function renderListinSheetToDoc(
  doc: jsPDF,
  params: GenerateListinParams,
  sheetGuias: ListinGuiaItem[],
  pageNumber: number,
  totalPages: number,
  isFirstOverallPage: boolean
) {
  const { cityName, driverName, placa, fecha, totalGuias, totalPiezas, totalVolumen, totalZonas } = params;

  if (!isFirstOverallPage) {
    doc.addPage('letter', 'portrait');
  }

  // Dimensiones en mm (Letter: 215.9 x 279.4 mm)
  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  // ----------------------------------------------------
  // 1. HEADER (LOGO OFICIAL + IDENTIFICACIÓN)
  // ----------------------------------------------------
  // Logo Oficial de Envías C.A.
  try {
    const logoW = 32;
    const logoH = 13.16; // aspect ratio 360/148 = 2.43
    doc.addImage(ENVIAS_LOGO_BASE64, 'PNG', margin, margin - 0.5, logoW, logoH, undefined, 'FAST');
  } catch (e) {
    // Fallback
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, margin, 12, 12, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('EN', margin + 6, margin + 8.5, { align: 'center' });
  }

  // Título de Empresa y Subtítulos
  const textX = margin + 34;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ENVÍAS C.A.', textX, margin + 4.5);

  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('TRANSPORTE Y ENCOMIENDAS', textX, margin + 8);

  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Hub Central Barquisimeto • Entregas Nacionales', textX, margin + 11.5);

  // ----------------------------------------------------
  // 2. CUADRO DE METADATOS (DERECHA SUPERIOR)
  // ----------------------------------------------------
  const metaW = 68;
  const metaH = 14;
  const metaX = pageWidth - margin - metaW;
  const metaY = margin;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(metaX, metaY, metaW, metaH, 'FD');

  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', metaX + 2, metaY + 3.2);
  doc.setFont('courier', 'bold');
  doc.text(fecha || '', metaX + metaW - 2, metaY + 3.2, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(metaX + 1, metaY + 4.2, metaX + metaW - 1, metaY + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.text('PLACA:', metaX + 2, metaY + 7);
  doc.setFont('courier', 'bold');
  doc.text(placa || 'NO ASIGNADA', metaX + metaW - 2, metaY + 7, { align: 'right' });

  doc.line(metaX + 1, metaY + 8, metaX + metaW - 1, metaY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('CHOFER:', metaX + 2, metaY + 10.5);
  doc.setFont('helvetica', 'normal');
  const cleanDriver = (driverName || 'FLOTA CENTRAL').length > 22 
    ? (driverName || 'FLOTA CENTRAL').substring(0, 22) + '..' 
    : (driverName || 'FLOTA CENTRAL');
  doc.text(cleanDriver, metaX + metaW - 2, metaY + 10.5, { align: 'right' });

  doc.line(metaX + 1, metaY + 11.5, metaX + metaW - 1, metaY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('DESTINO/ZONA:', metaX + 2, metaY + 13.5);
  doc.setFont('courier', 'bold');
  const cleanDestino = (cityName || 'TODAS').toUpperCase();
  const truncatedDestino = cleanDestino.length > 20 ? cleanDestino.substring(0, 20) + '..' : cleanDestino;
  doc.text(truncatedDestino, metaX + metaW - 2, metaY + 13.5, { align: 'right' });

  // ----------------------------------------------------
  // 3. BARRA DE TÍTULO PRINCIPAL
  // ----------------------------------------------------
  const titleY = margin + 16;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(margin, titleY, contentWidth, 6, 'FD');

  const volTag = (totalVolumen && totalVolumen > 0) ? `, ${totalVolumen.toFixed(2)} FT³` : '';
  const pageTag = totalPages > 1 ? ` • Pág. ${pageNumber} de ${totalPages}` : '';
  const titleText = `LISTÍN DE CARGA Y DESPACHO DE GUÍAS • DESTINO: ${cityName.toUpperCase()} (${totalGuias || sheetGuias.length} GUÍAS, ${totalPiezas || sheetGuias.length} PZAS${volTag})${pageTag}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(titleText, pageWidth / 2, titleY + 4.2, { align: 'center' });

  // ----------------------------------------------------
  // 4. TABLA DUAL (8 COLUMNAS, 20 FILAS FIJAS)
  // ----------------------------------------------------
  const ROWS_PER_PAGE = 20;
  const half = Math.ceil(sheetGuias.length / 2);
  const leftGuias = sheetGuias.slice(0, half);
  const rightGuias = sheetGuias.slice(half);

  const tableHead = [['NRO DE GUIA', 'PIEZAS', 'FT³', 'DESTINO', 'NRO DE GUIA', 'PIEZAS', 'FT³', 'DESTINO']];
  const tableBody: (string | number)[][] = [];

  for (let i = 0; i < ROWS_PER_PAGE; i++) {
    const left = leftGuias[i];
    const right = rightGuias[i];

    const leftId = left ? left.id_guia : '';
    const leftPzas = left ? (left.piezas || 1) : '';
    const leftFt = left && left.pies_cubicos ? Number(left.pies_cubicos).toFixed(2) : (left ? '-' : '');
    const leftDest = left ? (left.ciudad_destino || '').toUpperCase() : '';

    const rightId = right ? right.id_guia : '';
    const rightPzas = right ? (right.piezas || 1) : '';
    const rightFt = right && right.pies_cubicos ? Number(right.pies_cubicos).toFixed(2) : (right ? '-' : '');
    const rightDest = right ? (right.ciudad_destino || '').toUpperCase() : '';

    tableBody.push([leftId, leftPzas, leftFt, leftDest, rightId, rightPzas, rightFt, rightDest]);
  }

  // Anchos exactos para sumar contentWidth (199.9 mm):
  // 26 + 13 + 14 + 46.95 + 26 + 13 + 14 + 46.95 = 199.9 mm
  const colWidths = [26, 13, 14, 46.95, 26, 13, 14, 46.95];

  autoTable(doc, {
    startY: titleY + 7.5,
    margin: { left: margin, right: margin },
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    styles: {
      font: 'courier',
      fontSize: 7.2,
      cellPadding: { top: 1.3, bottom: 1.3, left: 1, right: 1 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.18,
      valign: 'middle'
    },
    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fontSize: 6.5,
      fillColor: [226, 232, 240], // #e2e8f0
      textColor: [0, 0, 0],
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: colWidths[0] },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: colWidths[1] },
      2: { halign: 'center', cellWidth: colWidths[2] },
      3: { halign: 'left', font: 'helvetica', fontStyle: 'bold', cellWidth: colWidths[3], overflow: 'ellipsize' },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: colWidths[4] },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: colWidths[5] },
      6: { halign: 'center', cellWidth: colWidths[6] },
      7: { halign: 'left', font: 'helvetica', fontStyle: 'bold', cellWidth: colWidths[7], overflow: 'ellipsize' }
    },
    didDrawCell: (data) => {
      // Línea divisoria central más gruesa entre tabla izquierda y derecha
      if (data.column.index === 3) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.45);
        doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 2.5;

  // ----------------------------------------------------
  // 5. RESUMEN DE TOTALES
  // ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(margin, finalY, contentWidth, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(0, 0, 0);

  const tg = totalGuias !== undefined ? totalGuias : sheetGuias.length;
  const tp = totalPiezas !== undefined ? totalPiezas : sheetGuias.reduce((a, b) => a + (b.piezas || 1), 0);
  const tv = totalVolumen !== undefined ? totalVolumen : sheetGuias.reduce((a, b) => a + (Number(b.pies_cubicos) || 0), 0);
  const tz = totalZonas !== undefined ? totalZonas : 1;

  const totalsString = `TOTAL GUÍAS: ${tg}     |     TOTAL PIEZAS: ${tp}     |     TOTAL VOLUMEN: ${tv.toFixed(2)} ft³     |     TOTAL ZONAS: ${tz}`;
  doc.text(totalsString, margin + 4, finalY + 4.2);

  // ----------------------------------------------------
  // 6. FIRMAS DE CONFORMIDAD
  // ----------------------------------------------------
  const sigY = finalY + 11;
  const sigWidth = 60;

  // Firma Despacho (Izquierda)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(margin + 20, sigY, margin + 20 + sigWidth, sigY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma Despacho / Almacén', margin + 20 + sigWidth / 2, sigY + 3.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Envías C.A. - Logística Central', margin + 20 + sigWidth / 2, sigY + 6.5, { align: 'center' });

  // Firma Chofer (Derecha)
  const rightSigX = pageWidth - margin - 20 - sigWidth;
  doc.setDrawColor(0, 0, 0);
  doc.line(rightSigX, sigY, rightSigX + sigWidth, sigY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Firma Chofer Receptor', rightSigX + sigWidth / 2, sigY + 3.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Conforme con bultos y guías físicas', rightSigX + sigWidth / 2, sigY + 6.5, { align: 'center' });

  // ----------------------------------------------------
  // 7. PIE DE PÁGINA & CÓDIGO DE BARRAS
  // ----------------------------------------------------
  const footY = pageHeight - margin + 1;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(margin, footY - 3, pageWidth - margin, footY - 3);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Envías C.A. • Sistema Oficial de Despacho y Logística${pageTag}`, margin, footY);

  doc.setFont('courier', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('||| | | |||| | ||||| || |  7 599187 000185', pageWidth - margin, footY, { align: 'right' });
}

/**
 * Genera y descarga el PDF de una zona o grupo de zonas
 */
export function downloadListinPdf(params: GenerateListinParams, filename: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const MAX_PER_PAGE = 40;
  const totalSheets = Math.max(1, Math.ceil(params.zoneGuias.length / MAX_PER_PAGE));

  for (let sheetIdx = 0; sheetIdx < totalSheets; sheetIdx++) {
    const sheetGuias = params.zoneGuias.slice(sheetIdx * MAX_PER_PAGE, (sheetIdx + 1) * MAX_PER_PAGE);
    renderListinSheetToDoc(
      doc,
      params,
      sheetGuias,
      sheetIdx + 1,
      totalSheets,
      sheetIdx === 0
    );
  }

  doc.save(filename);
}

/**
 * Genera y descarga un PDF multipágina con 1 hoja oficial para cada zona activa
 */
export function downloadAllZonesListinesPdf(
  zonesData: { cityName: string; zoneGuias: ListinGuiaItem[] }[],
  meta: { driverName: string; placa: string; fecha: string },
  filename: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  let isFirstOverallPage = true;
  const MAX_PER_PAGE = 40;

  zonesData.forEach(zd => {
    if (zd.zoneGuias.length === 0) return;
    const totalSheets = Math.max(1, Math.ceil(zd.zoneGuias.length / MAX_PER_PAGE));
    const totalGuias = zd.zoneGuias.length;
    const totalPiezas = zd.zoneGuias.reduce((a, b) => a + (b.piezas || 1), 0);
    const totalVolumen = zd.zoneGuias.reduce((a, b) => a + (Number(b.pies_cubicos) || 0), 0);

    for (let sheetIdx = 0; sheetIdx < totalSheets; sheetIdx++) {
      const sheetGuias = zd.zoneGuias.slice(sheetIdx * MAX_PER_PAGE, (sheetIdx + 1) * MAX_PER_PAGE);
      renderListinSheetToDoc(
        doc,
        {
          cityName: zd.cityName,
          zoneGuias: zd.zoneGuias,
          driverName: meta.driverName,
          placa: meta.placa,
          fecha: meta.fecha,
          totalGuias,
          totalPiezas,
          totalVolumen,
          totalZonas: 1
        },
        sheetGuias,
        sheetIdx + 1,
        totalSheets,
        isFirstOverallPage
      );
      isFirstOverallPage = false;
    }
  });

  doc.save(filename);
}
