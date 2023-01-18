import admin from '@/lib/firebase/admin';
import { NextApiRequest, NextApiResponse } from 'next';
import { Middleware } from 'next-connect';

const verifyFireauth: Middleware<NextApiRequest, NextApiResponse> = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) return res.status(401).json({ message: 'Unauthorized' });

    const decodedToken = await admin.auth().verifyIdToken(authorization);
    const { uid } = decodedToken;
    const user = await admin.auth().getUser(uid);

    req.user = user;

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export default verifyFireauth;