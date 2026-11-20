import express, { type Express, type Request, type Response } from 'express';
import { Webhook } from 'svix';
import { applyResendEmailEvent, resendEventDetails } from '../resend-events';

function parsedDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function registerResendWebhookRoutes(app: Express): void {
  app.post('/webhooks/resend', express.raw({ type: 'application/json', limit: '128kb' }), async (request: Request, response: Response) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
    if (!secret) {
      response.status(503).json({ error: 'webhook_not_configured' });
      return;
    }
    if (!Buffer.isBuffer(request.body)) {
      response.status(400).json({ error: 'invalid_webhook_body' });
      return;
    }
    const id = request.header('svix-id');
    const timestamp = request.header('svix-timestamp');
    const signature = request.header('svix-signature');
    if (!id || !timestamp || !signature) {
      response.status(400).json({ error: 'invalid_webhook_signature' });
      return;
    }

    let event: Record<string, any>;
    try {
      const payload = request.body.toString('utf8');
      new Webhook(secret).verify(payload, { id, timestamp, signature });
      const parsed: unknown = JSON.parse(payload);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid event payload.');
      event = parsed as Record<string, any>;
    } catch {
      response.status(400).json({ error: 'invalid_webhook_signature' });
      return;
    }

    const eventType = typeof event.type === 'string' ? event.type.slice(0, 100) : '';
    const data = event.data && typeof event.data === 'object' ? event.data as Record<string, any> : {};
    const emailId = typeof data.email_id === 'string' ? data.email_id.trim() : '';
    if (!eventType || !emailId || emailId.length > 255) {
      response.status(200).json({ ok: true, ignored: true });
      return;
    }

    try {
      const result = await applyResendEmailEvent({
        providerEventId: id,
        eventType,
        emailId,
        occurredAt: parsedDate(event.created_at ?? data.created_at),
        detailText: resendEventDetails(data, eventType),
      });
      response.status(200).json({ ok: true, ...result });
    } catch (error) {
      console.error('[resend-webhook] event persistence failed', error instanceof Error ? error.name : 'unknown');
      response.status(500).json({ error: 'webhook_processing_failed' });
    }
  });
}
