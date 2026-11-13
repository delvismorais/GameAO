export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function Tabs({ tabs, active, onChange, className = '', ariaLabel = 'Filtrar' }: TabsProps) {
  return (
    <div className={`tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tabs__item ${active === tab.id ? 'is-active' : ''}`.trim()}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
