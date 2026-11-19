import { useEffect } from 'react';

type SeoOptions = {
  title: string;
  description?: string;
  /** Caminho canónico, por exemplo `/product/forza-horizon-5`. */
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsert(selector: string, create: () => HTMLElement, apply: (element: HTMLElement) => void): void {
  let element = document.head.querySelector<HTMLElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  apply(element);
}

function meta(attr: 'name' | 'property', key: string, content: string): void {
  upsert(
    `meta[${attr}="${key}"]`,
    () => {
      const tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      return tag;
    },
    (element) => element.setAttribute('content', content),
  );
}

/**
 * Atualiza as meta tags da página atual. O servidor já injeta as mesmas tags no
 * HTML inicial; este hook mantém tudo coerente durante a navegação no browser.
 */
export function useSeo({ title, description, path, image, type = 'website', noindex, jsonLd }: SeoOptions): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    if (description) meta('name', 'description', description);

    const canonicalUrl = `${window.location.origin}${path ?? window.location.pathname}`;
    upsert(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        return link;
      },
      (element) => element.setAttribute('href', canonicalUrl),
    );

    meta('property', 'og:title', title);
    if (description) meta('property', 'og:description', description);
    meta('property', 'og:url', canonicalUrl);
    meta('property', 'og:type', type);
    meta('name', 'twitter:title', title);
    if (description) meta('name', 'twitter:description', description);
    if (image) {
      const absolute = image.startsWith('http') ? image : `${window.location.origin}${image}`;
      meta('property', 'og:image', absolute);
      meta('name', 'twitter:image', absolute);
    }
    meta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seo = 'route';
      script.textContent = JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      script?.remove();
    };
  }, [title, description, path, image, type, noindex, jsonLd]);
}
