import { useState } from 'react';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Icon } from '../components/ui/Icon';
import { useToast } from '../context/ToastContext';
import { CONTACT_INFO } from '../data/site';

export function Contact() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim());
    if (!form.name.trim() || !emailValid || form.subject.trim().length < 3 || form.message.trim().length < 10) {
      showToast('Preencha o nome, um email válido, o assunto e uma mensagem com pelo menos 10 caracteres.', 'error');
      return;
    }
    setSent(true);
    showToast('O formulário foi validado, mas o serviço de atendimento ainda não está configurado.', 'info');
  };

  return (
    <div className="static-page contact-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Contacte-nos' }]} />
        <header className="static-head">
          <h1>Contacte-nos</h1>
          <p>Tem uma dúvida sobre um jogo, uma encomenda ou a loja? Estamos disponíveis para ajudar.</p>
        </header>

        <div className="contact-layout">
          <aside className="contact-info">
            <div className="contact-info__block">
              <h2>Horário</h2>
              {CONTACT_INFO.hours.map((item) => (
                <p key={item.label}><span>{item.label}</span><strong>{item.value}</strong></p>
              ))}
            </div>
            <div className="contact-info__block">
              <h2>Contacto</h2>
              {CONTACT_INFO.phones.map((item) => (
                <p key={item.label}><span>{item.label}</span><strong>{item.value}</strong></p>
              ))}
              <p><span>Email</span><strong>{CONTACT_INFO.email}</strong></p>
            </div>
            <div className="contact-info__block">
              <h2>Endereço</h2>
              {CONTACT_INFO.addresses.map((address) => (
                <p key={address}><span>{address}</span></p>
              ))}
            </div>
            <p className="contact-demo">
              <Icon name="clock" /> Os dados de contacto são geridos no painel administrativo.
            </p>
          </aside>

          <form className="contact-form" onSubmit={submit} noValidate>
            <h2>Envie-nos uma mensagem</h2>
            {sent && (
              <div className="form-success">
                O formulário foi validado. A mensagem ainda não foi enviada porque o serviço de
                atendimento não está configurado.
              </div>
            )}
            <label className="field">
              <span>O seu nome *</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="field">
              <span>O seu email *</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="field">
              <span>Assunto *</span>
              <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
            </label>
            <label className="field">
              <span>A sua mensagem *</span>
              <textarea rows={6} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
            </label>
            <button type="submit" className="btn btn--primary btn--lg">Enviar mensagem</button>
          </form>
        </div>
      </div>
    </div>
  );
}
