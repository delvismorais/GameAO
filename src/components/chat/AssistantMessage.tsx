import type { ReactNode } from 'react';

function internalHref(value: string): string | null {
  const href = value.trim();
  if (href.startsWith('/') && !href.startsWith('//')) {
    try {
      const url = new URL(href, 'https://gameao.shop');
      if (url.origin === 'https://gameao.shop') return `${url.pathname}${url.search}${url.hash}`;
    } catch { /* caminho inválido */ }
    return null;
  }
  try {
    const url = new URL(href);
    if (url.protocol === 'https:' && ['gameao.shop', 'www.gameao.shop', 'gameao.onrender.com'].includes(url.hostname)) return url.toString();
  } catch { /* ligações externas arbitrárias não são clicáveis */ }
  return null;
}

function inlineContent(text: string): ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const pieces = text.split(tokenPattern).filter((piece) => piece.length > 0);
  return pieces.map((piece, index) => {
    if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={index}>{piece.slice(2, -2)}</strong>;
    if (piece.startsWith('*') && piece.endsWith('*')) return <em key={index}>{piece.slice(1, -1)}</em>;
    if (piece.startsWith('`') && piece.endsWith('`')) return <code key={index}>{piece.slice(1, -1)}</code>;
    const link = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = internalHref(link[2]);
      return href ? <a key={index} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{link[1]}</a> : <span key={index}>{link[1]}</span>;
    }
    return <span key={index}>{piece.replace(/\*\*/g, '').replace(/`/g, '')}</span>;
  });
}

export function AssistantMessage({ text }: { text: string }) {
  const cleaned = text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/^\s*```[a-z0-9_-]*\s*$/gim, '')
    .trim();
  const lines = cleaned.split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: Array<{ text: string; number: number }> = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{inlineContent(paragraph.join(' ').replace(/\s{2,}/g, ' ').trim())}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    const ordered = listItems[0].number > 0;
    const items = listItems.map((item, index) => <li key={`${blocks.length}-${index}`}>{inlineContent(item.text)}</li>);
    blocks.push(ordered ? <ol key={`l-${blocks.length}`}>{items}</ol> : <ul key={`l-${blocks.length}`}>{items}</ul>);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^[-*_]{3,}$/.test(line)) { flushParagraph(); flushList(); continue; }
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      blocks.push(<h4 key={`h-${blocks.length}`}>{inlineContent(heading[1])}</h4>);
      continue;
    }
    const item = line.match(/^(?:([-*•])\s+|(\d+)[.)]\s+)(.+)$/);
    if (item) {
      flushParagraph();
      listItems.push({ text: item[3], number: item[2] ? Number(item[2]) : 0 });
      continue;
    }
    flushList();
    paragraph.push(line.replace(/^>\s?/, ''));
  }
  flushParagraph();
  flushList();
  return <>{blocks.length ? blocks : <p />}</>;
}
