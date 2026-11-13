import { useState } from 'react';

export interface AccordionItem {
  q: string;
  a: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `faq-panel-${index}`;
        return (
          <div className={`accordion__item ${isOpen ? 'is-open' : ''}`.trim()} key={item.q}>
            <button
              type="button"
              className="accordion__trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              <span>{item.q}</span>
              <span className="accordion__sign" aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            <div className="accordion__panel" id={panelId} hidden={!isOpen}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
