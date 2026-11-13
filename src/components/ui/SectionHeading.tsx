import { Tabs, type TabItem } from './Tabs';

interface SectionHeadingProps {
  title: string;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

export function SectionHeading({ title, tabs, activeTab, onTabChange }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <h2 className="section-heading__title">{title}</h2>
      {tabs && activeTab && onTabChange && (
        <Tabs tabs={tabs} active={activeTab} onChange={onTabChange} ariaLabel={title} />
      )}
    </div>
  );
}
