import { jsPDF } from 'jspdf';
import type { Order } from '../types';

export function generateInvoice(order: Order, paymentMethod: string, includeTax: boolean) {
  const cleanId = order.id.replace('ord-', '').toUpperCase();
  const invoiceNumber = `FAC-${cleanId}`;

  const subtotalBruto = order.total;
  const taxRate = 0.08;
  const taxAmount = includeTax ? subtotalBruto * taxRate : 0;
  const finalTotal = subtotalBruto + taxAmount;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('Cafe Pandora - Bistro Cafe Bar', 105, 25, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Experiencia Culinaria Unica & Cocteleria de Autor', 105, 31, { align: 'center' });

  doc.setDrawColor(214, 108, 80);
  doc.setLineWidth(0.8);
  doc.line(20, 36, 190, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA FACTURA:', 20, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`Factura N°: ${invoiceNumber}`, 20, 51);
  doc.text(`Fecha de Emision: ${new Date().toLocaleDateString('es-ES')}`, 20, 56);
  doc.text(`Hora de Registro: ${order.timestamp}`, 20, 61);

  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DE SERVICIO:', 120, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mesa Asignada: Mesa ${order.tableId}`, 120, 51);
  doc.text(`Mesero Atendiendo: ${order.waiterName}`, 120, 56);
  doc.text(`Metodo de Pago: ${paymentMethod.toUpperCase()}`, 120, 61);

  doc.setFillColor(248, 250, 252);
  doc.rect(20, 72, 170, 8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 72, 190, 72);
  doc.line(20, 80, 190, 80);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Descripcion Producto', 25, 77);
  doc.text('Cant.', 115, 77, { align: 'center' });
  doc.text('Precio Unit.', 145, 77, { align: 'center' });
  doc.text('Importe Total', 180, 77, { align: 'center' });

  let y = 86;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  order.items.forEach((item) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.text(item.name.toUpperCase(), 25, y);
    doc.text(`${item.quantity}`, 115, y, { align: 'center' });
    doc.text(`$${item.price.toLocaleString('es-CO')}`, 145, y, { align: 'center' });
    const itemSubtotal = item.price * item.quantity;
    doc.text(`$${itemSubtotal.toLocaleString('es-CO')}`, 180, y, { align: 'center' });
    doc.setDrawColor(241, 245, 249);
    doc.line(20, y + 2, 190, y + 2);
    y += 8;
  });

  y += 4;
  doc.setDrawColor(214, 108, 80);
  doc.setLineWidth(0.5);
  doc.line(110, y, 190, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('SUBTOTAL BRUTO:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${subtotalBruto.toLocaleString('es-CO')}`, 180, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('IMPUESTO CONSUMO (8%):', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${taxAmount.toLocaleString('es-CO')}`, 180, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('I.V.A. TRASLADADO (0%):', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text('$0', 180, y, { align: 'center' });

  y += 7;
  doc.setFillColor(254, 243, 199);
  doc.rect(110, y - 4, 80, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(146, 64, 14);
  doc.text('TOTAL FACTURADO:', 115, y + 1);
  doc.text(`$${finalTotal.toLocaleString('es-CO')}`, 180, y + 1, { align: 'center' });

  y = Math.max(y + 25, 250);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Esta es una reproduccion digital de comanda de facturacion de Cafe Pandora.', 105, y + 5, { align: 'center' });
  doc.text('Gracias por su visita al Bistro Cafe Bar! Le esperamos pronto.', 105, y + 9, { align: 'center' });

  doc.save(`Factura-${invoiceNumber}-Mesa${order.tableId}.pdf`);
}

export function generateKitchenReceipt(order: Order, turnNumber: number) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] });

  doc.setFont('helvetica', 'normal');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('COMANDA DE COCINA', 40, 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('CAFÉ PANDORA', 40, 17, { align: 'center' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(5, 21, 75, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`MESA: ${order.tableId}`, 5, 27);
  doc.text(`TURNO: #${turnNumber}`, 50, 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Comanda N°: ${order.id.toUpperCase()}`, 5, 33);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 5, 38);
  doc.text(`Hora: ${order.timestamp}`, 5, 43);
  doc.text(`Atendió: ${order.waiterName}`, 5, 48);

  doc.line(5, 52, 75, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PRODUCTO', 5, 57);
  doc.text('CANTIDAD', 55, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let y = 63;

  order.items.forEach((item) => {
    if (y > 140) { doc.addPage(); y = 15; }
    doc.text(item.name.toUpperCase(), 5, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`x${item.quantity}`, 60, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });

  doc.line(5, y + 2, 75, y + 2);
  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('* Solo preparacion en cocina *', 40, y, { align: 'center' });

  doc.save(`ComandaCocina-Mesa${order.tableId}-${order.id.slice(-4)}.pdf`);
}
