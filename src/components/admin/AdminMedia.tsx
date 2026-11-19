import { useCallback, useRef, useState } from 'react';
import { AdminSection, Badge, Empty, Field, Notice, api, formatDate, useJson } from './ui';

type Media = {
  id: number;
  original_name: string;
  object_key: string;
  public_url?: string | null;
  preview_url?: string | null;
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  category: string;
  purpose: string;
  visibility: string;
  storage_backend?: string;
  uploaded_by?: string;
  created_at: string;
};

type StorageInfo = {
  r2Credentials: boolean;
  privateBucket: string | null;
  publicBucket: string | null;
  publicBaseUrl: string | null;
  databaseFallback: boolean;
  mode: string;
};

type QueueItem = { id: string; file: File; status: 'pending' | 'uploading' | 'done' | 'error'; message?: string };

const PURPOSES = [
  { id: 'product', label: 'Produto' },
  { id: 'banner', label: 'Banner' },
  { id: 'blog', label: 'Blog' },
  { id: 'site', label: 'Website' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'document', label: 'Documento' },
];

const MAX_IMAGE = 12 * 1024 * 1024;
const MAX_DOCUMENT = 12 * 1024 * 1024;

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 2 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, 0.84));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, outputType === 'image/png' ? '.png' : '.jpg'), { type: outputType });
  } catch {
    return file;
  }
}

export function AdminMedia() {
  const [search, setSearch] = useState('');
  const [purpose, setPurpose] = useState('all');
  const { data, loading, reload } = useJson<{ media: Media[]; storageConfigured: boolean; storage?: StorageInfo }>(
    `/api/admin/media?q=${encodeURIComponent(search)}&purpose=${purpose}`,
    [search, purpose],
  );
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error' | 'warning'>('success');
  const [uploadPurpose, setUploadPurpose] = useState('product');
  const [testing, setTesting] = useState(false);
  const [testReport, setTestReport] = useState<Array<{ step: string; ok: boolean; detail?: string }> | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const patch = (id: string, changes: Partial<QueueItem>) =>
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const send = useCallback(async (item: QueueItem): Promise<boolean> => {
    patch(item.id, { status: 'uploading', message: undefined });
    const limit = item.file.type.startsWith('image/') ? MAX_IMAGE : MAX_DOCUMENT;
    if (item.file.size > limit) {
      patch(item.id, { status: 'error', message: `Ficheiro com ${(item.file.size / 1024 / 1024).toFixed(1)} MB. O limite é ${Math.round(limit / 1024 / 1024)} MB.` });
      return false;
    }
    const file = await compressImage(item.file);
    const body = new FormData();
    body.append('file', file);
    body.append('kind', uploadPurpose);
    const result = await api<{ key: string; url: string; backend?: string; warnings?: string[] }>('/api/admin/media', { method: 'POST', body });
    if (!result.ok) {
      patch(item.id, { status: 'error', message: result.error ?? 'Falha no envio. Verifique a ligação e tente novamente.' });
      return false;
    }
    patch(item.id, { status: 'done', message: result.data.backend === 'database' ? 'Guardado na base de dados (fallback).' : 'Guardado no R2.' });
    return true;
  }, [uploadPurpose]);

  const upload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const items: QueueItem[] = Array.from(files).slice(0, 12).map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      status: 'pending',
    }));
    setQueue((current) => [...items, ...current].slice(0, 24));
    setBusy(true);
    setMessage('');
    let failures = 0;
    for (const item of items) {
      const ok = await send(item);
      if (!ok) failures += 1;
    }
    setBusy(false);
    setTone(failures ? 'error' : 'success');
    setMessage(failures ? `${items.length - failures} de ${items.length} ficheiros enviados. Pode repetir os que falharam.` : `${items.length} ficheiro(s) enviados para a biblioteca.`);
    await reload();
  }, [reload, send]);

  const retry = async (item: QueueItem) => {
    setBusy(true);
    await send(item);
    setBusy(false);
    await reload();
  };

  const remove = async (media: Media) => {
    if (!window.confirm(`Eliminar ${media.original_name}? Confirme que não está a ser usado em produtos, banners ou artigos.`)) return;
    const result = await api(`/api/admin/media/${media.id}`, { method: 'DELETE' });
    setMessage(result.ok ? 'Ficheiro eliminado.' : result.error ?? 'Falha ao eliminar.');
    setTone(result.ok ? 'success' : 'error');
    if (result.ok) await reload();
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setMessage('Referência copiada.');
    setTone('success');
  };

  const open = async (media: Media) => {
    const direct = media.preview_url ?? media.public_url;
    if (direct) {
      window.open(direct, '_blank', 'noopener,noreferrer');
      return;
    }
    const result = await api<{ url: string }>(`/api/admin/media/${media.id}/download`);
    if (result.ok) window.open(result.data.url, '_blank', 'noopener,noreferrer');
    else {
      setMessage(result.error ?? 'Ficheiro indisponível.');
      setTone('error');
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestReport(null);
    const result = await api<{ ok: boolean; steps: Array<{ step: string; ok: boolean; detail?: string }> }>('/api/admin/storage/test', { method: 'POST' });
    setTesting(false);
    if (result.ok) {
      setTestReport(result.data.steps);
      setMessage(result.data.ok ? 'Armazenamento a funcionar: escrita, leitura e remoção confirmadas.' : 'O teste encontrou um problema. Veja o detalhe abaixo.');
      setTone(result.data.ok ? 'success' : 'error');
    } else {
      setMessage(result.error ?? 'Não foi possível testar o armazenamento.');
      setTone('error');
    }
  };

  const storage = data?.storage;
  const backendLabel = storage?.mode === 'database-only' ? 'Base de dados (fallback)' : 'Cloudflare R2 + fallback';

  return (
    <AdminSection
      title="Biblioteca de multimédia"
      subtitle="Envie imagens e documentos com validação no servidor. Cada ficheiro recebe um URL estável servido pela própria aplicação."
      actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => void reload()}>Atualizar</button>}
    >
      <Notice message={message} tone={tone} />

      <div className="admin-storage">
        <div>
          <strong>Armazenamento</strong>
          <small>{backendLabel}</small>
        </div>
        <div>
          <strong>Bucket público</strong>
          <small>{storage?.publicBucket ?? '—'}</small>
        </div>
        <div>
          <strong>Bucket privado</strong>
          <small>{storage?.privateBucket ?? '—'}</small>
        </div>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => void runTest()} disabled={testing}>
          {testing ? 'A testar…' : 'Testar armazenamento'}
        </button>
      </div>
      {storage && !storage.r2Credentials && (
        <Notice
          tone="warning"
          message="O R2 não está configurado neste ambiente: os ficheiros são guardados na base de dados e servidos por /media. Funciona, mas o R2 é recomendado para produção."
        />
      )}
      {testReport && (
        <ul className="admin-storage__report">
          {testReport.map((step) => (
            <li key={step.step} className={step.ok ? 'is-ok' : 'is-error'}>
              <strong>{step.step}</strong>
              <span>{step.ok ? 'OK' : 'Falhou'}{step.detail ? ` · ${step.detail}` : ''}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="admin-uploader" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files); }}>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={(event) => { void upload(event.target.files); event.target.value = ''; }} hidden />
        <div className="admin-uploader__icon">⇪</div>
        <strong>Arraste ficheiros para aqui ou selecione do computador</strong>
        <span>JPG, PNG, WEBP, GIF ou PDF até 12 MB. Imagens grandes são otimizadas no browser antes do envio.</span>
        <div className="admin-uploader__actions">
          <select value={uploadPurpose} onChange={(event) => setUploadPurpose(event.target.value)}>
            {PURPOSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'A enviar…' : 'Selecionar ficheiros'}
          </button>
        </div>
      </div>

      {queue.length > 0 && (
        <ul className="admin-queue">
          {queue.map((item) => (
            <li key={item.id} className={`admin-queue__item is-${item.status}`}>
              <span className="admin-queue__name">{item.file.name}</span>
              <span className="admin-queue__size">{(item.file.size / 1024).toFixed(0)} KB</span>
              <span className="admin-queue__status">
                {item.status === 'pending' && 'Em fila'}
                {item.status === 'uploading' && 'A enviar…'}
                {item.status === 'done' && 'Concluído'}
                {item.status === 'error' && (item.message ?? 'Falhou')}
              </span>
              {item.status === 'error' && (
                <button type="button" className="btn btn--outline btn--sm" onClick={() => void retry(item)} disabled={busy}>Tentar novamente</button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="admin-filterbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar ficheiros…" />
        <select value={purpose} onChange={(event) => setPurpose(event.target.value)}>
          <option value="all">Todas as finalidades</option>
          {PURPOSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      <div className="admin-media-library">
        {loading ? <Empty>A carregar biblioteca…</Empty> : data?.media.length ? data.media.map((media) => (
          <article key={media.id} className="admin-media-card">
            <div className="admin-media-card__preview">
              {media.mime_type.startsWith('image/') && (media.preview_url ?? media.public_url)
                ? <img src={media.preview_url ?? media.public_url ?? ''} alt={media.original_name} loading="lazy" />
                : <span>{media.mime_type === 'application/pdf' ? 'PDF' : 'Ficheiro'}</span>}
            </div>
            <div>
              <strong>{media.original_name}</strong>
              <small>{(media.size_bytes / 1024).toFixed(0)} KB · {media.purpose} · {formatDate(media.created_at, false)}</small>
              <Badge tone={media.visibility === 'public' ? 'info' : 'warning'}>{media.visibility === 'public' ? 'Público' : 'Privado'}</Badge>
            </div>
            <div className="admin-media-card__actions">
              <button type="button" className="btn btn--outline btn--sm" onClick={() => void open(media)}>Abrir</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => void copy(media.public_url ?? media.preview_url ?? media.object_key)}>Copiar URL</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => void remove(media)}>Eliminar</button>
            </div>
          </article>
        )) : <Empty>Biblioteca vazia. Envie o primeiro ficheiro acima.</Empty>}
      </div>

      <div className="admin-note">
        <Field label="Estrutura no bucket">product/ · banner/ · blog/ · site/ · avatar/ · document/ · organizados por ano-mês</Field>
      </div>
    </AdminSection>
  );
}
