const PATHS: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  bag: 'M6 7h12l1 14H5L6 7zM9 7a3 3 0 0 1 6 0',
  card: 'M2 6h20v12H2zM2 10h20M6 15h4',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  image: 'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M15 9h.01',
  users: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 6-6s6 2 6 6M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5-5-5.5',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  plug: 'M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  shield: 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z',
  truck: 'M1 4h13v11H1zM14 8h4l3 3v4h-7M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  tag: 'M3 3h8l10 10-8 8L3 11zM7 7h.01',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  file: 'M6 2h8l4 4v16H6zM14 2v5h4M9 13h6M9 17h6',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  upload: 'M12 21V9M7 14l5-5 5 5M4 3h16',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7',
  edit: 'M4 20h4L20 8l-4-4L4 16z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  refresh: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  logout: 'M9 3H4v18h5M16 17l5-5-5-5M21 12H9',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 4v16M4 12h16',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  chevron: 'M9 6l6 6-6 6',
  activity: 'M3 12h4l3 8 4-16 3 8h4',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  heart: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z',
  key: 'M15 7a4 4 0 1 1-4 4L3 19v2h3v-3h3v-3h3l1-1',
  database: 'M12 3c5 0 9 1.5 9 3.5S17 10 12 10 3 8.5 3 6.5 7 3 12 3zM3 6.5v11c0 2 4 3.5 9 3.5s9-1.5 9-3.5v-11M3 12c0 2 4 3.5 9 3.5s9-1.5 9-3.5',
};

export type AdminIconName = keyof typeof PATHS;

export function AdminIcon({ name, size = 17 }: { name: string; size?: number }) {
  const path = PATHS[name] ?? PATHS.grid;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
