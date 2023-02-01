import createApiHandler from '@/lib/api/createHandler';
import axios from 'axios';
import metascraper, { Check, Rule } from 'metascraper';

import MetaAuthor from 'metascraper-author';
import MetaDescription from 'metascraper-description';
import MetaImage from 'metascraper-image';
import MetaLogo from 'metascraper-logo-favicon';
import MetaTitle from 'metascraper-title';
import MetaUrl from 'metascraper-url';
import MetaYoutube from 'metascraper-youtube';
import MetaSpotify from 'metascraper-spotify';

const parser = metascraper([
  MetaAuthor(),
  MetaDescription(),
  MetaImage(),
  MetaLogo(),
  MetaTitle(),
  MetaUrl(),
  MetaYoutube(),
  MetaSpotify(),
  (() => ({
    color: [
      // @ts-expect-error - This is a valid usage
      ({ htmlDom: $ }) => $('meta[name="theme-color"]').attr('content'),
    ] as Check[]
  }) as unknown as Rule)()
]);

export default createApiHandler()
  .get(async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ message: 'No URL specified' });

    const html = await axios({
      url,
      method: 'GET',
      headers: {
        'User-Agent': 'BONFiRE/1.0.0',
      }
    })
      .then((fetchRes) => fetchRes.data)
      .catch(() => null);

    if (!html) {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    const metadata = (await parser({
      html,
      url,
    })) as unknown as EmbedData;

    switch (metadata.publisher) {
      case 'YouTube': {
        metadata.color = '#f92020';
        break;
      }

      case 'Spotify': {
        metadata.color = '#2fd615';
        break;
      }

      default: break;
    }

    return res.status(200).json({ payload: metadata });
  });