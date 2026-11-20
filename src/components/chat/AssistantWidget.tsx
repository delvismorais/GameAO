import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AssistantMessage } from './AssistantMessage';

type ChatMessage = { role: 'user' | 'assistant'; text: string; failed?: boolean; retryText?: string };
const WELCOME: ChatMessage = {
  role: 'assistant',
  text: 'Olá! Sou o assistente GameAO. Posso ajudar com produtos, categorias, informações da loja e novidades públicas do site. Para consultar uma encomenda, use Acompanhar pedido com o email associado ou o seu token seguro.',
};
const GENERIC_ERROR = 'Não foi possível responder agora. Verifique a ligação e tente novamente dentro de instantes.';

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

  async function sendMessage(rawText: string, reuseLastUser = false) {
    const text = rawText.trim();
    if (!text || sending) return;
    const history = messages.filter((message) => !message.failed);
    const last = history[history.length - 1];
    const nextMessages: ChatMessage[] = reuseLastUser && last?.role === 'user' && last.text === text
      ? history
      : [...history, { role: 'user', text }];
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
      if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : GENERIC_ERROR);
      setMessages((current) => [...current, { role: 'assistant', text: String(data.answer ?? 'Não consegui preparar uma resposta. Tente novamente.') }]);
    } catch (error) {
      const message = error instanceof TypeError ? GENERIC_ERROR : error instanceof Error ? error.message : GENERIC_ERROR;
      setMessages((current) => [...current, { role: 'assistant', text: message, failed: true, retryText: text }]);
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <div className={`gameao-assistant${open ? ' is-open' : ''}`}>
      {open && (
        <section className="gameao-assistant__panel" aria-label="Assistente virtual GameAO">
          <header className="gameao-assistant__header">
            <div className="gameao-assistant__identity">
              <img className="gameao-assistant__avatar" src="/assets/gameao-assistant-avatar.png" alt="Avatar do assistente GameAO" />
              <span><strong>Assistente GameAO</strong><small>Suporte sobre informação pública</small></span>
            </div>
            <button className="gameao-assistant__minimize" type="button" onClick={() => setOpen(false)} aria-label="Minimizar assistente">−</button>
          </header>
          <div className="gameao-assistant__messages" ref={listRef} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <div className={`gameao-assistant__message gameao-assistant__message--${message.role}`} key={`${index}-${message.role}`}>
                {message.role === 'assistant' ? <AssistantMessage text={message.text} /> : message.text}
                {message.failed && message.retryText && (
                  <button className="gameao-assistant__retry" type="button" onClick={() => void sendMessage(message.retryText!, true)} disabled={sending}>Tentar novamente</button>
                )}
              </div>
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
        <span className="gameao-assistant__launcher-mark" aria-hidden="true">{open ? '×' : <img src="/assets/gameao-assistant-avatar.png" alt="" />}</span>
        <span className="gameao-assistant__launcher-label">{open ? 'Fechar' : 'Ajuda'}</span>
      </button>
    </div>
  );
}
