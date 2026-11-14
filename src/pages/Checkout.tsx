import { useMemo, useState } from 'react';
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

const PROVINCES = [
  'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 'Cuanza Sul',
  'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
  'Namibe', 'Uíge', 'Zaire',
];

const COUNTRIES = ['Angola', 'Portugal', 'Brasil', 'África do Sul', 'Namíbia', 'República Democrática do Congo', 'Zâmbia'];

const EMPTY_CUSTOMER: Customer = {
  firstName: '', lastName: '', company: '', country: 'Angola', address: '', apartment: '',
  city: '', province: 'Luanda', postalCode: '', phone: '', email: '', notes: '',
};

export function Checkout() {
  const { cartLines, cartSubtotalUsd, cartDiscountUsd, user, clearCart } = useStore();
  const { rate } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer>(() => ({
    ...EMPTY_CUSTOMER,
    firstName: user?.name.split(' ')[0] ?? '',
    lastName: user?.name.split(' ').slice(1).join(' ') ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalUsd = cartSubtotalUsd - cartDiscountUsd;

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email.trim()), [customer.email]);

  if (cartLines.length === 0) {
    return (
      <PageShell crumbs={[{ label: 'Finalizar Compra' }]}>
        <h1 className="page-title">Finalizar Compra</h1>
        <EmptyState
          title="O carrinho está vazio"
          icon="🛒"
          action={<Link to="/shop" className="btn btn--primary">Escolher jogos</Link>}
        >
          Adicione produtos ao carrinho antes de finalizar a compra.
        </EmptyState>
      </PageShell>
    );
  }

  const update = (key: keyof Customer, value: string) => {
    setCustomer((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!customer.firstName.trim()) next.firstName = 'Indique o nome.';
    if (!customer.lastName.trim()) next.lastName = 'Indique o apelido.';
    if (!customer.address.trim()) next.address = 'Indique o endereço.';
    if (!customer.city.trim()) next.city = 'Indique a cidade.';
    if (!customer.province) next.province = 'Escolha a província.';
    if (!customer.phone.trim() || customer.phone.replace(/\D/g, '').length < 9) next.phone = 'Indique um telefone válido (mínimo 9 dígitos).';
    if (!emailValid) next.email = 'Indique um email válido.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      showToast('Verifique os campos assinalados antes de confirmar a encomenda.', 'error');
      return;
    }
    const response = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ rate, customer, items: cartLines.map(({ product, qty }) => ({ productId: product.id, qty })) }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { message?: string } | null;
      showToast(data?.message ?? 'Não foi possível registar a encomenda.', 'error');
      return;
    }
    const data = await response.json() as { orderNumber: string };
    clearCart();
    navigate(`/checkout/confirmacao?order=${encodeURIComponent(data.orderNumber)}&email=${encodeURIComponent(customer.email)}`);
  };

  return (
    <PageShell crumbs={[{ label: 'Carrinho', href: '/cart' }, { label: 'Finalizar Compra' }]}>
      <h1 className="page-title">Finalizar Compra</h1>
      <p className="page-subtitle">Preencha os dados de faturação e reveja a sua encomenda.</p>

      <div className="checkout-note">
        <Icon name="clock" />
        <span>
            <strong>Pagamento na entrega:</strong> os dados serão registados e a confirmação ficará disponível
            com o número único da encomenda.
        </span>
      </div>

      <form className="checkout-layout" onSubmit={submit} noValidate>
        <div className="checkout-main">
          <section className="checkout-section">
            <h2>Dados de faturação</h2>
            <div className="form-row">
              <label className={`field ${errors.firstName ? 'has-error' : ''}`.trim()}>
                <span>Nome *</span>
                <input value={customer.firstName} onChange={(event) => update('firstName', event.target.value)} autoComplete="given-name" />
                {errors.firstName && <small>{errors.firstName}</small>}
              </label>
              <label className={`field ${errors.lastName ? 'has-error' : ''}`.trim()}>
                <span>Apelido *</span>
                <input value={customer.lastName} onChange={(event) => update('lastName', event.target.value)} autoComplete="family-name" />
                {errors.lastName && <small>{errors.lastName}</small>}
              </label>
            </div>

            <label className="field">
              <span>Nome da empresa (opcional)</span>
              <input value={customer.company} onChange={(event) => update('company', event.target.value)} autoComplete="organization" />
            </label>

            <label className="field">
              <span>País / Região *</span>
              <select value={customer.country} onChange={(event) => update('country', event.target.value)} autoComplete="country-name">
                {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
              </select>
            </label>

            <label className={`field ${errors.address ? 'has-error' : ''}`.trim()}>
              <span>Endereço *</span>
              <input value={customer.address} onChange={(event) => update('address', event.target.value)} placeholder="Rua, número, bairro" autoComplete="street-address" />
              {errors.address && <small>{errors.address}</small>}
            </label>

            <label className="field">
              <span>Apartamento, suite, andar (opcional)</span>
              <input value={customer.apartment} onChange={(event) => update('apartment', event.target.value)} autoComplete="address-line2" />
            </label>

            <div className="form-row">
              <label className={`field ${errors.city ? 'has-error' : ''}`.trim()}>
                <span>Cidade *</span>
                <input value={customer.city} onChange={(event) => update('city', event.target.value)} autoComplete="address-level2" />
                {errors.city && <small>{errors.city}</small>}
              </label>
              <label className={`field ${errors.province ? 'has-error' : ''}`.trim()}>
                <span>Província *</span>
                <select value={customer.province} onChange={(event) => update('province', event.target.value)} autoComplete="address-level1">
                  {PROVINCES.map((province) => <option key={province}>{province}</option>)}
                </select>
                {errors.province && <small>{errors.province}</small>}
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                <span>Código postal (opcional)</span>
                <input value={customer.postalCode} onChange={(event) => update('postalCode', event.target.value)} autoComplete="postal-code" />
              </label>
              <label className={`field ${errors.phone ? 'has-error' : ''}`.trim()}>
                <span>Telefone *</span>
                <input value={customer.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+244 9XX XXX XXX" autoComplete="tel" />
                {errors.phone && <small>{errors.phone}</small>}
              </label>
            </div>

            <label className={`field ${errors.email ? 'has-error' : ''}`.trim()}>
              <span>Email *</span>
              <input type="email" value={customer.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" />
              {errors.email && <small>{errors.email}</small>}
            </label>
          </section>

          <section className="checkout-section">
            <h2>Informações adicionais</h2>
            <label className="field">
              <span>Notas da encomenda (opcional)</span>
              <textarea rows={4} value={customer.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Instruções de entrega, referência do bairro, etc." />
            </label>
          </section>
        </div>

        <aside className="order-summary">
          <h2>A sua encomenda</h2>
          <ul className="order-summary__items">
            {cartLines.map(({ product, qty }) => (
              <li key={product.id}>
                <img src={product.imageCard} alt="" />
                <span className="order-summary__name">{product.name} × {qty}</span>
                <Price usd={getEffectivePriceUsd(product) * qty} size="sm" />
              </li>
            ))}
          </ul>
          <div className="order-summary__row">
            <span>Subtotal</span>
            <span>{formatUsdAsAoa(cartSubtotalUsd, rate)}</span>
          </div>
          {cartDiscountUsd > 0 && (
            <div className="order-summary__row order-summary__row--discount">
              <span>Desconto</span>
              <span>− {formatUsdAsAoa(cartDiscountUsd, rate)}</span>
            </div>
          )}
          <div className="order-summary__row order-summary__row--total">
            <span>Total</span>
            <strong>{formatUsdAsAoa(totalUsd, rate)}</strong>
          </div>

          <div className="payment-box">
            <h3>Método de pagamento</h3>
            <p className="payment-box__note">Pagamento online ainda não configurado. A encomenda será criada como pendente.</p>
            <p className="payment-box__note">
              A taxa aplicada é {formatUsdAsAoa(rate, 1)} por 1 USD. O total final fica registado
              com esta taxa.
            </p>
          </div>

          <p className="order-summary__privacy">
            Os dados preenchidos só serão enviados quando existir um método de pagamento validado
            e uma política de tratamento configurada.
          </p>
          <button type="submit" className="btn btn--primary btn--block btn--lg">
            Registar encomenda
          </button>
          <Link to="/cart" className="order-summary__back">← Voltar ao carrinho</Link>
        </aside>
      </form>
    </PageShell>
  );
}
