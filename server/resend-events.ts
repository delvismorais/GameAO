import { getPool, type DbConnection } from './db';

export type ResendDeliveryStatus = 'accepted' | 'delivered' | 'delayed' | 'bounced' | 'complained' | 'suppressed' | 'failed';

type ResendStatusMapping = { status: ResendDeliveryStatus; errorMessage: string | null; previousStatuses: string[] };

export function mapResendEvent(type: string, detailText = ''): ResendStatusMapping | null {
  switch (type) {
    case 'email.sent':
      return { status: 'accepted', errorMessage: null, previousStatuses: ['accepted', 'sent'] };
    case 'email.delivered':
      return { status: 'delivered', errorMessage: null, previousStatuses: ['accepted', 'sent', 'delayed'] };
    case 'email.delivery_delayed':
      return { status: 'delayed', errorMessage: 'Resend informou atraso temporário na entrega.', previousStatuses: ['accepted', 'sent', 'delayed'] };
    case 'email.bounced':
      return { status: 'bounced', errorMessage: detailText.trim().slice(0, 1000) || 'O servidor destinatário rejeitou permanentemente o email.', previousStatuses: ['accepted', 'sent', 'delayed'] };
    case 'email.complained':
      return { status: 'complained', errorMessage: 'O destinatário marcou o email como spam.', previousStatuses: ['accepted', 'sent', 'delayed', 'delivered'] };
    case 'email.suppressed':
      return { status: 'suppressed', errorMessage: 'Resend suprimiu o email e não o entregou.', previousStatuses: ['accepted', 'sent', 'delayed'] };
    case 'email.failed':
      return { status: 'failed', errorMessage: detailText.trim().slice(0, 1000) || 'Resend informou uma falha no envio.', previousStatuses: ['accepted', 'sent', 'delayed'] };
    default:
      return null;
  }
}

export function resendEventDetails(data: Record<string, any>, type: string): string {
  if (type === 'email.bounced' && typeof data.bounce?.message === 'string') return data.bounce.message.trim().slice(0, 1000);
  if (type === 'email.failed') {
    const message = data.error?.message ?? data.message;
    return typeof message === 'string' ? message.trim().slice(0, 1000) : '';
  }
  return '';
}

export async function applyResendEmailEvent(input: {
  providerEventId: string;
  eventType: string;
  emailId: string;
  occurredAt: Date | null;
  detailText: string;
}, suppliedConnection?: DbConnection): Promise<{ duplicate: boolean; matched: number; ignored?: boolean }> {
  const mapping = mapResendEvent(input.eventType, input.detailText);
  if (!mapping || !input.emailId.trim()) return { duplicate: false, matched: 0, ignored: true };
  const ownedConnection = !suppliedConnection;
  const connection = suppliedConnection ?? await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [inserted] = await connection.query<any[]>(
      `INSERT INTO resend_webhook_events (provider_event_id, event_type, email_id, occurred_at, detail_text)
       VALUES (?, ?, ?, ?, ?) ON CONFLICT (provider_event_id) DO NOTHING RETURNING id`,
      [input.providerEventId.slice(0, 255), input.eventType.slice(0, 100), input.emailId.slice(0, 255), input.occurredAt, input.detailText.slice(0, 1000) || null],
    );
    if (!inserted.length) {
      await connection.commit();
      return { duplicate: true, matched: 0 };
    }

    const slots = mapping.previousStatuses.map(() => '?').join(', ');
    const params = [mapping.status, mapping.errorMessage, input.emailId, ...mapping.previousStatuses];
    const [, deliveryMeta] = await connection.execute(
      `UPDATE notification_deliveries SET status = ?, error_message = ?
       WHERE channel = 'email' AND provider_message_id = ? AND status IN (${slots})`,
      params,
    );
    const [, orderMeta] = await connection.execute(
      `UPDATE order_notifications SET status = ?, error_message = ?
       WHERE channel = 'email' AND provider_message_id = ? AND status IN (${slots})`,
      params,
    );
    await connection.commit();
    return { duplicate: false, matched: Number(deliveryMeta.affectedRows ?? 0) + Number(orderMeta.affectedRows ?? 0) };
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    if (ownedConnection) connection.release();
  }
}

export async function getKnownResendEmailStatus(emailId: string): Promise<ResendStatusMapping | null> {
  const [rows] = await getPool().query<any[]>(
    `SELECT event_type, detail_text FROM resend_webhook_events WHERE email_id = ?
     ORDER BY occurred_at DESC NULLS LAST, created_at DESC LIMIT 1`,
    [emailId],
  );
  const row = rows[0];
  return row ? mapResendEvent(String(row.event_type), String(row.detail_text ?? '')) : null;
}
