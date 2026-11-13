import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: string;
}

export function EmptyState({ title, children, action, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon" aria-hidden="true">{icon}</div>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
