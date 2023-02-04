import createApiHandler from '@/lib/api/createHandler';
import axios from 'axios';
import { z } from 'zod';

const validator = z.object({
  token: z.string(),
  channel: z.string(),
});

export default createApiHandler<SessionData | null>(['verifyFireauth'])
  .get(async (req, res) => {
    const validated = validator.safeParse(req.query);

    if (!validated.success) return res.status(400).json({ message: 'Bad query', errors: validated.error.issues });

    const data = await axios.get<{ data: SessionData[] }>('https://api.videosdk.live/v2/sessions', {
      headers: {
        'Authorization': validated.data.token,
      },
      params: {
        customRoomId: validated.data.channel
      }
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);

      return null;
    });

    if (!data) {
      return res.status(404).json({ message: 'Not found' });
    }

    const notEnded = data.data.data.find((session) => session.status !== 'ended');
    if (!notEnded) {
      return res.json({
        payload: null
      });
    }

    const activeParticipants = notEnded.participants.filter((participant) => participant.timelog[0].end === null);

    return res.json({
      payload: {
        ...notEnded,
        participants: activeParticipants
      }
    });
  });