import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

export type InvoiceTemplate = 'classic' | 'modern';

export interface InvoiceOrder {
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  subtotalAoa: number;
  discountAoa: number;
  totalAoa: number;
  exchangeRate: number;
  status: string;
  paymentStatus: string;
}

export interface InvoiceItem {
  name: string;
  imageUrl?: string | null;
  unitPriceAoa: number;
  quantity: number;
  subtotalAoa: number;
}

const orange = '#cd3d0f';
const navy = '#081018';
const grey = '#66717d';
const light = '#eef1f5';

function money(value: number): string {
  return `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))} Kz`;
}

function date(value: Date | string): string {
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'long' }).format(new Date(value));
}

function imagePath(imageUrl: string | null | undefined, root: string): string | null {
  if (!imageUrl) return null;
  const candidate = path.join(root, 'public', imageUrl.replace(/^\//, ''));
  return fs.existsSync(candidate) ? candidate : null;
}

export async function createInvoicePdf(order: InvoiceOrder, items: InvoiceItem[], template: InvoiceTemplate, root: string): Promise<Buffer> {
  const document = new PDFDocument({ size: 'A4', margin: 42, info: { Title: `Fatura ${order.orderNumber}`, Author: 'GameAO' } });
  const chunks: Buffer[] = [];
  document.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => { document.on('end', () => resolve(Buffer.concat(chunks))); document.on('error', reject); });
  const width = document.page.width - document.page.margins.left - document.page.margins.right;
  const logo = path.join(root, 'public', 'assets', 'gameao-logo.png');

  if (template === 'modern') {
    document.rect(0, 0, document.page.width, 112).fill(navy);
    if (fs.existsSync(logo)) document.image(logo, 42, 20, { fit: [145, 70], valign: 'center' });
    else document.fillColor('#ffffff').fontSize(27).font('Helvetica-Bold').text('GameAO', 42, 38);
    document.fillColor('#ffffff').fontSize(9).font('Helvetica').text('LOJA DE VIDEOJOGOS · ANGOLA', 42, 76);
    document.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('FATURA', 390, 38, { align: 'right', width: 160 });
    document.fontSize(9).font('Helvetica').text(order.orderNumber, 390, 68, { align: 'right', width: 160 });
    document.fillColor(navy);
  } else {
    if (fs.existsSync(logo)) document.image(logo, 42, 24, { fit: [145, 70], valign: 'center' });
    else document.fillColor(navy).fontSize(28).font('Helvetica-Bold').text('GameAO', 42, 44);
    document.fillColor(grey).fontSize(9).font('Helvetica').text('Loja de videojogos em Angola', 42, 78);
    document.fillColor(navy).fontSize(21).font('Helvetica-Bold').text('FATURA', 390, 48, { align: 'right', width: 160 });
    document.fontSize(9).font('Helvetica').text(order.orderNumber, 390, 78, { align: 'right', width: 160 });
  }

  let y = template === 'modern' ? 144 : 132;
  document.fillColor(navy).fontSize(10).font('Helvetica-Bold').text('DADOS DA LOJA', 42, y);
  document.font('Helvetica').fontSize(9).fillColor(grey).text('GameAO · Angola', 42, y + 18).text('Email: suporte@gameao.ao', 42, y + 32).text('Moeda: Kwanza (Kz)', 42, y + 46);
  document.fillColor(navy).font('Helvetica-Bold').text('DADOS DO CLIENTE', 315, y);
  document.font('Helvetica').fontSize(9).fillColor(grey).text(order.customerName, 315, y + 18).text(order.customerEmail, 315, y + 32).text(order.customerPhone, 315, y + 46);
  if (order.billingAddress || order.billingCity) document.text([order.billingAddress, order.billingCity, order.billingProvince].filter(Boolean).join(', '), 315, y + 60, { width: 230 });
  y += 100;

  document.fillColor(navy).font('Helvetica-Bold').fontSize(10).text(`Data de emissão: ${date(order.createdAt)}`, 42, y);
  document.font('Helvetica').fontSize(9).fillColor(grey).text(`Taxa aplicada: 1 USD = ${money(order.exchangeRate)}`, 315, y, { width: 230, align: 'right' });
  y += 26;
  document.rect(42, y, width, 26).fill(template === 'modern' ? orange : navy);
  document.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('PRODUTO', 52, y + 8).text('QTD.', 350, y + 8).text('PREÇO', 405, y + 8).text('TOTAL', 484, y + 8);
  y += 26;
  for (const item of items) {
    if (y > 695) { document.addPage(); y = 48; }
    document.rect(42, y, width, 43).fill('#ffffff').stroke(light);
    const img = imagePath(item.imageUrl, root);
    if (img) document.image(img, 50, y + 5, { fit: [34, 34] });
    document.fillColor(navy).font('Helvetica').fontSize(9).text(item.name, img ? 94 : 52, y + 15, { width: 235, ellipsis: true });
    document.text(String(item.quantity), 350, y + 15).text(money(item.unitPriceAoa), 405, y + 15).font('Helvetica-Bold').text(money(item.subtotalAoa), 484, y + 15);
    y += 43;
  }
  y += 20;
  document.fillColor(grey).font('Helvetica').fontSize(10).text('Subtotal', 385, y).fillColor(navy).text(money(order.subtotalAoa), 484, y);
  if (order.discountAoa > 0) { y += 18; document.fillColor(grey).text('Desconto', 385, y).fillColor('#2e9e5b').text(`− ${money(order.discountAoa)}`, 484, y); }
  y += 26;
  document.rect(370, y - 7, 154, 34).fill(template === 'modern' ? navy : orange);
  document.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text('TOTAL', 382, y + 4).text(money(order.totalAoa), 450, y + 4, { width: 66, align: 'right' });
  y += 68;
  document.fillColor(grey).font('Helvetica').fontSize(9).text(`Estado do pedido: ${order.status} · Pagamento: ${order.paymentStatus}`, 42, y);
  document.text('Obrigado por comprar na GameAO.', 42, y + 22);
  document.end();
  return done;
}
