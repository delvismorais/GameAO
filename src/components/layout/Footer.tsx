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
  const blogPosts = POSTS.slice(0, 2);
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="footer-col footer-col--about">
          <Link to="/" className="footer-logo">
            <img src="/assets/logo.png" alt="GameAO" />
          </Link>
          <p>
            {STORE_INFO.tagline} com preços em kwanzas e conteúdos em português de Angola.
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
                onClick={() => showToast('As redes sociais serão geridas nas Configurações.', 'info')}
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
            <li><Link to="/acompanhar-pedido">Acompanhar pedido</Link></li>
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
