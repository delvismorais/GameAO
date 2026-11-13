import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '../ui/Breadcrumbs';

interface PageShellProps {
  crumbs?: Crumb[];
  children: ReactNode;
  className?: string;
}

export function PageShell({ crumbs = [], children, className = '' }: PageShellProps) {
  return (
    <div className={`inner-page ${className}`.trim()}>
      <div className="container">
        {crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        <div className="page-card">{children}</div>
      </div>
    </div>
  );
}
