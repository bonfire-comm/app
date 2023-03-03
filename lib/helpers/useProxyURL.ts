const ignoreList = [
  '/api/image',
];

const checkPrefix = [
  'http',
  'https',
];

export default function useProxyURL(url?: string | null) {
  if (!url) return;
  if (ignoreList.some((s) => url.startsWith(s)) || !checkPrefix.some((s) => url.startsWith(s))) return url;

  return `/api/image?url=${encodeURIComponent(url)}`;
}