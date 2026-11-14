const STORAGE_KEY = 'gameao.affiliate.code';
const EXPIRES_KEY = 'gameao.affiliate.expires';
const DAYS = 30;

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, '').toUpperCase().slice(0, 50);
}

export function captureAffiliateCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalize(params.get('ref') || params.get('convite') || params.get('affiliate'));
  if (fromUrl) {
    window.localStorage.setItem(STORAGE_KEY, fromUrl);
    window.localStorage.setItem(EXPIRES_KEY, String(Date.now() + DAYS * 24 * 60 * 60 * 1000));
    return fromUrl;
  }
  const expires = Number(window.localStorage.getItem(EXPIRES_KEY) || 0);
  const stored = normalize(window.localStorage.getItem(STORAGE_KEY));
  if (!stored || (expires > 0 && expires < Date.now())) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(EXPIRES_KEY);
    return '';
  }
  return stored;
}

export function getStoredAffiliateCode(): string {
  return captureAffiliateCodeFromUrl();
}

export function normalizeAffiliateCode(value: string | null | undefined): string {
  return normalize(value);
}
