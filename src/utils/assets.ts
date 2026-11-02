// Universal asset URL resolver for root domains & GitHub Pages subpaths

export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  
  // Prevent double-prefixing if path already includes the subpath
  if (cleanBase !== '/' && (path === cleanBase || path.startsWith(cleanBase))) {
    return path;
  }
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanBase + cleanPath;
}
