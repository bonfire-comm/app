import getUserFromToken from '@/lib/helpers/getUserFromToken';
import { NextApiRequest, NextApiResponse } from 'next';
import { Middleware } from 'next-connect';

const verifyFireauth: Middleware<NextApiRequest, NextApiResponse> = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    const token = req.cookies.token || authorization;

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);

    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default verifyFireauth;