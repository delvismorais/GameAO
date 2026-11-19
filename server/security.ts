import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from './auth';

/**
 * Camada de segurança transversal: cabeçalhos, proteção CSRF por Origin,
 * limitação de pedidos e autorização por capacidade.
 */

export type Capability =
  | 'orders' | 'products' | 'content' | 'customers' | 'payments'
  | 'settings' | 'admins' | 'marketing' | 'media' | 'reports';

const ALL_CAPABILITIES: Capability[] = ['orders', 'products', 'content', 'customers', 'payments', 'settings', 'admins', 'marketing', 'media', 'reports'];

/**
 * Matriz de permissões. `admin` mantém acesso total para não bloquear a equipa
 * atual; os restantes papéis ficam limitados à sua área.
 */
const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  super_admin: ALL_CAPABILITIES,
  admin: ALL_CAPABILITIES,
  order_manager: ['orders', 'customers', 'reports'],
  product_manager: ['products', 'media', 'reports'],
  content_manager: ['content', 'media'],
  support: ['orders', 'customers'],
  customer: [],
};

export function capabilitiesFor(role: string | undefined | null): Capability[] {
  return ROLE_CAPABILITIES[String(role ?? '')] ?? [];
}

export function hasCapability(user: AuthUser | null, capability: Capability): boolean {
  if (!user) return false;
  return capabilitiesFor(user.role).includes(capability);
}

// ---------------------------------------------------------------------------
// Cabeçalhos de segurança
// ---------------------------------------------------------------------------
export function securityHeaders(_request: Request, response: Response, next: NextFunction): void {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('X-DNS-Prefetch-Control', 'on');
  response.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:",
      "form-action 'self'",
    ].join('; '),
  );
  if (process.env.NODE_ENV === 'production') {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// ---------------------------------------------------------------------------
// Proteção CSRF: validação de Origin/Referer nas mutações
// ---------------------------------------------------------------------------
function hostOf(value: string | undefined): string | null {
  if (!value) return null;
  try { return new URL(value).host.toLowerCase(); } catch { return null; }
}

export function sameOriginGuard(request: Request, response: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) { next(); return; }
  const requestHost = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? '').toLowerCase();
  const origin = request.headers.origin;
  const referer = request.headers.referer;
  const fetchSite = String(request.headers['sec-fetch-site'] ?? '');
  if (fetchSite === 'cross-site') {
    response.status(403).json({ error: 'csrf_blocked', message: 'Pedido bloqueado por política de segurança (cross-site).' });
    return;
  }
  if (origin) {
    const originHost = hostOf(origin);
    if (originHost && requestHost && originHost !== requestHost) {
      response.status(403).json({ error: 'csrf_blocked', message: 'Origem do pedido não autorizada.' });
      return;
    }
  } else if (referer) {
    const refererHost = hostOf(referer);
    if (refererHost && requestHost && refererHost !== requestHost) {
      response.status(403).json({ error: 'csrf_blocked', message: 'Origem do pedido não autorizada.' });
      return;
    }
  }
  next();
}

// ---------------------------------------------------------------------------
// Rate limiting em memória (suficiente para uma instância; sem dependências)
// ---------------------------------------------------------------------------
interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return request.ip ?? request.socket.remoteAddress ?? 'desconhecido';
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Identificador adicional (ex.: email) para limitar por conta. */
  key?: (request: Request) => string;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const now = Date.now();
    sweep(now);
    const identifier = `${clientIp(request)}|${options.key ? options.key(request) : ''}`;
    const key = `${request.method}:${request.baseUrl}${request.path}|${identifier}`;
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      response.setHeader('X-RateLimit-Limit', String(options.max));
      response.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.max - 1)));
      next();
      return;
    }
    current.count += 1;
    const remaining = Math.max(0, options.max - current.count);
    response.setHeader('X-RateLimit-Limit', String(options.max));
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    if (current.count > options.max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      response.setHeader('Retry-After', String(retryAfter));
      response.status(429).json({ error: 'rate_limited', message: options.message ?? 'Demasiados pedidos. Aguarde alguns instantes e tente novamente.' });
      return;
    }
    next();
  };
}
