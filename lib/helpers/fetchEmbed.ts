import fetcher from '../api/fetcher';

export default async function fetchEmbed(url: string, cancelSignal?: AbortSignal) {
  const fetched = await fetcher.get<SemanticResponse<EmbedData>>(
    `/embed?url=${encodeURIComponent(url)}`,
    {
      signal: cancelSignal,
      headers: {
        'Cache-Control': 'max-age=86400'
      }
    }
  ).then((res) => res.data.payload).catch(() => null);

  return fetched;
}