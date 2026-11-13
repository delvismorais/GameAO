import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Migalhas de navegação">
      <ol>
        <li>
          <Link to="/">Início</Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link to={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
