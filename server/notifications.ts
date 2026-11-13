import nodemailer from 'nodemailer';
import { getPool } from './db';

export type OrderStatus = 'awaiting_payment' | 'payment_confirmed' | 'processing' | 'ready_for_delivery' | 'completed' | 'cancelled' | 'refunded';

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'A aguardar pagamento',
  payment_confirmed: 'Pagamento confirmado',
  processing: 'Em processamento',
  ready_for_delivery: 'Pronta para entrega',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

function message(orderNumber: string, customerName: string, status: string): string {
  return `Olá ${customerName}, a sua encomenda ${orderNumber} foi atualizada para: ${STATUS_LABELS[status] ?? status}. Consulte o acompanhamento em GameAO e use o seu número de encomenda para ver os detalhes.`;
}

async function logNotification(orderId: number, channel: string, recipient: string, eventType: string, status: string, payload: unknown, errorMessage?: string, providerMessageId?: string) {
  await getPool().execute(`INSERT INTO order_notifications (order_id, channel, recipient, event_type, status, provider_message_id, error_message, payload_json, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, channel, recipient, eventType, status, providerMessageId ?? null, errorMessage ?? null, JSON.stringify(payload), status === 'sent' ? new Date() : null]);
}

async function sendEmail(orderId: number, email: string, orderNumber: string, customerName: string, status: string) {
  const payload = { orderNumber, status };
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_FROM) {
    await logNotification(orderId, 'email', email, 'order_status_changed', 'not_configured', payload, 'SMTP não configurado.');
    return 'not_configured';
  }
  try {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM, to: email, subject: `Atualização da encomenda ${orderNumber} · GameAO`, text: message(orderNumber, customerName, status), html: `<p>${message(orderNumber, customerName, status)}</p>` });
    await logNotification(orderId, 'email', email, 'order_status_changed', 'sent', payload, undefined, info.messageId);
    return 'sent';
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Falha no envio SMTP.';
    await logNotification(orderId, 'email', email, 'order_status_changed', 'failed', payload, reason);
    return 'failed';
  }
}

async function sendWhatsApp(orderId: number, phone: string, orderNumber: string, customerName: string, status: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    await logNotification(orderId, 'whatsapp', phone, 'order_status_changed', 'not_configured', { orderNumber, status }, 'WhatsApp Business API não configurada.');
    return 'not_configured';
  }
  try {
    const version = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
    const result = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { preview_url: false, body: message(orderNumber, customerName, status) } }) });
    const data = await result.json() as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!result.ok) throw new Error(data.error?.message ?? `WhatsApp API HTTP ${result.status}`);
    await logNotification(orderId, 'whatsapp', phone, 'order_status_changed', 'sent', { orderNumber, status }, undefined, data.messages?.[0]?.id);
    return 'sent';
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Falha no envio WhatsApp.';
    await logNotification(orderId, 'whatsapp', phone, 'order_status_changed', 'failed', { orderNumber, status }, reason);
    return 'failed';
  }
}

export async function notifyOrderStatusChanged(order: { id: number; order_number: string; customer_name: string; customer_email: string; customer_phone: string }, status: string) {
  const results = await Promise.all([
    sendEmail(order.id, order.customer_email, order.order_number, order.customer_name, status),
    sendWhatsApp(order.id, order.customer_phone, order.order_number, order.customer_name, status),
  ]);
  return { email: results[0], whatsapp: results[1] };
}
