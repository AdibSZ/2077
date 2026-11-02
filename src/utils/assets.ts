// Universal asset URL resolver for root domains & GitHub Pages subpaths

export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  // Determine active base path:
  // If we are running on GitHub Pages under /2077/, use /2077/
  // If we are running locally (localhost:5173 / IP) or root domain, use /
  let base = import.meta.env.BASE_URL || '/';
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/2077')) {
      base = '/2077/';
    } else {
      base = '/';
    }
  }

  const cleanBase = base.endsWith('/') ? base : base + '/';
  // Strip any leading slash or redundant 2077/ prefix from input path
  const cleanPath = path.replace(/^\/?(2077\/)?/, '');
  return cleanBase + cleanPath;
}
