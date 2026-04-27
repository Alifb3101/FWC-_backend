export const sanitizeSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const buildProductImageKey = (slug: string, index: number): string => {
  const filename = index === 0 ? 'main.webp' : `gallery-${index}.webp`;
  return `products/${slug}/${filename}`;
};

export const buildProductVideoKey = (slug: string, extension: string): string =>
  `products/${slug}/video.${extension}`;

export const buildPublicUrl = (baseUrl: string, key: string): string => {
  const normalized = baseUrl.replace(/\/+$/g, '');
  return `${normalized}/${key}`;
};

export const extractKeyFromPublicUrl = (baseUrl: string, url: string): string | null => {
  const normalized = baseUrl.replace(/\/+$/g, '');
  if (!url.startsWith(normalized)) {
    return null;
  }

  const key = url.slice(normalized.length + 1);
  return key.length > 0 ? key : null;
};
