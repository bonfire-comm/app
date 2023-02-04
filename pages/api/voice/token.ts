import createApiHandler from '@/lib/api/createHandler';
import admin from '@/lib/firebase/admin';
import { sign } from 'jsonwebtoken';

export default createApiHandler<VoiceTokenPayload>(['verifyFireauth'])
  .get(async (req, res) => {
    const channel = req.query.channel as string | undefined;
    const permissions: VoiceTokenPayload['permissions'] = ['allow_join'];

    if (req.user && channel) {
      const channelData = await admin.firestore().collection('channels').doc(channel).get();

      if (channelData.exists) {
        const data = channelData.data() as ChannelData | undefined;

        if (data && data.owner === req.user.uid) {
          permissions.push('allow_mod');
        }
      }
    }

    const token = sign({
      apikey: process.env.VIDEOSDK_KEY,
      permissions,
      version: 2,
    }, process.env.VIDEOSDK_SECRET, {
      expiresIn: '1d',
      algorithm: 'HS256',
      encoding: 'utf8',
    });

    return res.json({
      payload: {
        token,
        permissions
      }
    });
  });