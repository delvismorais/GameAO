import type { Express, Request } from 'express';
import { getPool } from './db';

/**
 * SEO do lado do servidor.
 *
 * A aplicação é uma SPA, mas os motores de busca e, sobretudo, as pré-visualizações
 * de links (WhatsApp, Facebook, X) não executam JavaScript. Por isso o HTML inicial
 * já sai com título, descrição, canonical, Open Graph e JSON-LD específicos da rota.
 */

const DEFAULT_TITLE = 'GameAO — Loja de Videojogos em Angola';
const DEFAULT_DESCRIPTION =
  'Compre jogos para PS4, PS5, Xbox e PC, diamantes Free Fire, Robux e assinaturas digitais em Angola. Entrega imediata, preços em kwanzas e apoio por WhatsApp.';

type Meta = {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

type CacheEntry = { html: string; expires: number };
const htmlCache = new Map<string, CacheEntry>();
const sitemapCache = new Map<string, CacheEntry>();
const CACHE_MS = 60_000;

export function baseUrl(request: Request): string {
  const configured = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  const proto = String(request.headers['x-forwarded-proto'] ?? request.protocol ?? 'https').split(',')[0]?.trim();
  const host = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? 'gameao.onrender.com').split(',')[0]?.trim();
  return `${proto}://${host}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absolute(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function money(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

async function metaForPath(pathname: string, base: string): Promise<Meta> {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      image: '/assets/home1/slide-1.jpg',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'GameAO',
          url: base,
          logo: `${base}/assets/logo.png`,
          areaServed: 'AO',
          description: DEFAULT_DESCRIPTION,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'GameAO',
          url: base,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${base}/shop?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    };
  }

  const productMatch = clean.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    const slug = decodeURIComponent(productMatch[1]);
    const [rows] = await getPool().execute<any[]>(
      `SELECT name, slug, short_description, image_url, sale_price_usd, base_price_usd, stock_quantity, is_active
         FROM catalog_products WHERE slug = ? LIMIT 1`,
      [slug],
    );
    const product = rows[0];
    if (product && Number(product.is_active) !== 0) {
      const price = Number(product.sale_price_usd ?? product.base_price_usd ?? 0);
      return {
        title: `${product.name} — GameAO`,
        description: String(product.short_description ?? DEFAULT_DESCRIPTION).slice(0, 300),
        image: product.image_url,
        type: 'product',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: String(product.short_description ?? ''),
          image: absolute(product.image_url, base),
          url: `${base}/product/${product.slug}`,
          brand: { '@type': 'Brand', name: 'GameAO' },
          offers: {
            '@type': 'Offer',
            price: money(price),
            priceCurrency: 'AOA',
            availability:
              product.stock_quantity != null && Number(product.stock_quantity) <= 0
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
            url: `${base}/product/${product.slug}`,
          },
        },
      };
    }
  }

  const postMatch = clean.match(/^\/blog\/([^/]+)$/);
  if (postMatch) {
    const slug = decodeURIComponent(postMatch[1]);
    const [rows] = await getPool().execute<any[]>(
      `SELECT title, slug, excerpt, image_url, published_date FROM content_posts WHERE slug = ? AND status = 'published' LIMIT 1`,
      [slug],
    );
    const post = rows[0];
    if (post) {
      return {
        title: `${post.title} — Notícias GameAO`,
        description: String(post.excerpt ?? DEFAULT_DESCRIPTION).slice(0, 300),
        image: post.image_url,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: post.title,
          description: String(post.excerpt ?? ''),
          image: absolute(post.image_url, base),
          datePublished: post.published_date ? new Date(post.published_date).toISOString() : undefined,
          publisher: { '@type': 'Organization', name: 'GameAO', logo: { '@type': 'ImageObject', url: `${base}/assets/logo.png` } },
          mainEntityOfPage: `${base}/blog/${post.slug}`,
        },
      };
    }
  }

  const pages: Record<string, Meta> = {
    '/shop': {
      title: 'Loja — todos os jogos e produtos digitais | GameAO',
      description: 'Explore o catálogo completo: jogos para PS4, PS5, Xbox e PC, diamantes Free Fire, Robux, assinaturas e acessórios gamer.',
    },
    '/category/news': {
      title: 'Notícias e novidades gaming | GameAO',
      description: 'Análises, lançamentos e guias sobre videojogos, Free Fire, Roblox e consolas, escritos pela equipa GameAO.',
    },
    '/about-us': {
      title: 'Sobre a GameAO — loja de videojogos em Angola',
      description: 'Quem somos, como entregamos e porque milhares de jogadores angolanos compram na GameAO.',
    },
    '/contact-us': {
      title: 'Contacto e apoio ao cliente | GameAO',
      description: 'Fale com a equipa GameAO por WhatsApp ou email. Apoio em português, todos os dias.',
    },
    '/faqs': {
      title: 'Perguntas frequentes | GameAO',
      description: 'Formas de pagamento, prazos de entrega, comprovativos e tudo o que precisa de saber antes de comprar.',
    },
    '/acompanhar-pedido': {
      title: 'Acompanhar pedido | GameAO',
      description: 'Consulte o estado da sua encomenda e envie o comprovativo de pagamento em segundos.',
    },
    '/politica-de-privacidade': {
      title: 'Política de privacidade | GameAO',
      description: 'Como a GameAO recolhe, utiliza e protege os seus dados pessoais.',
    },
    '/termos-e-condicoes': {
      title: 'Termos e condições | GameAO',
      description: 'Condições de venda, entregas, devoluções e garantias da GameAO.',
    },
  };
  if (pages[clean]) return pages[clean];

  if (clean.startsWith('/product-category/')) {
    const slug = decodeURIComponent(clean.replace('/product-category/', ''));
    const [rows] = await getPool().execute<any[]>(`SELECT name, description FROM catalog_categories WHERE slug = ? LIMIT 1`, [slug]);
    const category = rows[0];
    if (category) {
      return {
        title: `${category.name} — GameAO`,
        description: String(category.description ?? DEFAULT_DESCRIPTION).slice(0, 300),
      };
    }
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, noindex: clean !== '/' };
}

function renderMeta(meta: Meta, canonical: string, base: string): string {
  const image = absolute(meta.image, base) ?? `${base}/assets/logo.png`;
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="GameAO" />`,
    `<meta property="og:locale" content="pt_AO" />`,
    `<meta property="og:type" content="${meta.type ?? 'website'}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];
  if (meta.noindex) tags.push('<meta name="robots" content="noindex, follow" />');
  if (meta.jsonLd) {
    const blocks = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    for (const block of blocks) {
      tags.push(`<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`);
    }
  }
  return tags.join('\n    ');
}

/** Injeta as meta tags da rota no HTML base (com cache curto por caminho). */
export async function injectSeo(html: string, request: Request): Promise<string> {
  const base = baseUrl(request);
  const pathname = request.path || '/';
  const key = `${base}|${pathname}`;
  const cached = htmlCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.html;

  const canonical = `${base}${pathname === '/' ? '' : pathname}`;
  let meta: Meta;
  try {
    meta = await metaForPath(pathname, base);
  } catch {
    meta = { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  }
  const tags = renderMeta(meta, canonical, base);
  const result = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace('</head>', `    ${tags}\n  </head>`);
  htmlCache.set(key, { html: result, expires: Date.now() + CACHE_MS });
  if (htmlCache.size > 500) htmlCache.clear();
  return result;
}

/** robots.txt e sitemap.xml dinâmicos. */
export function registerSeoRoutes(app: Express): void {
  app.get('/robots.txt', (request, response) => {
    const base = baseUrl(request);
    response
      .type('text/plain')
      .send(['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /checkout', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n'));
  });

  app.get('/sitemap.xml', async (request, response) => {
    const base = baseUrl(request);
    const cached = sitemapCache.get(base);
    if (cached && cached.expires > Date.now()) {
      response.type('application/xml').send(cached.html);
      return;
    }
    try {
      const [products] = await getPool().query<any[]>(
        `SELECT slug, COALESCE(updated_at, created_at, NOW()) AS updated FROM catalog_products WHERE is_active = 1 ORDER BY shop_order ASC`,
      );
      const [posts] = await getPool().query<any[]>(
        `SELECT slug, COALESCE(updated_at, published_at, NOW()) AS updated FROM content_posts WHERE status = 'published' ORDER BY published_at DESC`,
      );
      const [categories] = await getPool().query<any[]>(`SELECT slug FROM catalog_categories ORDER BY sort_order ASC`);
      const urls: Array<{ loc: string; lastmod?: string; priority: string; changefreq: string }> = [
        { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
        { loc: `${base}/shop`, priority: '0.9', changefreq: 'daily' },
        { loc: `${base}/category/news`, priority: '0.6', changefreq: 'weekly' },
        { loc: `${base}/about-us`, priority: '0.4', changefreq: 'monthly' },
        { loc: `${base}/contact-us`, priority: '0.4', changefreq: 'monthly' },
        { loc: `${base}/faqs`, priority: '0.4', changefreq: 'monthly' },
        { loc: `${base}/acompanhar-pedido`, priority: '0.3', changefreq: 'monthly' },
      ];
      for (const category of categories) {
        urls.push({ loc: `${base}/product-category/${category.slug}`, priority: '0.7', changefreq: 'weekly' });
      }
      for (const product of products) {
        urls.push({ loc: `${base}/product/${product.slug}`, lastmod: new Date(product.updated).toISOString(), priority: '0.8', changefreq: 'weekly' });
      }
      for (const post of posts) {
        urls.push({ loc: `${base}/blog/${post.slug}`, lastmod: new Date(post.updated).toISOString(), priority: '0.6', changefreq: 'monthly' });
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((url) => `  <url><loc>${escapeHtml(url.loc)}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}<changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`)
        .join('\n')}\n</urlset>\n`;
      sitemapCache.set(base, { html: xml, expires: Date.now() + CACHE_MS * 10 });
      response.type('application/xml').send(xml);
    } catch {
      response.status(500).type('text/plain').send('sitemap indisponível');
    }
  });
}
