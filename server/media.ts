import { randomUUID } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import multer from 'multer';
import { getPool } from './db';
import { privateObjectUrl, publicObjectUrl, readMediaObject, putMediaObject, deleteMediaObject, mediaObjectExists, storageDiagnostics, type MediaVisibility } from './storage';
import type { RouteDeps } from './routes/deps';

export const MEDIA_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const DOCUMENT_MIME_TYPES = new Set(['application/pdf']);

export const mediaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });

export interface ImageDimensions { width: number; height: number }

/** Lê as dimensões reais do ficheiro a partir dos cabeçalhos (sem dependências). */
export function imageDimensions(buffer: Buffer, mimeType: string): ImageDimensions | null {
  try {
    if (mimeType === 'image/png' && buffer.length > 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mimeType === 'image/gif' && buffer.length > 10) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    if (mimeType === 'image/webp' && buffer.length > 30) {
      const format = buffer.subarray(12, 16).toString('ascii');
      if (format === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
      if (format === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      if (format === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      return null;
    }
    if (mimeType === 'image/jpeg') {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
        if (isSof) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
        offset += 2 + length;
      }
    }
  } catch { /* cabeçalho inválido */ }
  return null;
}

export function hasValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mimeType === 'image/gif') return ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mimeType === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  return false;
}

interface MediaRule { minWidth: number; minHeight: number; label: string }
const RULES: Record<string, MediaRule> = {
  product: { minWidth: 500, minHeight: 500, label: 'capa de produto' },
  banner: { minWidth: 1000, minHeight: 300, label: 'banner' },
  blog: { minWidth: 600, minHeight: 300, label: 'imagem de artigo' },
  site: { minWidth: 200, minHeight: 120, label: 'imagem do site' },
  avatar: { minWidth: 128, minHeight: 128, label: 'avatar' },
  document: { minWidth: 0, minHeight: 0, label: 'documento' },
};

export function extensionForMime(mimeType: string): string {
  return ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' } as Record<string, string>)[mimeType] ?? '';
}

export function mediaKey(purpose: string, mimeType: string): string {
  const safePurpose = (purpose || 'product').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'product';
  const month = new Date().toISOString().slice(0, 7);
  return `${safePurpose}/${month}/${randomUUID()}${extensionForMime(mimeType)}`;
}

export function validateMediaBuffer(buffer: Buffer, mimeType: string, purpose: string, sizeLimit: number): { ok: true; width?: number; height?: number; warnings: string[] } | { ok: false; message: string } {
  if (buffer.length > sizeLimit) return { ok: false, message: `O ficheiro excede o limite de ${Math.round(sizeLimit / 1024 / 1024)} MB.` };
  if (!hasValidImageSignature(buffer, mimeType)) return { ok: false, message: 'O conteúdo do ficheiro não corresponde ao formato indicado.' };
  if (mimeType === 'application/pdf') return { ok: true, warnings: [] };
  const dimensions = imageDimensions(buffer, mimeType);
  if (!dimensions || dimensions.width < 32 || dimensions.height < 32) return { ok: false, message: 'Não foi possível ler as dimensões da imagem. Envie um ficheiro válido.' };
  const rule = RULES[purpose] ?? RULES.product;
  const warnings: string[] = [];
  if (dimensions.width < rule.minWidth || dimensions.height < rule.minHeight) {
    warnings.push(`Resolução abaixo do recomendado para ${rule.label} (mínimo ${rule.minWidth}×${rule.minHeight}px).`);
  }
  return { ok: true, width: dimensions.width, height: dimensions.height, warnings };
}

function wrap(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: (error?: unknown) => void) => handler(request, response).catch(next);
}

function sendObject(response: Response, object: { body: Buffer; contentType: string; size: number }, visibility: MediaVisibility, filename?: string): void {
  response.setHeader('Content-Type', object.contentType);
  response.setHeader('Content-Length', String(object.size));
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (visibility === 'private') {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    response.setHeader('Content-Disposition', `inline; filename="${(filename ?? 'ficheiro').replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
  } else {
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Access-Control-Allow-Origin', '*');
  }
  response.end(object.body);
}

export function registerMediaRoutes(app: Express, deps: RouteDeps): void {
  // Media pública: URL estável servida pela aplicação (nunca expira).
  app.use('/media', wrap(async (request, response) => {
    const key = decodeURIComponent(request.path.replace(/^\/+/, ''));
    if (!key || key.includes('..')) { response.status(404).end(); return; }
    const object = await readMediaObject(key, 'public');
    if (!object) { response.status(404).type('text/plain').send('Ficheiro não encontrado.'); return; }
    sendObject(response, object, 'public', key.split('/').pop());
  }));

  // Media privada (comprovativos): só administradores autenticados.
  app.use('/api/media/private', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'orders');
    if (!admin) return;
    const key = decodeURIComponent(request.path.replace(/^\/+/, ''));
    const object = await readMediaObject(key, 'private');
    if (!object) { response.status(404).json({ error: 'file_not_found', message: 'Ficheiro não encontrado.' }); return; }
    sendObject(response, object, 'private', key.split('/').pop());
  }));

  // Lista da biblioteca com pré-visualização sempre funcional.
  app.get('/api/admin/media', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response, 'media')) return;
    const search = String(request.query.q ?? '').trim().slice(0, 160);
    const purpose = String(request.query.purpose ?? '').trim().slice(0, 60);
    const filters: string[] = [];
    const params: unknown[] = [];
    if (search) { filters.push('(m.original_name ILIKE ? OR m.object_key ILIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (purpose && purpose !== 'all') { filters.push('m.purpose = ?'); params.push(purpose); }
    const [rows] = await getPool().query<any[]>(`SELECT m.*, u.name AS uploaded_by FROM media_library m LEFT JOIN app_users u ON u.id = m.uploaded_by_user_id ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY m.created_at DESC LIMIT 300`, params);
    const media = rows.map((row) => ({
      ...row,
      public_url: row.visibility === 'private' ? null : publicObjectUrl(String(row.object_key)),
      preview_url: row.visibility === 'private' ? privateObjectUrl(String(row.object_key)) : publicObjectUrl(String(row.object_key)),
    }));
    response.json({ media, storageConfigured: true, storage: storageDiagnostics() });
  }));

  // Upload direto (servidor recebe o ficheiro e grava em R2 ou base de dados).
  app.post('/api/admin/media', mediaUpload.single('file'), wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'media');
    if (!admin) return;
    const file = request.file;
    if (!file) { response.status(400).json({ error: 'file_required', message: 'Selecione um ficheiro para enviar.' }); return; }
    const purpose = String(request.body?.kind ?? request.body?.purpose ?? 'product').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'product';
    if (!MEDIA_MIME_TYPES.has(file.mimetype) && !DOCUMENT_MIME_TYPES.has(file.mimetype)) {
      response.status(400).json({ error: 'invalid_type', message: 'Formato não suportado. Use JPG, PNG, WEBP, GIF ou PDF.' });
      return;
    }
    const validation = validateMediaBuffer(file.buffer, file.mimetype, purpose, 12 * 1024 * 1024);
    if (!validation.ok) { response.status(400).json({ error: 'invalid_file', message: validation.message }); return; }
    const key = mediaKey(purpose, file.mimetype);
    const stored = await putMediaObject(key, file.buffer, file.mimetype, 'public');
    const publicUrl = publicObjectUrl(key)!;
    const originalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255) || key.split('/').pop()!;
    try {
      await getPool().execute(
        `INSERT INTO media_library (original_name, stored_name, bucket, object_key, public_url, mime_type, size_bytes, width, height, category, purpose, visibility, uploaded_by_user_id, storage_backend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public', ?, ?) ON CONFLICT (object_key) DO NOTHING`,
        [originalName, key.split('/').pop(), stored.backend === 'r2' ? (process.env.R2_PUBLIC_BUCKET ?? process.env.R2_BUCKET ?? 'gameao') : 'database', key, publicUrl, file.mimetype, file.size, validation.width ?? null, validation.height ?? null, file.mimetype.startsWith('image/') ? 'image' : 'document', purpose, admin.id, stored.backend],
      );
    } catch (error) {
      // Nunca deixar objetos órfãos: se o registo falhar, remove o ficheiro.
      await deleteMediaObject(key, 'public').catch(() => undefined);
      throw error;
    }
    await deps.recordAudit(admin.id, 'media.upload', 'media', key, { purpose, mimeType: file.mimetype, size: file.size, backend: stored.backend });
    response.status(201).json({ key, url: publicUrl, previewUrl: publicUrl, backend: stored.backend, width: validation.width ?? null, height: validation.height ?? null, warnings: validation.warnings });
  }));

  // Confirmação de upload direto ao R2 (fluxo presigned).
  app.post('/api/admin/media/presign', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'media');
    if (!admin) return;
    const { createSignedUploadUrl } = await import('./storage');
    const contentType = String(request.body?.contentType ?? '').slice(0, 100);
    const size = Number(request.body?.size ?? 0);
    const purpose = String(request.body?.purpose ?? 'product').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'product';
    const visibility: MediaVisibility = request.body?.visibility === 'private' ? 'private' : 'public';
    if (!MEDIA_MIME_TYPES.has(contentType) && !DOCUMENT_MIME_TYPES.has(contentType)) { response.status(400).json({ error: 'invalid_type', message: 'Formato não autorizado.' }); return; }
    const maxSize = contentType === 'application/pdf' ? 12 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!Number.isFinite(size) || size <= 0 || size > maxSize) { response.status(400).json({ error: 'invalid_size', message: `O ficheiro deve ter no máximo ${Math.round(maxSize / 1024 / 1024)} MB.` }); return; }
    try {
      const key = mediaKey(purpose, contentType);
      const uploadUrl = await createSignedUploadUrl(key, contentType, 600, visibility === 'private');
      await deps.recordAudit(admin.id, 'media.presign', 'media', key, { purpose, contentType, size, visibility });
      response.status(201).json({ key, uploadUrl, publicUrl: visibility === 'public' ? publicObjectUrl(key) : null, expiresIn: 600, visibility });
    } catch {
      response.status(503).json({ error: 'storage_not_configured', message: 'O upload direto exige R2 configurado. Use o envio normal pela biblioteca.' });
    }
  }));

  app.post('/api/admin/media/confirm', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'media');
    if (!admin) return;
    const key = String(request.body?.key ?? '').trim().slice(0, 500);
    const visibility: MediaVisibility = request.body?.visibility === 'private' ? 'private' : 'public';
    if (!key) { response.status(400).json({ error: 'invalid_key', message: 'Referência de ficheiro inválida.' }); return; }
    const exists = await mediaObjectExists(key, visibility);
    if (!exists) { response.status(404).json({ error: 'file_not_found', message: 'O ficheiro não foi encontrado no armazenamento.' }); return; }
    const contentType = String(request.body?.contentType ?? 'application/octet-stream').slice(0, 100);
    const originalName = String(request.body?.originalName ?? key.split('/').pop() ?? 'ficheiro').slice(0, 255);
    const purpose = String(request.body?.purpose ?? 'product').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'product';
    await getPool().execute(
      `INSERT INTO media_library (original_name, stored_name, bucket, object_key, public_url, mime_type, size_bytes, width, height, category, purpose, visibility, uploaded_by_user_id, storage_backend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'r2') ON CONFLICT (object_key) DO NOTHING`,
      [originalName, key.split('/').pop(), process.env.R2_PUBLIC_BUCKET ?? process.env.R2_BUCKET ?? 'gameao', key, visibility === 'public' ? publicObjectUrl(key) : null, contentType, Number(request.body?.size ?? 0), request.body?.width ? Number(request.body.width) : null, request.body?.height ? Number(request.body.height) : null, contentType.startsWith('image/') ? 'image' : 'document', purpose, visibility, admin.id],
    );
    const [[row]] = await getPool().query<any[]>(`SELECT * FROM media_library WHERE object_key = ? LIMIT 1`, [key]);
    await deps.recordAudit(admin.id, 'media.confirm', 'media', key, { visibility });
    response.status(201).json({ media: { ...row, preview_url: visibility === 'public' ? publicObjectUrl(key) : privateObjectUrl(key) } });
  }));

  app.delete('/api/admin/media/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'media');
    if (!admin) return;
    const [[row]] = await getPool().query<any[]>(`SELECT * FROM media_library WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!row) { response.status(404).json({ error: 'media_not_found', message: 'Ficheiro não encontrado.' }); return; }
    const [usage] = await getPool().query<any[]>(
      `SELECT COUNT(*) AS total FROM catalog_products WHERE image_url LIKE ? OR image_card_url LIKE ? OR additional_images_json::text LIKE ?
       UNION ALL SELECT COUNT(*) FROM content_posts WHERE image_url LIKE ? OR image_card_url LIKE ? OR image_thumb_url LIKE ?
       UNION ALL SELECT COUNT(*) FROM site_banners WHERE image_url LIKE ?`,
      [`%${row.object_key}%`, `%${row.object_key}%`, `%${row.object_key}%`, `%${row.object_key}%`, `%${row.object_key}%`, `%${row.object_key}%`, `%${row.object_key}%`],
    );
    const inUse = usage.reduce((total, item: any) => total + Number(item.total ?? 0), 0);
    if (inUse > 0 && request.query.force !== '1') {
      response.status(409).json({ error: 'media_in_use', message: `Este ficheiro está a ser usado em ${inUse} registo(s). Substitua as referências ou confirme a eliminação forçada.` });
      return;
    }
    await deleteMediaObject(String(row.object_key), row.visibility === 'private' ? 'private' : 'public');
    await getPool().execute(`DELETE FROM media_library WHERE id = ?`, [row.id]);
    await deps.recordAudit(admin.id, 'media.delete', 'media', row.object_key, { forced: inUse > 0 });
    response.status(204).end();
  }));

  app.get('/api/admin/media/:id/download', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response, 'media')) return;
    const [[row]] = await getPool().query<any[]>(`SELECT * FROM media_library WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!row) { response.status(404).json({ error: 'media_not_found', message: 'Ficheiro não encontrado.' }); return; }
    response.json({ url: row.visibility === 'private' ? privateObjectUrl(String(row.object_key)) : publicObjectUrl(String(row.object_key)) });
  }));

  // Diagnóstico de armazenamento: testa escrita, leitura e remoção.
  app.get('/api/admin/storage/diagnostics', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response, 'media')) return;
    response.json({ storage: storageDiagnostics(), ok: true });
  }));

  app.post('/api/admin/storage/test', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'media');
    if (!admin) return;
    const key = `media/diagnostics/${randomUUID()}.png`;
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const steps: Array<{ step: string; ok: boolean; detail?: string }> = [];
    try {
      const stored = await putMediaObject(key, png, 'image/png', 'public');
      steps.push({ step: 'escrita', ok: true, detail: stored.backend });
      const read = await readMediaObject(key, 'public');
      steps.push({ step: 'leitura', ok: Boolean(read && read.size === png.length), detail: read?.backend });
      await deleteMediaObject(key, 'public');
      const after = await mediaObjectExists(key, 'public');
      steps.push({ step: 'remoção', ok: !after });
      response.json({ ok: steps.every((step) => step.ok), steps, storage: storageDiagnostics() });
    } catch (error) {
      steps.push({ step: 'escrita', ok: false, detail: error instanceof Error ? error.message : 'erro' });
      response.status(500).json({ ok: false, steps, storage: storageDiagnostics() });
    }
  }));
}
