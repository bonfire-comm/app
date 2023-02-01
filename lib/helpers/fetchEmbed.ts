import fetcher from '../api/fetcher';

const cache = new Map<string, EmbedData>();

export default async function fetchEmbed(url: string, cancelSignal?: AbortSignal) {
  const cached = cache.get(url);
  if (cached) return cached;

  const fetched = await fetcher.get<SemanticResponse<EmbedData>>(
    `/embed?url=${encodeURIComponent(url)}`,
    {
      signal: cancelSignal,
      headers: {
        'Cache-Control': 'max-age=86400'
      }
    }
  ).then((res) => res.data.payload).catch(() => null);

  if (fetched) {
    cache.set(url, fetched);

    setTimeout(() => cache.delete(url), 60_000); // 1 minute
  }

  return fetched;
}