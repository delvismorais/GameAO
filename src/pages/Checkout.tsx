import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Price } from '../components/ui/Price';
import { Icon } from '../components/ui/Icon';
import { useStore, type Customer } from '../context/StoreContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { formatUsdAsAoa } from '../lib/pricing';
import { getEffectivePriceUsd } from '../data/products';
import { getStoredAffiliateCode, normalizeAffiliateCode } from '../lib/affiliate';
import { useSeo } from '../lib/seo';

const PROVINCES = ['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'];
const COUNTRIES = ['Angola', 'Portugal', 'Brasil', 'África do Sul', 'Namíbia', 'República Democrática do Congo', 'Zâmbia'];
type PaymentMethod = { id: number; code: string; name: string; description: string; instructions: string; requires_proof: number; customer_message: string; payment_deadline_hours?: number; receiving_data?: Record<string, unknown> };
type SavedPlayerId = { id: number; player_id: string; player_nickname: string; verified_at: string };
const variantKey = (productId: string, variantId?: number) => `${productId}:${variantId ?? 'base'}`;
const EMPTY_CUSTOMER: Customer = { firstName: '', lastName: '', company: '', country: 'Angola', address: '', apartment: '', city: '', province: 'Luanda', postalCode: '', phone: '', email: '', notes: '' };

export function Checkout() {
  const { cartLines, cartSubtotalUsd, cartDiscountUsd, user, clearCart, setVariant } = useStore();
  const { rate } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer>(() => {
    try {
      const saved = sessionStorage.getItem('gameao-checkout-draft');
      if (saved) return { ...EMPTY_CUSTOMER, ...JSON.parse(saved) } as Customer;
    } catch { /* ignora rascunhos inválidos */ }
    return { ...EMPTY_CUSTOMER, firstName: user?.name.split(' ')[0] ?? '', lastName: user?.name.split(' ').slice(1).join(' ') ?? '', email: user?.email ?? '', phone: user?.phone ?? '' };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [affiliateCode, setAffiliateCode] = useState(() => getStoredAffiliateCode());
  const [variantSelection, setVariantSelection] = useState<Record<string, string>>(() => Object.fromEntries(cartLines.filter((line) => line.variant).map((line) => [variantKey(line.product.id, line.variant?.id), String(line.variant!.id)])));
  const [playerIds, setPlayerIds] = useState<Record<string, string>>({});
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [savedPlayerIds, setSavedPlayerIds] = useState<SavedPlayerId[]>([]);
  const [verifyingPlayer, setVerifyingPlayer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef<string>(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => { void fetch('/api/payment-methods').then((response) => response.ok ? response.json() : { methods: [] }).then((data: { methods?: PaymentMethod[] }) => { const methods = data.methods ?? []; setPaymentMethods(methods); setPaymentMethod((current) => current || methods[0]?.code || ''); }); }, []);
  useEffect(() => { try { sessionStorage.setItem('gameao-checkout-draft', JSON.stringify(customer)); } catch { /* armazenamento opcional */ } }, [customer]);
  useEffect(() => { if (user) setCustomer((current) => ({ ...current, firstName: current.firstName || user.name.split(' ')[0] || '', lastName: current.lastName || user.name.split(' ').slice(1).join(' '), email: current.email || user.email || '', phone: current.phone || user.phone || '' })); }, [user]);
  useEffect(() => { setVariantSelection((current) => { const next = { ...current }; for (const line of cartLines) if (line.variant) next[variantKey(line.product.id, line.variant.id)] = String(line.variant.id); return next; }); }, [cartLines]);
  useEffect(() => {
    if (!user) { setSavedPlayerIds([]); return; }
    void fetch('/api/account/freefire-ids', { credentials: 'include' }).then((response) => response.ok ? response.json() : { ids: [] }).then((data: { ids?: SavedPlayerId[] }) => setSavedPlayerIds(data.ids ?? [])).catch(() => setSavedPlayerIds([]));
  }, [user]);

  const physicalLines = useMemo(() => cartLines.filter(({ product }) => product.categoryType === 'physical'), [cartLines]);
  const playerLines = useMemo(() => cartLines.filter(({ product }) => Boolean(product.requiresPlayerId) || (product.productSubtype === 'digital_game' && /free\s*fire|freefire|garena/i.test(product.name))), [cartLines]);
  const hasPhysical = physicalLines.length > 0;
  const hasDigital = cartLines.some(({ product }) => product.categoryType !== 'physical');
  const totalUsd = cartSubtotalUsd - cartDiscountUsd;
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email.trim()), [customer.email]);

  if (cartLines.length === 0) return <PageShell crumbs={[{ label: 'Finalizar Compra' }]}><h1 className="page-title">Finalizar Compra</h1><EmptyState title="O carrinho está vazio" icon="🛒" action={<Link to="/shop" className="btn btn--primary">Escolher jogos</Link>}>Adicione produtos ao carrinho antes de finalizar a compra.</EmptyState></PageShell>;

  const update = (key: keyof Customer, value: string) => { setCustomer((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); };
  const validate = () => {
    const next: Record<string, string> = {};
    if (!customer.firstName.trim()) next.firstName = 'Indique o nome.';
    if (!customer.lastName.trim()) next.lastName = 'Indique o apelido.';
    if (!customer.phone.trim() || customer.phone.replace(/\D/g, '').length < 9) next.phone = 'Indique um telefone válido (mínimo 9 dígitos).';
    if (!emailValid) next.email = 'Indique um email válido.';
    if (paymentMethods.length > 0 && !paymentMethod) next.paymentMethod = 'Escolha um método de pagamento.';
    for (const { product, variant } of cartLines) { const key = variantKey(product.id, variant?.id); if ((product.isDynamic || product.variants?.length) && (!product.variants?.length || !variantSelection[key] && !variant)) next[`variant-${key}`] = product.variants?.length ? 'Escolha uma opção antes de continuar.' : 'Este produto está temporariamente sem opções disponíveis.'; }
    if (hasPhysical) {
      if (!customer.address.trim()) next.address = 'Indique o endereço de entrega.';
      if (!customer.city.trim()) next.city = 'Indique a cidade.';
      if (!customer.province) next.province = 'Escolha a província.';
    }
    setErrors(next); return Object.keys(next).length === 0;
  };

  const verifyPlayer = async (productId: string) => {
    setVerifyingPlayer(productId);
    try {
      const result = await fetch('/api/freefire/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: playerIds[productId] }) });
      const data = await result.json().catch(() => ({})) as { nickname?: string; message?: string };
      if (result.ok && data.nickname) {
        setPlayerNames((current) => ({ ...current, [productId]: data.nickname! }));
        if (user) {
          void fetch('/api/account/freefire-ids', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: playerIds[productId], nickname: data.nickname }) }).then(() => fetch('/api/account/freefire-ids', { credentials: 'include' })).then((response) => response.ok ? response.json() : { ids: [] }).then((saved: { ids?: SavedPlayerId[] }) => setSavedPlayerIds(saved.ids ?? [])).catch(() => undefined);
        }
        showToast(`ID verificado: ${data.nickname}`, 'success');
      }
      else showToast(data.message ?? 'Não foi possível verificar este ID.', 'error');
    } finally { setVerifyingPlayer(null); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) { showToast('Verifique os campos assinalados antes de confirmar o pedido.', 'error'); return; }
    for (const { product } of playerLines) if (!playerNames[product.id]) { showToast(`Verifique o ID de jogador de ${product.name} antes de continuar.`, 'error'); return; }
    setSubmitting(true);
    let response: Response;
    try {
      response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current }, credentials: 'include', body: JSON.stringify({ rate, customer, paymentMethod: paymentMethod || undefined, couponCode: couponCode.trim() || undefined, affiliateCode: normalizeAffiliateCode(affiliateCode) || undefined, items: cartLines.map(({ product, qty, variant }) => ({ productId: product.id, qty, variantId: variantSelection[variantKey(product.id, variant?.id)] ? Number(variantSelection[variantKey(product.id, variant?.id)]) : variant?.id, playerId: playerIds[product.id] || undefined, playerNickname: playerNames[product.id] || undefined })) }) });
    } catch { showToast('Não foi possível contactar o servidor. Verifique a ligação e tente novamente.', 'error'); setSubmitting(false); return; }
    if (!response.ok) { const data = await response.json().catch(() => null) as { message?: string } | null; showToast(data?.message ?? 'Não foi possível concluir o pedido.', 'error'); setSubmitting(false); return; }
    const data = await response.json() as { orderNumber: string; trackingToken?: string }; sessionStorage.removeItem('gameao-checkout-draft'); clearCart(); navigate(`/checkout/confirmacao?order=${encodeURIComponent(data.orderNumber)}&email=${encodeURIComponent(customer.email)}${data.trackingToken ? `&token=${encodeURIComponent(data.trackingToken)}` : ''}`);
  };

  useSeo({ title: 'Finalizar compra | GameAO', path: '/checkout', noindex: true });
  return <PageShell crumbs={[{ label: 'Carrinho', href: '/cart' }, { label: 'Finalizar Compra' }]}>
    <h1 className="page-title">Finalizar Compra</h1>
    <p className="page-subtitle">Só pedimos os dados necessários para os produtos que escolheu.</p>
    <div className="checkout-note checkout-note--adaptive"><Icon name="clock" /><span><strong>{hasPhysical ? 'Entrega física incluída' : 'Entrega digital'}</strong> · {hasPhysical ? 'O endereço aparece porque o carrinho inclui produto(s) físico(s).' : 'Não precisa de indicar morada. Receberá as instruções após a confirmação.'}</span></div>

    <form className="checkout-layout" onSubmit={submit} noValidate>
      <div className="checkout-main">
        <section className="checkout-section checkout-section--compact"><div className="checkout-section__intro"><span className="checkout-step">01</span><div><h2>Dados pessoais</h2><p>Usaremos estes dados para confirmar o pedido e contactar consigo.</p></div></div>
          <div className="form-row"><label className={`field ${errors.firstName ? 'has-error' : ''}`}><span>Nome *</span><input value={customer.firstName} onChange={(event) => update('firstName', event.target.value)} autoComplete="given-name" />{errors.firstName && <small>{errors.firstName}</small>}</label><label className={`field ${errors.lastName ? 'has-error' : ''}`}><span>Apelido *</span><input value={customer.lastName} onChange={(event) => update('lastName', event.target.value)} autoComplete="family-name" />{errors.lastName && <small>{errors.lastName}</small>}</label></div>
          <div className="form-row"><label className={`field ${errors.phone ? 'has-error' : ''}`}><span>Telefone *</span><input value={customer.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+244 9XX XXX XXX" autoComplete="tel" />{errors.phone && <small>{errors.phone}</small>}</label><label className={`field ${errors.email ? 'has-error' : ''}`}><span>Email *</span><input type="email" value={customer.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" />{errors.email && <small>{errors.email}</small>}</label></div>
        </section>

        {hasPhysical && <section className="checkout-section checkout-section--compact"><div className="checkout-section__intro"><span className="checkout-step">02</span><div><h2>Endereço de entrega</h2><p>Necessário porque o carrinho inclui artigos físicos.</p></div></div>
          <label className={`field ${errors.address ? 'has-error' : ''}`}><span>Morada *</span><input value={customer.address} onChange={(event) => update('address', event.target.value)} placeholder="Rua, número e bairro" autoComplete="street-address" />{errors.address && <small>{errors.address}</small>}</label>
          <label className="field"><span>Apartamento, suite ou andar (opcional)</span><input value={customer.apartment} onChange={(event) => update('apartment', event.target.value)} autoComplete="address-line2" /></label>
          <div className="form-row"><label className={`field ${errors.city ? 'has-error' : ''}`}><span>Cidade *</span><input value={customer.city} onChange={(event) => update('city', event.target.value)} autoComplete="address-level2" />{errors.city && <small>{errors.city}</small>}</label><label className={`field ${errors.province ? 'has-error' : ''}`}><span>Província *</span><select value={customer.province} onChange={(event) => update('province', event.target.value)} autoComplete="address-level1">{PROVINCES.map((province) => <option key={province}>{province}</option>)}</select>{errors.province && <small>{errors.province}</small>}</label></div>
          <div className="form-row"><label className="field"><span>País / Região</span><select value={customer.country} onChange={(event) => update('country', event.target.value)} autoComplete="country-name">{COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label><label className="field"><span>Código postal (opcional)</span><input value={customer.postalCode} onChange={(event) => update('postalCode', event.target.value)} autoComplete="postal-code" /></label></div>
        </section>}

        {playerLines.length > 0 && <section className="checkout-section checkout-section--compact"><div className="checkout-section__intro"><span className="checkout-step">{hasPhysical ? '03' : '02'}</span><div><h2>Dados do jogador</h2><p>Alguns produtos precisam do ID da conta para serem entregues corretamente.</p></div></div>
          {playerLines.map(({ product }) => <div className="checkout-product-data" key={product.id}><div className="checkout-product-data__heading"><strong>{product.name}</strong><span>ID obrigatório</span></div>{savedPlayerIds.length > 0 && <label className="field"><span>Usar ID guardado</span><select value="" onChange={(event) => { const saved = savedPlayerIds.find((item) => item.player_id === event.target.value); if (!saved) return; setPlayerIds((current) => ({ ...current, [product.id]: saved.player_id })); setPlayerNames((current) => ({ ...current, [product.id]: saved.player_nickname })); }}><option value="">Selecionar do histórico…</option>{savedPlayerIds.map((saved) => <option key={saved.id} value={saved.player_id}>{saved.player_id} — {saved.player_nickname}</option>)}</select></label>}<div className="form-row"><label className="field"><span>ID do jogador *</span><input inputMode="numeric" value={playerIds[product.id] ?? ''} onChange={(event) => { setPlayerIds((current) => ({ ...current, [product.id]: event.target.value })); setPlayerNames((current) => ({ ...current, [product.id]: '' })); }} placeholder="ID numérico da conta" /></label><label className="field"><span>Nickname verificado automaticamente</span><div className="checkout-inline-control"><input value={playerNames[product.id] ?? ''} readOnly placeholder="Faça a consulta para obter o nickname" /><button type="button" className="btn btn--outline btn--sm" disabled={verifyingPlayer === product.id || !playerIds[product.id]} onClick={() => void verifyPlayer(product.id)}>{verifyingPlayer === product.id ? 'A verificar…' : playerNames[product.id] ? 'Verificar novamente' : 'Consultar ID'}</button></div></label></div>{playerNames[product.id] && <p className="checkout-verified-note">✓ Conta confirmada: <strong>{playerNames[product.id]}</strong>. Este ID e nickname serão enviados com a encomenda.</p>}</div>)}
        </section>}

        <section className="checkout-section checkout-section--compact"><div className="checkout-section__intro"><span className="checkout-step">{hasPhysical || playerLines.length ? '04' : '02'}</span><div><h2>Produtos e observações</h2><p>Reveja variantes e deixe uma nota, se necessário.</p></div></div>
          {cartLines.map(({ product, variant }) => { const key = variantKey(product.id, variant?.id); return <div className="checkout-product-data" key={key}><div className="checkout-product-data__heading"><strong>{product.name}</strong><span>{product.categoryType === 'physical' ? 'Produto físico' : 'Produto digital'}</span></div>{product.variants?.length ? <label className={`field ${errors[`variant-${key}`] ? 'has-error' : ''}`}><span>Opção *</span><select value={variantSelection[key] ?? (variant ? String(variant.id) : '')} onChange={(event) => { const id = Number(event.target.value); setVariantSelection((current) => ({ ...current, [variantKey(product.id, id)]: event.target.value })); if (id) setVariant(product.id, id, variant?.id); setErrors((current) => ({ ...current, [`variant-${key}`]: '' })); }}><option value="">Escolher opção</option>{product.variants.map((option) => <option key={option.id} value={option.id}>{option.name} — {formatUsdAsAoa(option.priceUsd, rate)}</option>)}</select>{errors[`variant-${key}`] && <small>{errors[`variant-${key}`]}</small>}</label> : product.isDynamic ? <p className="checkout-product-data__unavailable">As opções deste produto estão temporariamente indisponíveis.</p> : null}</div>; })}
          <label className="field"><span>Notas do pedido (opcional)</span><textarea rows={3} value={customer.notes} onChange={(event) => update('notes', event.target.value)} placeholder={hasPhysical ? 'Referência do bairro ou instrução de entrega.' : 'Alguma informação para a equipa GameAO?'}/></label>
        </section>
      </div>

      <aside className="order-summary"><div className="order-summary__eyebrow">Resumo do pedido</div><h2>{hasPhysical && hasDigital ? 'Produtos físicos e digitais' : hasPhysical ? 'Entrega física' : 'Entrega digital'}</h2><ul className="order-summary__items">{cartLines.map(({ product, qty, variant, unitPriceUsd }) => <li key={variantKey(product.id, variant?.id)}><img src={product.imageCard} alt=""/><span className="order-summary__name">{product.name} × {qty}<small>{variant?.name ?? (product.categoryType === 'physical' ? 'Físico' : playerLines.some(({ product: item }) => item.id === product.id) ? 'Digital · ID de jogador' : 'Digital')}</small></span><Price usd={unitPriceUsd * qty} size="sm"/></li>)}</ul><div className="order-summary__row"><span>Subtotal</span><span>{formatUsdAsAoa(cartSubtotalUsd, rate)}</span></div>{cartDiscountUsd > 0 && <div className="order-summary__row order-summary__row--discount"><span>Desconto</span><span>− {formatUsdAsAoa(cartDiscountUsd, rate)}</span></div>}<div className="order-summary__row order-summary__row--total"><span>Total</span><strong>{formatUsdAsAoa(totalUsd, rate)}</strong></div>
        <div className="payment-box"><h3>Método de pagamento</h3>{paymentMethods.length > 0 ? <><label className={`field ${errors.paymentMethod ? 'has-error' : ''}`}><span>Escolha uma modalidade *</span><select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); setErrors((current) => ({ ...current, paymentMethod: '' })); }}><option value="">Selecionar método</option>{paymentMethods.map((method) => <option key={method.code} value={method.code}>{method.name}</option>)}</select>{errors.paymentMethod && <small>{errors.paymentMethod}</small>}</label>{paymentMethod && (() => { const method = paymentMethods.find((item) => item.code === paymentMethod); return method ? <div className="payment-instructions"><p className="payment-box__note">{method.customer_message || method.description}</p>{method.instructions && <p className="payment-box__note"><strong>Instruções:</strong> {method.instructions}</p>}{method.payment_deadline_hours && <p className="payment-box__note">Prazo indicado: {method.payment_deadline_hours} horas.</p>}{method.receiving_data && <div className="payment-receiving-data">{Object.entries(method.receiving_data).map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</strong></div>)}</div>}</div> : null; })()}</> : <p className="payment-box__note">Os métodos de pagamento estão a ser configurados pela GameAO. O pedido ficará pendente até confirmação.</p>}<label className="field"><span>Cupão de desconto (opcional)</span><input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Código do cupão" /></label><label className="field"><span>Código de convite (opcional)</span><input value={affiliateCode} onChange={(event) => setAffiliateCode(normalizeAffiliateCode(event.target.value))} placeholder="Código do afiliado" /></label><p className="payment-box__note">O desconto final é validado no servidor antes da criação da encomenda.</p></div>
        <p className="order-summary__privacy">Os seus dados são usados apenas para criar e acompanhar a encomenda. Produtos digitais são entregues instantaneamente após confirmação; produtos físicos têm prazo mínimo de 24 horas.</p><button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>{submitting ? 'A criar encomenda…' : 'Efetuar pedido'}</button><Link to="/cart" className="order-summary__back">← Voltar ao carrinho</Link>
      </aside>
    </form>
  </PageShell>;
}
