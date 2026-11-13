import type { CSSProperties } from 'react';

export type IconName =
  | 'cart'
  | 'search'
  | 'user'
  | 'heart'
  | 'compare'
  | 'menu'
  | 'close'
  | 'star'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowDown'
  | 'arrowUp'
  | 'share'
  | 'social'
  | 'check'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'telegram'
  | 'whatsapp'
  | 'plus'
  | 'category'
  | 'clock'
  | 'phone';

const GLYPHS: Record<IconName, string> = {
  cart: 'F013',
  search: 'F010',
  user: 'F008',
  heart: 'F014',
  compare: 'F031',
  menu: 'F006',
  close: 'F001',
  star: 'F030',
  arrowLeft: 'F003',
  arrowRight: 'F002',
  arrowDown: 'F005',
  arrowUp: 'F004',
  share: 'F029',
  social: 'F009',
  check: 'F044',
  facebook: 'FC01',
  instagram: 'FC04',
  twitter: 'FC08',
  telegram: 'FC07',
  whatsapp: 'FC03',
  plus: 'F016',
  category: 'F007',
  clock: 'F046',
  phone: 'F012',
};

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className = '', size }: IconProps) {
  const style: CSSProperties & Record<string, string> = {
    ['--vb-icon']: `'\\${GLYPHS[name]}'`,
  };
  if (size) style.fontSize = `${size}px`;
  return <i className={`icn ${className}`} style={style} aria-hidden="true" />;
}
