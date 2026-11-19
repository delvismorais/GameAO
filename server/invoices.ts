import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

export type InvoiceTemplate = 'classic' | 'modern';

export interface InvoiceSite {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  tagline?: string;
  legalName?: string;
  nif?: string;
  website?: string;
}

export interface InvoiceOrder {
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  deliveryAddress?: string | null;
  deliveryDate?: Date | string | null;
  shippingAoa: number;
  paymentMethod?: string | null;
  subtotalAoa: number;
  discountAoa: number;
  totalAoa: number;
  exchangeRate: number;
  status: string;
  paymentStatus: string;
  site?: InvoiceSite;
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
const white = '#ffffff';
const defaultSite: InvoiceSite = {
  name: 'GameAO', email: 'geral@gameao.shop', phone: '973 929 712',
  whatsapp: '244973929712', location: 'Luanda, Angola', tagline: 'A sua loja de videojogos em Angola.',
  legalName: 'MORÁSIO DIGITAL', nif: '5002678500', website: 'gameao.shop',
};

function money(value: number): string {
  const amount = Number(value);
  return `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)} Kz`;
}

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'A aguardar pagamento', payment_verification: 'Comprovativo em verificação',
  payment_confirmed: 'Pagamento confirmado', processing: 'Em processamento',
  ready_for_delivery: 'Pronta para entrega', completed: 'Concluída', cancelled: 'Cancelada', refunded: 'Reembolsada',
};
const PAYMENT_LABELS: Record<string, string> = { paid: 'Pago', pending: 'Pendente', failed: 'Falhou', refunded: 'Reembolsado' };

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'long' }).format(parsed);
}

function localPublicImage(imageUrl: string | null | undefined, root: string): string | null {
  if (!imageUrl || /^[a-z][a-z0-9+.-]*:/i.test(imageUrl) || imageUrl.includes('\\')) return null;
  const relative = imageUrl.replace(/^\/+/, '');
  const publicRoot = path.resolve(root, 'public');
  const candidate = path.resolve(publicRoot, relative);
  if (candidate === publicRoot || !candidate.startsWith(`${publicRoot}${path.sep}`)) return null;
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : null;
}

export async function createInvoicePdf(order: InvoiceOrder, items: InvoiceItem[], template: InvoiceTemplate, root: string): Promise<Buffer> {
  const document = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Fatura ${order.orderNumber}`, Author: 'GameAO — MORÁSIO DIGITAL', Subject: `Fatura da encomenda ${order.orderNumber}` } });
  const chunks: Buffer[] = [];
  document.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  const site = { ...defaultSite, ...(order.site ?? {}) };
  const pageWidth = document.page.width;
  const pageHeight = document.page.height;
  const left = 42;
  const right = pageWidth - 42;
  const width = right - left;
  const footerY = pageHeight - 34;
  const contentBottom = pageHeight - 58;
  const logo = path.join(root, 'public', 'assets', 'gameao-logo.png');
  const logoExists = fs.existsSync(logo);
  let pageNumber = 1;
  let y = 0;

  const drawBrand = (firstPage: boolean) => {
    if (template === 'modern' && firstPage) {
      document.rect(0, 0, pageWidth, 100).fill(navy);
      if (logoExists) document.image(logo, left, 17, { fit: [150, 62] });
      else document.fillColor(white).font('Helvetica-Bold').fontSize(26).text(site.name, left, 32, { width: 250 });
      document.fillColor('#d4dbe2').font('Helvetica').fontSize(8.5).text((site.tagline || 'Loja de videojogos em Angola').toUpperCase(), left, 76, { width: 300 });
      document.fillColor(white).font('Helvetica-Bold').fontSize(20).text('FATURA', right - 160, 29, { width: 160, align: 'right' });
      document.font('Helvetica-Bold').fontSize(20).text(order.orderNumber, right - 160, 56, { width: 160, align: 'right', lineBreak: false });
      document.fillColor(navy);
    } else {
      if (firstPage) {
        if (logoExists) document.image(logo, left, 20, { fit: [150, 60] });
        else document.fillColor(navy).font('Helvetica-Bold').fontSize(26).text(site.name, left, 30, { width: 250 });
        document.fillColor(grey).font('Helvetica').fontSize(8.5).text(site.tagline || 'Loja de videojogos em Angola', left, 78, { width: 310 });
        document.fillColor(navy).font('Helvetica-Bold').fontSize(20).text('FATURA', right - 160, 28, { width: 160, align: 'right' });
        document.font('Helvetica-Bold').fontSize(20).text(order.orderNumber, right - 160, 55, { width: 160, align: 'right', lineBreak: false });
      } else {
        document.rect(0, 0, pageWidth, 7).fill(template === 'modern' ? orange : navy);
        document.fillColor(navy).font('Helvetica-Bold').fontSize(11).text(site.name, left, 22, { width: 240 });
        document.fillColor(grey).font('Helvetica-Bold').fontSize(11).text(`FATURA · ${order.orderNumber}`, right - 230, 22, { width: 230, align: 'right', lineBreak: false });
      }
    }
  };

  const drawFooter = () => {
    document.save();
    document.moveTo(left, footerY - 7).lineTo(right, footerY - 7).lineWidth(0.6).stroke(light);
    document.fillColor(grey).font('Helvetica').fontSize(7.5)
      .text(`${site.name} · ${site.website || 'gameao.shop'} · ${site.email} · ${site.phone} · ${site.location}`, left, footerY, { width: width - 65, lineBreak: false, ellipsis: true })
      .text(`Página ${pageNumber}`, right - 60, footerY, { width: 60, align: 'right', lineBreak: false });
    document.restore();
  };

  const drawTableHeader = () => {
    document.rect(left, y, width, 25).fill(template === 'modern' ? orange : navy);
    document.fillColor(white).font('Helvetica-Bold').fontSize(8.3)
      .text('PRODUTO', left + 10, y + 8, { width: 260 })
      .text('QTD.', 338, y + 8, { width: 40, align: 'right' })
      .text('PREÇO UNIT.', 383, y + 8, { width: 78, align: 'right' })
      .text('TOTAL', 466, y + 8, { width: 80, align: 'right' });
    y += 25;
  };

  const nextPage = () => {
    drawFooter();
    document.addPage({ size: 'A4', margin: 0 });
    pageNumber += 1;
    drawBrand(false);
    y = 87;
    drawTableHeader();
  };

  const drawInfoCard = (x: number, top: number, cardWidth: number, title: string, lines: string[]): number => {
    const content = lines.filter(Boolean).join('\n');
    document.font('Helvetica').fontSize(8.5);
    const textHeight = Math.max(18, document.heightOfString(content || '—', { width: cardWidth - 24, lineGap: 2 }));
    const cardHeight = textHeight + 39;
    document.roundedRect(x, top, cardWidth, cardHeight, 4).fillAndStroke('#f8f9fb', light);
    document.fillColor(orange).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), x + 12, top + 11, { width: cardWidth - 24 });
    document.fillColor(navy).font('Helvetica').fontSize(8.5).text(content || '—', x + 12, top + 25, { width: cardWidth - 24, lineGap: 2 });
    return cardHeight;
  };

  drawBrand(true);
  y = template === 'modern' ? 118 : 108;
  const cardGap = 14;
  const cardWidth = (width - cardGap) / 2;
  const customerAddress = [order.billingAddress, order.billingCity, order.billingProvince].filter(Boolean).join(', ');
  const storeLines = [site.name, site.legalName ? `Entidade empresarial: ${site.legalName}` : '', site.nif ? `NIF: ${site.nif}` : '', site.website ? `Website: ${site.website}` : '', site.email, site.phone ? `Telefone: ${site.phone}` : '', site.whatsapp ? `WhatsApp: ${site.whatsapp}` : '', site.location];
  const customerLines = [order.customerName, order.customerEmail, order.customerPhone ? `Telefone: ${order.customerPhone}` : '', customerAddress ? `Morada: ${customerAddress}` : ''];
  const cardHeight = Math.max(
    drawInfoCard(left, y, cardWidth, 'Dados da loja', storeLines),
    drawInfoCard(left + cardWidth + cardGap, y, cardWidth, 'Faturado a', customerLines),
  );
  y += cardHeight + 14;

  const details = [
    `Data de emissão: ${formatDate(order.createdAt)}`,
    `Estado: ${STATUS_LABELS[order.status] ?? order.status} · Pagamento: ${PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}`,
    order.paymentMethod ? `Método de pagamento: ${order.paymentMethod}` : '',
    `Taxa aplicada: 1 USD = ${money(order.exchangeRate)}`,
  ].filter(Boolean).join('   |   ');
  document.fillColor(grey).font('Helvetica').fontSize(8.2).text(details, left, y, { width, lineGap: 2 });
  y += Math.max(19, document.heightOfString(details, { width, lineGap: 2 })) + 12;
  drawTableHeader();

  const rows = items.length ? items : [{ name: 'Sem itens registados', quantity: 0, unitPriceAoa: 0, subtotalAoa: 0 }];
  for (const item of rows) {
    const image = localPublicImage(item.imageUrl, root);
    const productX = image ? left + 52 : left + 10;
    const productWidth = image ? 234 : 276;
    let itemName = String(item.name || 'Produto').replace(/\s+/g, ' ').trim().slice(0, 600);
    document.fillColor(navy).font('Helvetica').fontSize(8.6);
    const maxNameHeight = contentBottom - 112 - 20;
    let nameHeight = document.heightOfString(itemName, { width: productWidth, lineGap: 2 });
    if (nameHeight > maxNameHeight) {
      let low = 0;
      let high = itemName.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        const candidate = `${itemName.slice(0, middle).trimEnd()}…`;
        if (document.heightOfString(candidate, { width: productWidth, lineGap: 2 }) <= maxNameHeight) low = middle;
        else high = middle - 1;
      }
      itemName = `${itemName.slice(0, low).trimEnd()}…`;
      nameHeight = document.heightOfString(itemName, { width: productWidth, lineGap: 2 });
    }
    const rowHeight = Math.max(42, nameHeight + 14);
    if (y + rowHeight > contentBottom - 150) nextPage();

    document.rect(left, y, width, rowHeight).fill(white).stroke(light);
    if (image) {
      try { document.image(image, left + 9, y + 5, { fit: [34, 34], align: 'center', valign: 'center' }); } catch { /* imagem local inválida: mantém a linha sem miniatura */ }
    }
    document.fillColor(navy).font('Helvetica').fontSize(8.6).text(itemName, productX, y + Math.max(8, (rowHeight - nameHeight) / 2), { width: productWidth, lineGap: 2 });
    document.font('Helvetica').fontSize(8.3).text(String(item.quantity), 338, y + 15, { width: 40, align: 'right', lineBreak: false });
    document.text(money(item.unitPriceAoa), 383, y + 15, { width: 78, align: 'right', lineBreak: false });
    document.font('Helvetica-Bold').text(money(item.subtotalAoa), 466, y + 15, { width: 80, align: 'right', lineBreak: false });
    y += rowHeight;
  }

  const totalLines = 1 + Number(order.shippingAoa > 0) + Number(order.discountAoa > 0);
  const totalsHeight = totalLines * 19 + 48;
  if (y + totalsHeight > contentBottom - 45) nextPage();
  y += 16;
  const totalX = right - 205;
  const drawTotalLine = (label: string, value: string, color = navy, bold = false) => {
    document.fillColor(grey).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.7).text(label, totalX + 10, y, { width: 95 });
    document.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.7).text(value, totalX + 98, y, { width: 97, align: 'right' });
    y += 19;
  };
  drawTotalLine('Subtotal', money(order.subtotalAoa));
  if (order.shippingAoa > 0) drawTotalLine('Entrega', money(order.shippingAoa));
  if (order.discountAoa > 0) drawTotalLine('Desconto', `− ${money(order.discountAoa)}`, '#25834b');
  y += 3;
  document.roundedRect(totalX, y, 205, 34, 4).fill(template === 'modern' ? navy : orange);
  document.fillColor(white).font('Helvetica-Bold').fontSize(10).text('TOTAL', totalX + 11, y + 11, { width: 74 });
  document.fontSize(10).text(money(order.totalAoa), totalX + 80, y + 11, { width: 114, align: 'right', lineBreak: false });
  y += 49;

  const delivery = [
    order.deliveryAddress ? `Morada de entrega: ${order.deliveryAddress}` : '',
    order.deliveryDate ? `Data prevista: ${formatDate(order.deliveryDate)}` : '',
  ].filter(Boolean).join('   ·   ');
  const closing = [delivery, 'Obrigado por comprar na GameAO.'].filter(Boolean).join('\n');
  const closingHeight = document.heightOfString(closing, { width, lineGap: 3 });
  if (y + closingHeight > contentBottom - 10) nextPage();
  document.fillColor(grey).font('Helvetica').fontSize(8.5).text(closing, left, y, { width, lineGap: 3 });

  drawFooter();
  document.end();
  return done;
}
