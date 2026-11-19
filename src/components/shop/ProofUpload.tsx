import { useEffect, useRef, useState } from 'react';

type PaymentMethod = { id: number; code: string; name: string };

const MAX_BYTES = 12 * 1024 * 1024;

/** Reduz fotos grandes no browser para garantir que o envio não falha. */
export async function compressProof(file: File): Promise<File> {
  if (file.type === 'application/pdf' || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (file.size < 900 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

function accessQuery(email: string, token: string): string {
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (token) params.set('token', token);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function ProofUpload({ orderNumber, email, token, onUploaded }: { orderNumber: string; email: string; token: string; onUploaded?: () => void | Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [method, setMethod] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then((response) => (response.ok ? response.json() : { methods: [] }))
      .then((data: { methods?: PaymentMethod[] }) => setMethods(data.methods ?? []))
      .catch(() => setMethods([]));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || busy) return;
    if (file.size > MAX_BYTES) {
      setTone('error');
      setMessage('O ficheiro excede 12 MB. Escolha uma foto mais pequena ou envie um PDF.');
      return;
    }
    setBusy(true);
    setMessage('A preparar e a enviar o comprovativo…');
    setTone('info');
    try {
      const prepared = await compressProof(file);
      const body = new FormData();
      body.append('file', prepared);
      if (method) body.append('paymentMethod', method);
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/proofs${accessQuery(email, token)}`, { method: 'POST', body, credentials: 'include' });
      const data = await response.json().catch(() => null) as { message?: string } | null;
      if (response.ok) {
        setTone('success');
        setMessage(data?.message ?? 'Comprovativo recebido. A equipa GameAO vai verificar o documento.');
        setFile(null);
        if (input.current) input.current.value = '';
        await onUploaded?.();
      } else {
        setTone('error');
        setMessage(data?.message ?? 'Não foi possível enviar o comprovativo. Tente novamente.');
      }
    } catch {
      setTone('error');
      setMessage('Não foi possível contactar o servidor. Verifique a ligação e tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return <form className="proof-upload" onSubmit={submit}>
    {methods.length > 0 && <label className="field"><span>Método de pagamento utilizado</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Manter o método do pedido</option>{methods.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>}
    <label className="field"><span>Comprovativo (JPG, PNG, WEBP ou PDF · máximo 12 MB)</span><input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setMessage(''); }} /></label>
    <p className="proof-upload__hint">Pode enviar a captura do transferência, o talão do multicaixa ou o PDF do banco. Fotos grandes são otimizadas automaticamente.</p>
    <button className="btn btn--primary" type="submit" disabled={!file || busy}>{busy ? 'A enviar…' : 'Enviar comprovativo para verificação'}</button>
    {message && <p className={`proof-upload__message proof-upload__message--${tone}`} role="status">{message}</p>}
  </form>;
}
