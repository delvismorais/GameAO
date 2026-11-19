import { useEffect, useRef, useState, type FormEvent } from 'react';

type ChatMessage = { role: 'user' | 'assistant'; text: string };
const WELCOME: ChatMessage = {
  role: 'assistant',
  text: 'Olá! Sou o assistente GameAO. Posso ajudar com produtos, categorias, informações da loja e novidades públicas do site. Para consultar uma encomenda, use Acompanhar pedido com o email associado ou o seu token seguro.',
};

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages, sending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setDraft('');
    setSending(true);
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-10) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'O assistente está temporariamente indisponível. Tente novamente mais tarde.');
      setMessages((current) => [...current, { role: 'assistant', text: String(data.answer ?? 'Não consegui preparar uma resposta. Tente novamente.') }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível contactar o assistente. Tente novamente.';
      setMessages((current) => [...current, { role: 'assistant', text: message }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`gameao-assistant${open ? ' is-open' : ''}`}>
      {open && (
        <section className="gameao-assistant__panel" aria-label="Assistente virtual GameAO">
          <header className="gameao-assistant__header">
            <div className="gameao-assistant__identity">
              <span className="gameao-assistant__mark" aria-hidden="true">AO</span>
              <span><strong>Assistente GameAO</strong><small>Suporte sobre informação pública</small></span>
            </div>
            <button className="gameao-assistant__minimize" type="button" onClick={() => setOpen(false)} aria-label="Minimizar assistente">−</button>
          </header>
          <div className="gameao-assistant__messages" ref={listRef} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <p className={`gameao-assistant__message gameao-assistant__message--${message.role}`} key={`${index}-${message.role}`}>
                {message.text}
              </p>
            ))}
            {sending && <p className="gameao-assistant__typing" aria-label="A preparar resposta">A preparar resposta…</p>}
          </div>
          <form className="gameao-assistant__form" onSubmit={submit}>
            <label className="sr-only" htmlFor="gameao-assistant-input">Escreva a sua pergunta</label>
            <input
              id="gameao-assistant-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1200}
              placeholder="Escreva a sua pergunta…"
              autoComplete="off"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !draft.trim()} aria-label="Enviar mensagem">Enviar</button>
          </form>
          <p className="gameao-assistant__privacy">Não partilhe palavras-passe, códigos ou dados de pagamento.</p>
        </section>
      )}
      <button
        className="gameao-assistant__launcher"
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Fechar assistente GameAO' : 'Abrir assistente GameAO'}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="gameao-assistant__launcher-mark" aria-hidden="true">{open ? '×' : 'AO'}</span>
        <span className="gameao-assistant__launcher-label">{open ? 'Fechar' : 'Ajuda'}</span>
      </button>
    </div>
  );
}
