import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface PopupData {
  id: number;
  title: string;
  message?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  variant?: string | null;
  delay_seconds?: number | null;
  frequency?: string | null;
}

export function AnnouncementPopup({ popup }: { popup: PopupData }) {
  const [open, setOpen] = useState(false);
  const delay = Math.max(0, Number(popup.delay_seconds ?? 2) * 1000);
  const storageKey = `gameao.popup.${popup.id}.${popup.frequency || 'session'}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alreadyShown = popup.frequency === 'always' ? false : sessionStorage.getItem(storageKey) === '1';
    if (alreadyShown) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      if (popup.frequency !== 'always') sessionStorage.setItem(storageKey, '1');
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, popup.frequency, storageKey]);

  if (!open) return null;
  const href = popup.cta_href?.trim();
  const close = () => setOpen(false);
  const action = href ? (href.startsWith('http') ? <a className="popup-announcement__cta btn btn--primary" href={href} target="_blank" rel="noreferrer">{popup.cta_label || 'Saiba mais'}</a> : <Link className="popup-announcement__cta btn btn--primary" to={href} onClick={close}>{popup.cta_label || 'Saiba mais'}</Link>) : null;

  return (
    <div className="popup-announcement" role="dialog" aria-modal="true" aria-label={popup.title} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className={`popup-announcement__card popup-announcement__card--${popup.variant || 'default'}`}>
        <button type="button" className="popup-announcement__close" onClick={close} aria-label="Fechar aviso">×</button>
        {popup.image_url && <img className="popup-announcement__image" src={popup.image_url} alt="" />}
        <div className="popup-announcement__body">
          <p className="page-kicker">GameAO</p>
          <h2>{popup.title}</h2>
          {popup.message && <p>{popup.message}</p>}
          <div className="popup-announcement__actions"><button type="button" className="btn btn--outline" onClick={close}>Fechar</button>{action}</div>
        </div>
      </div>
    </div>
  );
}
