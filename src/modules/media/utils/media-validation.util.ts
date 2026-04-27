export const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
]);

export const resolveVideoExtension = (mimeType: string): string | null => {
  if (mimeType === 'video/mp4') {
    return 'mp4';
  }

  if (mimeType === 'video/webm') {
    return 'webm';
  }

  return null;
};
