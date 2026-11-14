import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Tabs } from '../components/ui/Tabs';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatDatePt, formatUsdAsAoa } from '../lib/pricing';

type Mode = 'login' | 'register' | 'lost';

export function Account() {
  const { user, login, register, logout, updateProfile, orders, wishlist, compare, cartCount } = useStore();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [lostEmail, setLostEmail] = useState('');
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' });
  const [lostSent, setLostSent] = useState(false);

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
    if (!emailValid(loginForm.email) || loginForm.password.trim().length < 6) {
      showToast('Indique um email válido e uma palavra-passe com pelo menos 6 caracteres.', 'error');
      return;
    }
    if (await login(loginForm.email, loginForm.password)) {
      showToast('Sessão iniciada.');
    } else {
      showToast('Não foi possível iniciar sessão. Verifique os dados.', 'error');
    }
  };

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!registerForm.name.trim() || !emailValid(registerForm.email) || registerForm.password.trim().length < 6) {
      showToast('Preencha o nome, um email válido e uma palavra-passe com pelo menos 6 caracteres.', 'error');
      return;
    }
    if (registerForm.password !== registerForm.confirm) {
      showToast('As palavras-passe não coincidem.', 'error');
      return;
    }
    if (await register(registerForm.name, registerForm.email, registerForm.password)) {
      showToast('Conta criada com sucesso.');
      setProfile({ name: registerForm.name, email: registerForm.email, phone: '' });
    } else {
      showToast('Não foi possível criar a conta. O email pode já estar registado.', 'error');
    }
  };

  const submitLost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailValid(lostEmail)) {
      showToast('Indique um email válido.', 'error');
      return;
    }
    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lostEmail }),
    });
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

  return (
    <PageShell crumbs={[{ label: 'Minha Conta' }]}>
      <h1 className="page-title">Minha Conta</h1>

      {user ? (
        <div className="account-layout">
          <aside className="account-nav">
            <p className="account-nav__greeting">Olá, <strong>{user.name}</strong></p>
            <Link to="/my-account" className="is-active"><Icon name="user" /> Dados da conta</Link>
            <Link to="/my-account/orders"><Icon name="cart" /> Encomendas <span>{orders.length}</span></Link>
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
              <Link to="/my-account/orders"><span>Encomendas</span><strong>{orders.length}</strong><small>Ver histórico</small></Link>
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
              <h2>Encomendas recentes</h2>
              {orders.length === 0 ? (
                <p className="account-empty">Ainda não fez nenhuma encomenda. <Link to="/shop">Explorar a loja</Link></p>
              ) : (
                <ul className="account-orders-mini">
                  {orders.slice(0, 3).map((order) => (
                    <li key={order.id}>
                      <span>{order.id}</span>
                      <span>{formatDatePt(order.createdAt)}</span>
                      <strong>{formatUsdAsAoa(order.totalAoa / order.exchangeRate, order.exchangeRate)}</strong>
                      <Link to={`/checkout/confirmacao?order=${encodeURIComponent(order.id)}`}>Ver</Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/my-account/orders" className="btn btn--outline btn--sm">Ver todas as encomendas</Link>
            </section>
          </div>
        </div>
      ) : (
        <div className="auth-card">
          <Tabs
            tabs={[
              { id: 'login', label: 'Entrar' },
              { id: 'register', label: 'Criar conta' },
            ]}
            active={mode === 'lost' ? 'login' : mode}
            onChange={(id) => { setMode(id as Mode); setLostSent(false); }}
            ariaLabel="Acesso à conta"
          />

          {mode === 'login' && (
            <form className="auth-form" onSubmit={submitLogin} noValidate>
              <h2>Entrar na sua conta</h2>
              <label className="field">
                <span>Email ou nome de utilizador *</span>
                <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} autoComplete="username" />
              </label>
              <label className="field">
                <span>Palavra-passe *</span>
                <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} autoComplete="current-password" />
              </label>
              <label className="checkbox">
                <input type="checkbox" /> <span>Lembrar-me neste dispositivo</span>
              </label>
              <button type="submit" className="btn btn--primary btn--block">Entrar</button>
              <button type="button" className="auth-link" onClick={() => setMode('lost')}>Perdeu a palavra-passe?</button>
            </form>
          )}

          {mode === 'register' && (
            <form className="auth-form" onSubmit={submitRegister} noValidate>
              <h2>Criar uma conta</h2>
              <p>Registe-se para guardar favoritos, comparações e o histórico de encomendas.</p>
              <label className="field">
                <span>Nome completo *</span>
                <input value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} autoComplete="name" />
              </label>
              <label className="field">
                <span>Email *</span>
                <input type="email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" />
              </label>
              <label className="field">
                <span>Palavra-passe *</span>
                <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" />
              </label>
              <label className="field">
                <span>Confirmar palavra-passe *</span>
                <input type="password" value={registerForm.confirm} onChange={(event) => setRegisterForm((current) => ({ ...current, confirm: event.target.value }))} autoComplete="new-password" />
              </label>
              <button type="submit" className="btn btn--primary btn--block">Criar conta</button>
            </form>
          )}

          {mode === 'lost' && (
            <form className="auth-form" onSubmit={submitLost} noValidate>
              <h2>Recuperar palavra-passe</h2>
              <p>Indique o email associado à conta. Se o serviço de email estiver configurado, receberá instruções para definir uma nova palavra-passe.</p>
              <label className="field">
                <span>Email *</span>
                <input type="email" value={lostEmail} onChange={(event) => setLostEmail(event.target.value)} autoComplete="email" />
              </label>
              {lostSent && <div className="form-success">Pedido registado. Se a conta existisse, receberia instruções por email.</div>}
              <button type="submit" className="btn btn--primary btn--block">Enviar pedido</button>
              <button type="button" className="auth-link" onClick={() => setMode('login')}>← Voltar ao início de sessão</button>
            </form>
          )}
        </div>
      )}
    </PageShell>
  );
}
