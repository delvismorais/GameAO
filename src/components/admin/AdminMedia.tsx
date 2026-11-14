import { useCallback, useRef, useState } from 'react';
import { AdminSection, Badge, Empty, Field, Notice, api, formatDate, useJson } from './ui';

type Media = { id: number; original_name: string; object_key: string; public_url?: string; mime_type: string; size_bytes: number; width?: number; height?: number; category: string; purpose: string; visibility: string; uploaded_by?: string; created_at: string };

const PURPOSES = [{ id: 'product', label: 'Produto' }, { id: 'banner', label: 'Banner' }, { id: 'blog', label: 'Blog' }, { id: 'site', label: 'Website' }, { id: 'avatar', label: 'Avatar' }, { id: 'document', label: 'Documento' }];

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1920;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 2 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, outputType === 'image/png' ? '.png' : '.jpg'), { type: outputType });
  } catch { return file; }
}

export function AdminMedia() {
  const [search, setSearch] = useState('');
  const [purpose, setPurpose] = useState('all');
  const { data, loading, reload } = useJson<{ media: Media[]; storageConfigured: boolean }>(`/api/admin/media?q=${encodeURIComponent(search)}&purpose=${purpose}`, [search, purpose]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error' | 'warning'>('success');
  const [uploadPurpose, setUploadPurpose] = useState('product');
  const input = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setProgress(0); setMessage('');
    const list = Array.from(files).slice(0, 10);
    let failed = false;
    for (let index = 0; index < list.length; index += 1) {
      const original = list[index];
      const file = await compressImage(original);
      const body = new FormData(); body.append('file', file); body.append('kind', uploadPurpose);
      const upload = await api<{ key: string; url: string }>('/api/admin/media', { method: 'POST', body });
      if (!upload.ok) { failed = true; setMessage(upload.error ?? 'Falha no envio do ficheiro.'); setTone('error'); break; }
      setProgress(Math.round(((index + 1) / list.length) * 100));
    }
    setUploading(false);
    if (!failed) { setMessage(`${list.length} ficheiro(s) enviados para a biblioteca.`); setTone('success'); }
    await reload();
  }, [reload, uploadPurpose, message]);

  const remove = async (media: Media) => {
    if (!window.confirm(`Eliminar ${media.original_name}? Confirme que não está a ser usado em produtos, banners ou artigos.`)) return;
    const result = await api(`/api/admin/media/${media.id}`, { method: 'DELETE' });
    setMessage(result.ok ? 'Ficheiro eliminado.' : result.error ?? 'Falha ao eliminar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) await reload();
  };
  const copy = async (value: string) => { await navigator.clipboard.writeText(value).catch(() => undefined); setMessage('Referência copiada.'); setTone('success'); };
  const open = async (media: Media) => { if (media.public_url) { window.open(media.public_url, '_blank', 'noopener,noreferrer'); return; } const result = await api<{ url: string }>(`/api/admin/media/${media.id}/download`); if (result.ok) window.open(result.data.url, '_blank', 'noopener,noreferrer'); else { setMessage(result.error ?? 'Ficheiro indisponível.'); setTone('error'); } };

  return <AdminSection title="Biblioteca de multimédia" subtitle="Todos os ficheiros ficam registados com metadados. O upload é direto para o Cloudflare R2 através de URLs assinadas." actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => void reload()}>Atualizar</button>}>
    <Notice message={message} tone={tone} />
    {data && !data.storageConfigured && <Notice tone="warning" message="O armazenamento R2 não está configurado neste ambiente. Configure R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_PUBLIC_BASE_URL no Render." />}
    <div className="admin-uploader" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files); }}>
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={(event) => void upload(event.target.files)} hidden />
      <div className="admin-uploader__icon">⇪</div>
      <strong>Arraste ficheiros para aqui ou selecione do computador</strong>
      <span>JPG, PNG, WEBP, GIF ou PDF · imagens até 8 MB, PDF até 10 MB. Imagens grandes são otimizadas automaticamente.</span>
      <div className="admin-uploader__actions"><select value={uploadPurpose} onChange={(event) => setUploadPurpose(event.target.value)}>{PURPOSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button type="button" className="btn btn--primary btn--sm" disabled={uploading} onClick={() => input.current?.click()}>{uploading ? `A enviar… ${progress}%` : 'Selecionar ficheiros'}</button></div>
      {uploading && <div className="admin-progress"><div style={{ width: `${progress}%` }} /></div>}
    </div>
    <div className="admin-filterbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar ficheiros…" /><select value={purpose} onChange={(event) => setPurpose(event.target.value)}><option value="all">Todas as finalidades</option>{PURPOSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
    <div className="admin-media-library">{loading ? <Empty>A carregar biblioteca…</Empty> : data?.media.length ? data.media.map((media) => <article key={media.id} className="admin-media-card"><div className="admin-media-card__preview">{media.mime_type.startsWith('image/') ? <img src={media.public_url ?? ''} alt={media.original_name} loading="lazy" /> : <span>PDF</span>}</div><div><strong>{media.original_name}</strong><small>{(media.size_bytes / 1024).toFixed(0)} KB · {media.purpose} · {formatDate(media.created_at, false)}</small><Badge tone={media.visibility === 'public' ? 'info' : 'warning'}>{media.visibility === 'public' ? 'Público' : 'Privado'}</Badge></div><div className="admin-media-card__actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => void open(media)}>Abrir</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void copy(media.public_url ?? media.object_key)}>Copiar URL</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void remove(media)}>Eliminar</button></div></article>) : <Empty>Biblioteca vazia. Envie o primeiro ficheiro acima.</Empty>}</div>
    <div className="admin-note"><Field label="Estrutura no bucket">product/ · banner/ · blog/ · site/ · avatar/ · document/ · organizados por ano-mês</Field></div>
  </AdminSection>;
}
