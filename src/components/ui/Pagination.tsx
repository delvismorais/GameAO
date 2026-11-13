import { Icon } from './Icon';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        type="button"
        className="pagination__arrow"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        <Icon name="arrowLeft" />
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          className={`pagination__page ${number === page ? 'is-current' : ''}`.trim()}
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        className="pagination__arrow"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Página seguinte"
      >
        <Icon name="arrowRight" />
      </button>
    </nav>
  );
}
