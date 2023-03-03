import createApiHandler from '@/lib/api/createHandler';
import axios from 'axios';

export default createApiHandler()
  .get(async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ message: 'No URL specified' });

    try {
      const fetchRes = await axios(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        },
        responseType: 'stream'
      });

      fetchRes.data.pipe(res);
    } catch (e) {
      // console.error(e);
      res.status(400).json({ message: 'Invalid URL' });
    }
  });