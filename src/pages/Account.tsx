import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Tabs } from '../components/ui/Tabs';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatDatePt, formatUsdAsAoa } from '../lib/pricing';
import { useSeo } from '../lib/seo';

type Mode = 'login' | 'register' | 'lost';

export function Account() {
  const { user, login, register, logout, updateProfile, orders, wishlist, compare, cartCount } = useStore();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [lostEmail, setLostEmail] = useState('');
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' });
  const [lostSent, setLostSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  useEffect(() => {
    if (!user) setMode('login');
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email, phone: user.phone });
    }
  }, [user]);

  const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!emailValid(loginForm.email) || loginForm.password.trim().length < 6) {
      showToast('Indique um email válido e uma palavra-passe com pelo menos 6 caracteres.', 'error');
      return;
    }
    setBusy(true);
    const success = await login(loginForm.email, loginForm.password);
    setBusy(false);
    if (success) {
      showToast('Sessão iniciada.');
    } else {
      showToast('Não foi possível iniciar sessão. Verifique os dados.', 'error');
    }
  };

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!registerForm.name.trim() || !emailValid(registerForm.email) || !registerForm.phone.trim() || registerForm.password.trim().length < 6) {
      showToast('Preencha o nome, email, número de telemóvel e uma palavra-passe com pelo menos 6 caracteres.', 'error');
      return;
    }
    if (registerForm.password !== registerForm.confirm) {
      showToast('As palavras-passe não coincidem.', 'error');
      return;
    }
    setBusy(true);
    const success = await register(registerForm.name, registerForm.email, registerForm.password, registerForm.phone);
    setBusy(false);
    if (success) {
      showToast('Conta criada com sucesso.');
      setProfile({ name: registerForm.name, email: registerForm.email, phone: registerForm.phone });
    } else {
      showToast('Não foi possível criar a conta. O email pode já estar registado.', 'error');
    }
  };

  const submitLost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!emailValid(lostEmail)) {
      showToast('Indique um email válido.', 'error');
      return;
    }
    setBusy(true);
    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lostEmail }),
    });
    setBusy(false);
    if (response.ok) {
      setLostSent(true);
      showToast('Se a conta existir, receberá instruções por email.', 'info');
    } else {
      showToast('A recuperação de palavra-passe ainda não está disponível porque o serviço de email não foi configurado.', 'error');
    }
  };

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile.name.trim() || !emailValid(profile.email)) {
      showToast('Indique o nome e um email válido.', 'error');
      return;
    }
    if (await updateProfile(profile)) showToast('Dados pessoais atualizados.');
    else showToast('Não foi possível atualizar os dados pessoais.', 'error');
  };

  useSeo({ title: 'A minha conta | GameAO', path: '/my-account', noindex: true });
  return (
    <PageShell crumbs={[{ label: 'Minha Conta' }]} className={user ? '' : 'auth-page'}>
      <h1 className="page-title">Minha Conta</h1>

      {user ? (
        <div className="account-layout">
          <aside className="account-nav">
            <p className="account-nav__greeting">Olá, <strong>{user.name}</strong></p>
            <Link to="/my-account" className="is-active"><Icon name="user" /> Dados da conta</Link>
            <Link to="/my-account/orders"><Icon name="cart" /> Compras <span>{orders.length}</span></Link>
            <Link to="/my-account/affiliate"><Icon name="user" /> Programa de afiliados</Link>
            <Link to="/wishlist"><Icon name="heart" /> Lista de desejos</Link>
            <Link to="/compare"><Icon name="compare" /> Comparar produtos</Link>
            {(user.role === 'admin' || user.role === 'super_admin') && <Link to="/admin"><Icon name="category" /> Painel administrativo</Link>}
            <button type="button" onClick={() => { logout(); showToast('Sessão terminada.', 'info'); }}>
              <Icon name="close" /> Terminar sessão
            </button>
          </aside>

          <div className="account-content">
            <section className="account-welcome">
              <div><p className="page-kicker">Área pessoal</p><h2>Olá, {user.name.split(' ')[0]}</h2><p>Consulte os seus pedidos, atualize os seus dados e continue a explorar a GameAO.</p></div>
              <Link to="/shop" className="btn btn--primary">Explorar a loja</Link>
            </section>
            <section className="account-summary" aria-label="Resumo da conta">
              <Link to="/my-account/orders"><span>Compras</span><strong>{orders.length}</strong><small>Ver histórico</small></Link>
              <Link to="/wishlist"><span>Lista de desejos</span><strong>{wishlist.length}</strong><small>Produtos guardados</small></Link>
              <Link to="/compare"><span>Comparação</span><strong>{compare.length}</strong><small>Produtos selecionados</small></Link>
              <Link to="/cart"><span>Carrinho</span><strong>{cartCount}</strong><small>Artigos atuais</small></Link>
            </section>
            <section className="account-section">
              <h2>Dados pessoais</h2>
              <form onSubmit={submitProfile} className="account-form">
                <label className="field">
                  <span>Nome completo *</span>
                  <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Telefone</span>
                  <input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} placeholder="+244 9XX XXX XXX" />
                </label>
                <button type="submit" className="btn btn--primary">Guardar alterações</button>
              </form>
            </section>

            <section className="account-section">
              <h2>Compras recentes</h2>
              {orders.length === 0 ? (
                <p className="account-empty">Ainda não fez nenhuma compra. <Link to="/shop">Explorar a loja</Link></p>
              ) : (
                <ul className="account-orders-mini">
                  {orders.slice(0, 3).map((order) => (
                    <li key={order.id}>
                      <span>{order.id}</span>
                      <span>{formatDatePt(order.createdAt)}</span>
                      <strong>{formatUsdAsAoa(order.totalAoa)}</strong>
                      <Link to={`/pedido?order=${encodeURIComponent(order.id)}`}>Ver</Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/my-account/orders" className="btn btn--outline btn--sm">Ver todas as compras</Link>
            </section>
          </div>
        </div>
      ) : (
        <div className="auth-layout">
          <aside className="auth-hero" aria-label="Experiência GameAO">
            <div className="auth-hero__image" />
            <div className="auth-hero__overlay" />
            <div className="auth-hero__content">
              <img src="/assets/gameao-logo.png" alt="GameAO" className="auth-hero__logo" />
              <p className="page-kicker">A tua próxima partida começa aqui</p>
              <h2>Entra no universo GameAO.</h2>
              <p>Guarda os teus favoritos, acompanha as compras e recebe uma experiência feita para quem joga.</p>
              <div className="auth-hero__points"><span><Icon name="check" /> Catálogo selecionado</span><span><Icon name="check" /> Entrega digital rápida</span><span><Icon name="check" /> Apoio local em Angola</span></div>
            </div>
          </aside>
          <div className="auth-card">
            <Tabs
              tabs={[
                { id: 'login', label: 'Entrar' },
                { id: 'register', label: 'Criar conta' },
              ]}
              active={mode === 'lost' ? 'login' : mode}
              onChange={(id) => { setMode(id as Mode); setLostSent(false); setBusy(false); }}
              ariaLabel="Acesso à conta"
            />

            {mode === 'login' && (
              <form className="auth-form" onSubmit={submitLogin} noValidate>
                <p className="auth-form__eyebrow">Bem-vindo de volta</p><h2>Entra na tua conta</h2>
                <p className="auth-form__intro">Acede ao teu espaço GameAO e continua de onde paraste.</p>
                <label className="field"><span>Email *</span><input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} autoComplete="username" placeholder="nome@exemplo.com" /></label>
                <label className="field"><span>Palavra-passe *</span><div className="auth-password"><input type={showLoginPassword ? 'text' : 'password'} value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} autoComplete="current-password" placeholder="A tua palavra-passe" /><button type="button" onClick={() => setShowLoginPassword((current) => !current)} aria-label={showLoginPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>{showLoginPassword ? 'Ocultar' : 'Mostrar'}</button></div></label>
                <div className="auth-form__options"><label className="checkbox"><input type="checkbox" /> <span>Lembrar-me neste dispositivo</span></label><button type="button" className="auth-link" onClick={() => setMode('lost')}>Recuperar acesso</button></div>
                <button type="submit" className="btn btn--primary btn--block auth-submit" disabled={busy}>{busy ? 'A entrar…' : 'Entrar na conta'}</button>
                <p className="auth-switch">Ainda não tens conta? <button type="button" onClick={() => setMode('register')}>Criar conta grátis</button></p>
              </form>
            )}

            {mode === 'register' && (
              <form className="auth-form" onSubmit={submitRegister} noValidate>
                <p className="auth-form__eyebrow">Junta-te à comunidade</p><h2>Cria a tua conta</h2>
                <p className="auth-form__intro">Regista-te para guardar favoritos, comparações e o teu histórico de compras.</p>
                <div className="form-row"><label className="field"><span>Nome completo *</span><input value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} autoComplete="name" placeholder="O teu nome" /></label><label className="field"><span>Telemóvel *</span><input type="tel" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" placeholder="+244 9XX XXX XXX" /></label></div>
                <label className="field"><span>Email *</span><input type="email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" placeholder="nome@exemplo.com" /></label>
                <label className="field"><span>Palavra-passe *</span><div className="auth-password"><input type={showRegisterPassword ? 'text' : 'password'} value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" placeholder="Mínimo de 6 caracteres" /><button type="button" onClick={() => setShowRegisterPassword((current) => !current)}>{showRegisterPassword ? 'Ocultar' : 'Mostrar'}</button></div></label>
                <label className="field"><span>Confirmar palavra-passe *</span><div className="auth-password"><input type={showRegisterConfirm ? 'text' : 'password'} value={registerForm.confirm} onChange={(event) => setRegisterForm((current) => ({ ...current, confirm: event.target.value }))} autoComplete="new-password" placeholder="Repete a palavra-passe" /><button type="button" onClick={() => setShowRegisterConfirm((current) => !current)}>{showRegisterConfirm ? 'Ocultar' : 'Mostrar'}</button></div></label>
                <button type="submit" className="btn btn--primary btn--block auth-submit" disabled={busy}>{busy ? 'A criar conta…' : 'Criar a minha conta'}</button>
                <p className="auth-terms">Ao criar uma conta, concordas com a utilização dos teus dados para gerir pedidos e melhorar a tua experiência.</p>
              </form>
            )}

            {mode === 'lost' && (
              <form className="auth-form" onSubmit={submitLost} noValidate>
                <p className="auth-form__eyebrow">Recuperação segura</p><h2>Recuperar acesso</h2><p className="auth-form__intro">Indica o email associado à tua conta. Se o serviço estiver configurado, receberás instruções para definir uma nova palavra-passe.</p>
                <label className="field"><span>Email *</span><input type="email" value={lostEmail} onChange={(event) => setLostEmail(event.target.value)} autoComplete="email" placeholder="nome@exemplo.com" /></label>
                {lostSent && <div className="form-success">Pedido registado. Se a conta existir, receberás instruções por email.</div>}
                <button type="submit" className="btn btn--primary btn--block auth-submit" disabled={busy}>{busy ? 'A enviar…' : 'Enviar instruções'}</button>
                <button type="button" className="auth-link" onClick={() => setMode('login')}>← Voltar ao início de sessão</button>
              </form>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
