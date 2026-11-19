import { useEffect, useState } from 'react';
import { POSTS, type Post } from '../data/posts';
import { DEFAULT_HOMEPAGE_CONTENT, type HomepageContentConfig } from '../data/site';

export interface HomepageRuntimeData {
  content: HomepageContentConfig;
  posts: Post[];
  loading: boolean;
}

function mergeContent(value: unknown): HomepageContentConfig {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<HomepageContentConfig>;
  const mergeVariant = (id: 'home1' | 'home2') => ({
    ...DEFAULT_HOMEPAGE_CONTENT[id],
    ...((raw[id] && typeof raw[id] === 'object' ? raw[id] : {}) as object),
  });
  return {
    ...DEFAULT_HOMEPAGE_CONTENT,
    primaryHome: raw.primaryHome === 'home1' ? 'home1' : 'home2',
    home1: mergeVariant('home1'),
    home2: mergeVariant('home2'),
  };
}

export function useHomepageContent(): HomepageRuntimeData {
  const [content, setContent] = useState<HomepageContentConfig>(DEFAULT_HOMEPAGE_CONTENT);
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/homepage-content').then((response) => response.ok ? response.json() as Promise<{ content?: unknown }> : null).catch(() => null),
      fetch('/api/blog/posts').then((response) => response.ok ? response.json() as Promise<{ posts?: Post[] }> : null).catch(() => null),
    ]).then(([homepage, blog]) => {
      if (!active) return;
      if (homepage?.content) setContent(mergeContent(homepage.content));
      if (blog?.posts?.length) setPosts(blog.posts);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { content, posts, loading };
}

export function normalizeHomepageContent(value: unknown): HomepageContentConfig {
  return mergeContent(value);
}
