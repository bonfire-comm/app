import createApiHandler from '@/lib/api/createHandler';
import axios from 'axios';
import { z } from 'zod';

const validator = z.object({
  token: z.string(),
  channel: z.string(),
});

export default createApiHandler<RoomData>(['verifyFireauth'])
  .post(async (req, res) => {
    const validated = validator.safeParse(req.body);

    if (!validated.success) return res.status(400).json({ message: 'Bad body', errors: validated.error.issues });

    const data = await axios.post('https://api.videosdk.live/v2/rooms', {
      customRoomId: validated.data.channel,
    }, {
      headers: {
        'Authorization': validated.data.token,
      }
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e.response?.data);

      return null;
    });

    if (!data) {
      return res.status(400).json({ message: 'Something went wrong' });
    }

    return res.json({
      payload: data.data
    });
  });