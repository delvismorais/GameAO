import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Price } from '../components/ui/Price';
import { Icon } from '../components/ui/Icon';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { formatAoa, formatDatePt } from '../lib/pricing';
import { getEffectivePriceUsd, PRODUCTS } from '../data/products';
import { DEFAULT_EXCHANGE_RATE } from '../config/store';

const PREVIEW_IDS = ['game-1', 'game-2', 'game-8'];

function parseRate(value: string): number {
  const clean = value.trim();
  if (!clean) return Number.NaN;
  if (clean.includes(',') && clean.includes('.')) {
    return Number(clean.replace(/\./g, '').replace(',', '.'));
  }
  if (clean.includes(',')) return Number(clean.replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+$/.test(clean)) return Number(clean.replace(/\./g, ''));
  return Number(clean);
}

function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function displayToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Settings() {
  const { config, updateConfig, resetConfig } = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    rate: String(config.usdToAoa).replace('.', ','),
    source: config.source,
    updatedAt: isoToDisplay(config.updatedAt),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({
      rate: String(config.usdToAoa).replace('.', ','),
      source: config.source,
      updatedAt: isoToDisplay(config.updatedAt),
    });
  }, [config]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseRate(form.rate);
    const nextErrors: Record<string, string> = {};
    if (!Number.isFinite(parsed) || parsed <= 0) nextErrors.rate = 'Indique uma taxa superior a zero.';
    else if (parsed > 1_000_000) nextErrors.rate = 'A taxa indicada é demasiado alta.';
    if (!form.source.trim()) nextErrors.source = 'Indique a fonte da taxa.';
    const isoDate = displayToIso(form.updatedAt);
    if (!isoDate) nextErrors.updatedAt = 'Use o formato DD/MM/AAAA.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('Verifique os campos da configuração da taxa.', 'error');
      return;
    }
    updateConfig({
      usdToAoa: parsed,
      source: form.source.trim(),
      updatedAt: isoDate!,
      note: config.note,
    });
    showToast('Taxa atualizada. Todos os preços da loja foram recalculados automaticamente.');
  };

  const reset = () => {
    resetConfig();
    showToast('Taxa reposta para o valor de referência do BNA.', 'info');
  };

  const previewProducts = PRODUCTS.filter((product) => PREVIEW_IDS.includes(product.id));

  return (
    <PageShell crumbs={[{ label: 'Configurações' }]}>
      <h1 className="page-title">Configurações da Loja</h1>
      <p className="page-subtitle">
        A taxa de conversão USD/AOA é o único ponto de configuração monetária. Todos os preços da
        loja, carrinho, descontos, comparação e checkout são calculados a partir dela.
      </p>

      <div className="settings-current">
        <div>
          <span>Taxa em vigor</span>
          <strong>1 USD = {formatAoa(config.usdToAoa)}</strong>
        </div>
        <div>
          <span>Fonte</span>
          <strong>{config.source}</strong>
        </div>
        <div>
          <span>Data de referência</span>
          <strong>{formatDatePt(config.updatedAt)}</strong>
        </div>
      </div>

      <div className="settings-layout">
        <section className="settings-panel">
          <h2>Taxa de conversão</h2>
          <form onSubmit={submit} className="settings-form" noValidate>
            <label className={`field ${errors.rate ? 'has-error' : ''}`.trim()}>
              <span>Kwanzas por 1 dólar (USD → AOA) *</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.rate}
                onChange={(event) => {
                  setForm((current) => ({ ...current, rate: event.target.value }));
                  setErrors((current) => ({ ...current, rate: '' }));
                }}
                placeholder="913 ou 913,5"
              />
              {errors.rate ? <small>{errors.rate}</small> : <small>Exemplo: 913 ou 913,5. Aceita vírgula ou ponto como separador decimal.</small>}
            </label>

            <label className={`field ${errors.source ? 'has-error' : ''}`.trim()}>
              <span>Fonte da taxa *</span>
              <input
                value={form.source}
                onChange={(event) => {
                  setForm((current) => ({ ...current, source: event.target.value }));
                  setErrors((current) => ({ ...current, source: '' }));
                }}
                placeholder="Banco Nacional de Angola (BNA)"
              />
              {errors.source && <small>{errors.source}</small>}
            </label>

            <label className={`field ${errors.updatedAt ? 'has-error' : ''}`.trim()}>
              <span>Data de referência *</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.updatedAt}
                onChange={(event) => {
                  setForm((current) => ({ ...current, updatedAt: event.target.value }));
                  setErrors((current) => ({ ...current, updatedAt: '' }));
                }}
                placeholder="DD/MM/AAAA"
              />
              {errors.updatedAt ? <small>{errors.updatedAt}</small> : <small>Formato DD/MM/AAAA, por exemplo 13/11/2026.</small>}
            </label>

            <div className="settings-actions">
              <button type="submit" className="btn btn--primary">Guardar taxa</button>
              <button type="button" className="btn btn--outline" onClick={reset}>
                Repor BNA ({formatAoa(DEFAULT_EXCHANGE_RATE.usdToAoa)})
              </button>
            </div>
            <p className="settings-note">
              <Icon name="check" /> {config.note}
            </p>
          </form>
        </section>

        <aside className="settings-info">
          <h2>Como funciona</h2>
          <ul>
            <li>Os preços-base dos produtos são armazenados internamente em USD.</li>
            <li>O preço final é calculado no momento da apresentação: <code>preço-base × taxa</code></li>
            <li>O carrinho, os descontos, a comparação e o checkout usam a mesma taxa em vigor.</li>
            <li>As encomendas já registadas mantêm a taxa usada no momento da confirmação.</li>
            <li>Nenhum preço de produto em AOA está escrito diretamente no código.</li>
          </ul>
          <p>
            A taxa por omissão é a referência do BNA consultada a 13/11/2026. Para atualizar,
            substitua o valor e a data e guarde.
          </p>
        </aside>
      </div>

      <section className="settings-preview">
        <div className="settings-preview__head">
          <h2>Pré-visualização imediata</h2>
          <span>Valores calculados com a taxa em vigor</span>
        </div>
        <div className="settings-preview__grid">
          {previewProducts.map((product) => (
            <article key={product.id} className="settings-preview-card">
              <img src={product.imageCard} alt="" />
              <div>
                <h3>{product.name}</h3>
                <Price usd={getEffectivePriceUsd(product)} baseUsd={product.basePriceUsd} size="sm" />
              </div>
            </article>
          ))}
        </div>
        <p className="settings-preview__link">
          Depois de guardar, abra a <Link to="/shop">Loja</Link> ou o <Link to="/cart">Carrinho</Link>{' '}
          para confirmar que todos os valores foram atualizados.
        </p>
      </section>
    </PageShell>
  );
}
