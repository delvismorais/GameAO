import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../data/products';
import { CONTACT_INFO, FOOTER_TAGS, SOCIALS } from '../../data/site';
import { POSTS } from '../../data/posts';
import { formatDatePt } from '../../lib/pricing';
import { STORE_INFO } from '../../config/store';
import { Icon } from '../ui/Icon';
import { useToast } from '../../context/ToastContext';

export function Footer() {
  const { showToast } = useToast();
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const blogPosts = POSTS.slice(0, 2);
  useEffect(() => {
    void fetch('/api/site/config').then((response) => response.ok ? response.json() : null).then((data: { socials?: Array<{ label?: string; url?: string; href?: string }> } | null) => {
      const next: Record<string, string> = {};
      for (const item of data?.socials ?? []) if (item.label && (item.url || item.href)) next[item.label.toLowerCase()] = item.url || item.href || '';
      setSocialLinks(next);
    }).catch(() => undefined);
  }, []);
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="footer-col footer-col--about">
          <Link to="/" className="footer-logo">
            <img src="/assets/gameao-logo.png" alt="GameAO" />
          </Link>
          <p>
            {STORE_INFO.tagline}
          </p>
          <ul className="footer-contact">
            <li>{CONTACT_INFO.email}</li>
            <li>{CONTACT_INFO.phones[0].value}</li>
            <li>{CONTACT_INFO.addresses[0]}</li>
          </ul>
          <div className="footer-socials">
            {SOCIALS.map((social) => (
              <button
                key={social.label}
                type="button"
                onClick={() => { const href = socialLinks[social.label.toLowerCase()]; if (href) window.open(href, '_blank', 'noopener,noreferrer'); else showToast('Esta rede social ainda não foi configurada.', 'info'); }}
                aria-label={social.label}
              >
                <Icon name={social.icon} />
              </button>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h3 className="footer-title">Blog</h3>
          <ul className="footer-posts">
            {blogPosts.map((post) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`} className="footer-post">
                  <img src={post.imageThumb} alt="" loading="lazy" />
                  <span>
                    <strong>{post.title}</strong>
                    <small>{formatDatePt(post.date)}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-title">Etiquetas</h3>
          <div className="tag-cloud">
            {FOOTER_TAGS.map((tag) => (
              <Link key={tag} to={`/shop?tag=${encodeURIComponent(tag)}`} className="tag">
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h3 className="footer-title">Categorias</h3>
          <ul className="footer-links">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link to={`/product-category/${category.slug}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-title">Informações</h3>
          <ul className="footer-links">
            <li><Link to="/">Início</Link></li>
            <li><Link to="/category/news">Notícias</Link></li>
            <li><Link to="/shop">Loja</Link></li>
            <li><Link to="/about-us">Sobre Nós</Link></li>
            <li><Link to="/contact-us">Contacte-nos</Link></li>
            <li><Link to="/faqs">Perguntas Frequentes</Link></li>
            <li><Link to="/politica-de-privacidade">Política de privacidade</Link></li>
            <li><Link to="/termos-e-condicoes">Termos e condições</Link></li>
            <li><Link to="/pedido">Acompanhar pedido</Link></li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p>© {new Date().getFullYear()} GameAO. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
